/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import Channel from './'
import AsyncInit from '../utils/async-init'
import { decodeTx, deserialize, generateKeyPair } from '../utils/crypto'
import { w3cwebsocket as WebSocket } from 'websocket'
import { EventEmitter } from 'events'
import * as R from 'ramda'
import {pascalToSnake} from '../utils/string'

const channelStatusFromEvent = {
  channel_open: 'initialized',
  channel_accept: 'accepted',
  funding_created: 'halfSigned',
  funding_signed: 'signed',
  own_funding_locked: 'open',
  funding_locked: 'open',
  died: 'died'
}

const priv = new WeakMap()

function setPrivate (i, value) {
  priv.set(i, {
    ...priv.get(i) || {},
    ...value
  })
}

function changeStatus (i, newStatus) {
  const {status, emitter} = priv.get(i)

  if (newStatus && newStatus !== status) {
    setPrivate(i, {status: newStatus})
    emitter.emit('statusChanged', newStatus)
  }
}

function changeState (i, newState) {
  const {state, emitter} = priv.get(i)
  priv.get(i).state = {...state, ...newState}
  emitter.emit('stateChanged', state)
}

function channelURL (url, { endpoint = 'channel', ...params }) {
  const paramString = R.join('&', R.values(R.mapObjIndexed((value, key) =>
    `${pascalToSnake(key)}=${value}`, params)))

  return `${url}/${endpoint}?${paramString}`
}

function send (i, msg) {
  priv.get(i).ws.send(JSON.stringify(msg))
}

function sendNextUpdate (i) {
  const {updateInProgress, pendingUpdates} = priv.get(i)

  if (updateInProgress || !pendingUpdates || !pendingUpdates.length) {
    return
  }

  const {from, to, amount, callback, sign} = pendingUpdates.shift()
  setPrivate(i, {
    updateInProgress: true,
    updateCallback: callback,
    signUpdate: sign
  })
  send(i, {
    action: 'update',
    tag: 'new',
    payload: {from, to, amount},
    signUpdate: sign
  })
}

function finishUpdate (i, err, state) {
  const {updateCallback} = priv.get(i)

  setPrivate(i, {
    updateInProgress: false,
    updateCallback: null,
    updateSigned: undefined,
    signUpdate: null
  })
  if (updateCallback) {
    updateCallback(err, state)
    sendNextUpdate(i)
  }
}

function rejectUpdate (i) {
  send(i, {
    action: 'update',
    tag: 'new',
    payload: {
      from: generateKeyPair().pub,
      to: generateKeyPair().pub,
      amount: 1
    }
  })
}

function onMessage (i, data) {
  const {emitter, sign, updateSigned, signUpdate} = priv.get(i)
  const msg = JSON.parse(data)

  switch (msg.action) {
    case 'info':
      if (msg.payload.event === 'update') {
        setPrivate(i, {updateInProgress: true})
      }
      if (msg.payload.event === 'open') {
        setPrivate(i, {channelId: msg.channel_id})
      }
      return changeStatus(i, channelStatusFromEvent[msg.payload.event])
    case 'sign':
      const signPromise = msg.tag === 'update'
        ? signUpdate(msg.payload.tx)
        : sign(msg.tag, msg.payload.tx)
      return Promise.resolve(signPromise).then(tx => {
        if (!tx) {
          if (msg.tag === 'update') {
            setPrivate(i, {updateSigned: false})
          }
          return rejectUpdate(i)
        }
        if (msg.tag === 'update') {
          setPrivate(i, {updateSigned: true})
        }
        send(i, {
          action: msg.tag,
          payload: { tx }
        })
      })
    case 'update':
      const state = R.pick([
        'channelId',
        'initiator',
        'responder',
        'initiatorAmount',
        'responderAmount',
        'updates',
        'state',
        'previousRound',
        'round'
      ], deserialize(decodeTx(msg.payload.state)).tx)
      changeState(i, state)
      return finishUpdate(i, null, state)
    case 'on_chain_tx':
      return emitter.emit('onChainTx', {tx: msg.payload.tx})
    case 'error':
      // ignore update conflict if update has been rejected by acknowledger
      if (msg.payload.reason === 'conflict' && updateSigned === undefined) {
        return null
      }
      return emitter.emit('error', msg.payload)
    case 'conflict':
      return finishUpdate(i, updateSigned === true ? null : new Error('conflict'), null)
  }
}

const EpochChannel = AsyncInit.compose(Channel, {
  async init (options) {
    const params = R.pick([
      'initiator',
      'responder',
      'pushAmount',
      'initiatorAmount',
      'responderAmount',
      'channelReserve',
      'ttl',
      'host',
      'port',
      'lockPeriod',
      'role'
    ], options)

    await new Promise((resolve, reject) => {
      const resolveOnce = R.once(resolve)
      const rejectOnce = R.once(reject)
      const ws = new WebSocket(channelURL(options.url, params))
      ws.onmessage = ({ data }) => onMessage(this, data)
      ws.onopen = () => {
        resolveOnce()
        changeStatus(this, 'connected')
      }
      ws.onclose = () => changeStatus(this, 'disconnected')
      ws.onerror = (err) => rejectOnce(err)

      setPrivate(this, {
        status: 'conecting',
        emitter: new EventEmitter(),
        updateInProgress: false,
        pendingUpdates: [],
        state: R.pick(['initiator', 'responder', 'initiatorAmount', 'responderAmount'], options),
        params,
        ws,
        sign: options.sign
      })
    })
  },
  methods: {
    on (e, fn) {
      const {emitter} = priv.get(this)
      emitter.on(e, fn)
    },
    status () {
      return priv.get(this).status
    },
    state () {
      return priv.get(this).state
    },
    update (from, to, amount, sign) {
      return new Promise((resolve, reject) => {
        priv.get(this).pendingUpdates.push({
          from,
          to,
          amount,
          sign,
          callback (err, tx) {
            if (err) {
              return reject(err)
            }
            return resolve(tx)
          }
        })
        sendNextUpdate(this)
      })
    },
    shutdown () {
      send(this, {action: 'shutdown'})
    }
  }
})

export default EpochChannel
