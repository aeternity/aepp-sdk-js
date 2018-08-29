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
import { decodeTx, deserialize } from '../utils/crypto'
import { w3cwebsocket as WebSocket } from 'websocket'
import { EventEmitter } from 'events'
import * as R from 'ramda'

const channelStatusFromEvent = {
  channel_open: 'initialized',
  channel_accept: 'accepted',
  funding_created: 'halfSigned',
  funding_signed: 'signed',
  own_funding_locked: 'open',
  funding_locked: 'open',
  died: 'died'
}

// TODO: This is copy-paste from '../utils/swagger'.
//       Move this to separate module.
function pascalToSnake (s) {
  return s.replace(/[A-Z]/g, match => `_${R.toLower(match)}`)
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

  const update = pendingUpdates.shift()
  setPrivate(i, {updateInProgress: true})
  send(i, {
    action: 'update',
    tag: 'new',
    payload: update
  })
}

function txSignCallback (i, action) {
  return function (tx) {
    send(i, {
      action,
      payload: { tx }
    })
  }
}

function onMessage (i, data) {
  const { emitter } = priv.get(i)
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
      return emitter.emit('sign', {
        tag: msg.tag,
        tx: msg.payload.tx,
        callback: txSignCallback(i, msg.tag)
      })
    case 'update':
      changeState(i, R.pick([
        'channelId',
        'initiator',
        'responder',
        'initiatorAmount',
        'responderAmount',
        'updates',
        'state',
        'previousRound',
        'round'
      ], deserialize(decodeTx(msg.payload.state))))
      setPrivate(i, { updateInProgress: false })
      return sendNextUpdate(i)
    case 'on_chain_tx':
      return emitter.emit('onChainTx', {tx: msg.payload.tx})
    case 'error':
      return emitter.emit('error', msg.payload)
    case 'conflict':
      setPrivate(i, {updateInProgress: false})
      return sendNextUpdate(i)
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
        ws
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
    update (from, to, amount) {
      priv.get(this).pendingUpdates.push({from, to, amount})
      sendNextUpdate(this)
    },
    shutdown () {
      send(this, {action: 'shutdown'})
    }
  }
})

export default EpochChannel
