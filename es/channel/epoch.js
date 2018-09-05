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

/**
 * EpochChannel module
 * @module @aeternity/aepp-sdk/es/channel/epoch
 * @export EpochChannel
 * @example import EpochChannel from '@aeternity/aepp-sdk/es/channel/epoch'
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

  if (updateCallback) {
    updateCallback(err, err ? null : {accepted: !!state, state})
  }
  setPrivate(i, {
    updateInProgress: false,
    updateCallback: null,
    updateSigned: undefined,
    signUpdate: null
  })
  sendNextUpdate(i)
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

/**
 * Register event listener function
 *
 * @param {string} event - Event name
 * @param {function} callback - Callback function
 */
function on (event, callback) {
  const {emitter} = priv.get(this)
  emitter.on(event, callback)
}

/**
 * Get current status
 *
 * @return {string}
 */
function status () {
  return priv.get(this).status
}

/**
 * Get current state
 *
 * @return {object}
 */
function state () {
  return priv.get(this).state
}

/**
 * Trigger an update
 *
 * Returned promise resolves to an object containing `accepted` and `state`
 * properties.
 * @param {string} from - Sender's public address
 * @param {string} to - Receiver's public address
 * @param {number} amount - Transaction amount
 * @param {function} sign - Function which verifies and signs transaction
 * @return {Promise}
 * @example channel.update(
 *   'ak$2QC98ahNHSrZLWKrpQyv91eQfCDA3aFVSNoYKdQ1ViYWVF8Z9d',
 *   'ak$Gi42jcRm9DcZjk72UWQQBSxi43BG3285C9n4QSvP5JdzDyH2o',
 *   10,
 *   async (tx) => await account.signTransaction(tx)
 * )
 */
function update (from, to, amount, sign) {
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
}

/**
 * Trigger a channel shutdown
 */
function shutdown () {
  send(this, {action: 'shutdown'})
}

/**
 * Epoch Channel
 *
 * @function
 * @alias module:@aeternity/aepp-sdk/es/channel/epoch
 * @rtype Channel
 * @param {Object} [options={}] - Initializer object
 * @param {String} options.url - Channel url (for example: "ws://localhost:3001/channel")
 * @param {String} options.role - Participant role ("initiator" or "responder")
 * @param {String} options.initiatorId - Initiator's public key
 * @param {String} options.responderId - Responder's public key
 * @param {Number} options.pushAmount - Initial deposit in favour of the responder by the initiator
 * @param {Number} options.initiatorAmount - Amount of tokens the initiator has committed to the channel
 * @param {Number} options.responderAmount - Amount of tokens the responder has committed to the channel
 * @param {Number} options.channelReserve - The minimum amount both peers need to maintain
 * @param {Number} [options.ttl] - Minimum block height to include the channel_create_tx
 * @param {String} options.host - Host of the responder's node
 * @param {Number} options.port - The port of the responders node
 * @param {Number} options.lockPeriod - Amount of blocks for disputing a solo close
 * @param {Function} options.sign - Function which verifies and signs transactions
 * @return {Object} Channel instance
 * @example EpochChannel({
  url: 'ws://localhost:3001',
  role: 'initiator'
  initiatorId: 'ak$2QC98ahNHSrZLWKrpQyv91eQfCDA3aFVSNoYKdQ1ViYWVF8Z9d',
  responderId: 'ak$Gi42jcRm9DcZjk72UWQQBSxi43BG3285C9n4QSvP5JdzDyH2o',
  pushAmount: 3,
  initiatorAmount: 10,
  responderAmount: 10,
  channelReserve: 2,
  ttl: 1000,
  host: 'localhost',
  port: 3002,
  lockPeriod: 10,
  async sign (tag, tx) => await account.signTransaction(tx)
})
 */
const EpochChannel = AsyncInit.compose(Channel, {
  async init (options) {
    const params = R.pick([
      'initiatorId',
      'responderId',
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
        state: R.pick(['initiatorId', 'responder', 'initiatorAmount', 'responderAmount'], options),
        params,
        ws,
        sign: options.sign
      })
    })
  },
  methods: {
    on,
    status,
    state,
    update,
    shutdown
  }
})

export default EpochChannel
