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
import {w3cwebsocket as WebSocket} from 'websocket'
import {EventEmitter} from 'events'
import * as R from 'ramda'
import {pascalToSnake} from '../utils/string'
import {generateKeyPair} from '../utils/crypto'

const channelOptions = new WeakMap()
const channelStatus = new WeakMap()
const channelState = new WeakMap()
const connections = new WeakMap()
const emitters = new WeakMap()
const pendingUpdates = new WeakMap()
const currentState = new WeakMap()
const messageQueue = new WeakMap()
const isProcessingMessage = new WeakMap()

function channelURL (url, { endpoint = 'channel', ...params }) {
  const paramString = R.join('&', R.values(R.mapObjIndexed((value, key) =>
    `${pascalToSnake(key)}=${value}`, params)))

  return `${url}/${endpoint}?${paramString}`
}

function changeStatus (channel, newStatus) {
  const status = channelStatus.get(channel)
  const emitter = emitters.get(channel)
  if (newStatus !== status) {
    channelStatus.set(channel, newStatus)
    emitter.emit('statusChanged', newStatus)
  }
}

function changeState (channel, newState) {
  const emitter = emitters.get(channel)
  const prevState = channelState.get(channel)
  const state = {...prevState, ...newState}
  channelState.set(channel, state)
  emitter.emit('stateChanged', state)
}

function send (channel, message) {
  connections.get(channel).send(JSON.stringify(message, undefined, 2))
}

function awaitingConnection (channel, message, state) {
  if (message.action === 'info') {
    if (['channel_accept', 'funding_created'].includes(message.payload.event)) {
      changeStatus(channel, {
        channel_accept: 'accepted',
        funding_created: 'halfSigned'
      }[message.payload.event])
      return {handler: awaitingChannelCreateTx}
    }
    return {handler: awaitingConnection}
  }
}

async function awaitingChannelCreateTx (channel, message, state) {
  if (message.action === 'sign') {
    const signedTx = await channelOptions.get(channel).sign(message.tag, message.payload.tx)
    send(channel, {action: message.tag, payload: {tx: signedTx}})
    return {handler: awaitingOnChainTx}
  }
}

function awaitingOnChainTx (channel, message, state) {
  if (message.action === 'on_chain_tx') {
    emitters.get(channel).emit('onChainTx', message.payload.tx)
    return {handler: awaitingBlockInclusion}
  }
  if (
    message.action === 'info' &&
    message.payload.event === 'funding_signed' &&
    channelOptions.get(channel).role === 'initiator'
  ) {
    changeStatus(channel, 'signed')
    return {handler: awaitingOnChainTx}
  }
}

function awaitingBlockInclusion (channel, message, state) {
  if (message.action === 'info') {
    const handler = {
      own_funding_locked: awaitingBlockInclusion,
      funding_locked: awaitingOpenConfirmation
    }[message.payload.event]
    if (handler) {
      return {handler}
    }
  }
}

function awaitingOpenConfirmation (channel, message, state) {
  if (message.action === 'info' && message.payload.event === 'open') {
    return {handler: awaitingInitialState}
  }
}

function awaitingInitialState (channel, message, state) {
  if (message.action === 'update') {
    changeState(channel, message.payload.state)
    return {handler: channelOpen}
  }
}

async function channelOpen (channel, message, state) {
  if (message.action === 'info') {
    if (message.payload.event === 'died') {
      changeStatus(channel, 'died')
    }
    const handler = {
      update: awaitingUpdateTxSignRequest,
      close_mutual: channelOpen,
      died: channelClosed
    }[message.payload.event]
    if (handler) {
      return {handler}
    }
  }
  if (message.action === 'sign' && message.tag === 'shutdown_sign_ack') {
    const signedTx = await Promise.resolve(channelOptions.get(channel).sign(message.tag, message.payload.tx))
    send(channel, {action: message.tag, payload: {tx: signedTx}})
    return {handler: channelOpen}
  }
  if (message.action === 'on_chain_tx') {
    emitters.get(channel).emit('onChainTx', message.payload.tx)
    return {handler: channelOpen}
  }
}
channelOpen.enter = (channel) => {
  changeStatus(channel, 'open')
  sendNextUpdate(channel)
}

async function awaitingOffChainTx (channel, message, state) {
  if (message.action === 'sign' && message.tag === 'update') {
    const {sign} = state
    const signedTx = await sign(message.payload.tx)
    send(channel, {action: message.tag, payload: {tx: signedTx}})
    return {handler: awaitingOffChainUpdate, state}
  }
  if (message.action === 'error') {
    state.callback(new Error(JSON.stringify(message.payload)))
    return {handler: channelOpen}
  }
}

function awaitingOffChainUpdate (channel, message, state) {
  if (message.action === 'update') {
    changeState(channel, message.payload.state)
    state.callback(null, {accepted: true, state: message.payload.state})
    return {handler: channelOpen}
  }
  if (message.action === 'conflict') {
    state.callback(null, {accepted: false})
    return {handler: channelOpen}
  }
}

async function awaitingUpdateTxSignRequest (channel, message, state) {
  if (message.action === 'sign' && message.tag === 'update_ack') {
    const signedTx = await channelOptions.get(channel).sign(message.tag, message.payload.tx)
    if (signedTx) {
      send(channel, {action: message.tag, payload: {tx: signedTx}})
      return {handler: awaitingUpdateTx}
    }
    // soft-reject via competing update
    send(channel, {
      action: 'update',
      tag: 'new',
      payload: {
        from: generateKeyPair().pub,
        to: generateKeyPair().pub,
        amount: 1
      }
    })
    return {handler: awaitingUpdateConflict}
  }
}

function awaitingUpdateTx (channel, message, state) {
  if (message.action === 'update') {
    return {handler: channelOpen}
  }
}

function awaitingUpdateConflict (channel, message, state) {
  if (message.action === 'error' && message.payload.reason === 'conflict') {
    return {handler: awaitingUpdateConflict}
  }
  if (message.action === 'conflict') {
    return {handler: channelOpen}
  }
}

async function awaitingShutdownTx (channel, message, state) {
  if (message.action === 'sign' && message.tag === 'shutdown_sign') {
    const signedTx = await Promise.resolve(state.sign(message.payload.tx))
    send(channel, {action: message.tag, payload: {tx: signedTx}})
    return {handler: awaitingShutdownOnChainTx, state}
  }
}

function awaitingShutdownOnChainTx (channel, message, state) {
  if (message.action === 'on_chain_tx') {
    state.resolveShutdownPromise(message.payload.tx)
    return {handler: channelOpen}
  }
}

function channelClosed (channel, message, state) {
  return {handler: channelClosed}
}

async function handleMessage (channel, message) {
  const { handler, state } = currentState.get(channel)
  const nextState = await Promise.resolve(handler(channel, message, state))
  if (!nextState) {
    throw new Error('State Channels FSM entered unknown state')
  }
  currentState.set(channel, nextState)
  if (nextState.handler.enter) {
    nextState.handler.enter(channel)
  }
}

async function onMessage (channel, message) {
  const queue = messageQueue.get(channel) || []
  messageQueue.set(channel, [...queue, JSON.parse(message)])
  processMessageQueue(channel)
}

function processMessageQueue (channel) {
  const queue = messageQueue.get(channel)
  if (isProcessingMessage.get(channel) || !queue.length) {
    return
  }
  const [message, ...remaining] = queue
  messageQueue.set(channel, remaining || [])
  isProcessingMessage.set(channel, true)
  handleMessage(channel, message).then(() => {
    isProcessingMessage.set(channel, false)
    processMessageQueue(channel)
  })
}

function sendNextUpdate (channel) {
  const queue = pendingUpdates.get(channel) || []
  if (currentState.get(channel).handler !== channelOpen || !queue.length) {
    return
  }
  const [update, ...remaining] = queue
  const {from, to, amount, callback, sign} = update
  currentState.set(channel, {
    handler: awaitingOffChainTx,
    state: {callback, sign}
  })
  send(channel, {
    action: 'update',
    tag: 'new',
    payload: {from, to, amount}
  })
  pendingUpdates.set(channel, remaining)
}

/**
 * Register event listener function
 *
 * @param {string} event - Event name
 * @param {function} callback - Callback function
 */
function on (event, callback) {
  emitters.get(this).on(event, callback)
}

/**
 * Get current status
 *
 * @return {string}
 */
function status () {
  channelStatus.get(this)
}

/**
 * Get current state
 *
 * @return {object}
 */
function state () {
  channelState.get(this)
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
 * ).then({accepted, state} =>
 *   if (accepted) {
 *     console.log('Update has been accepted')
 *   }
 * )
 */
function update (from, to, amount, sign) {
  return new Promise((resolve, reject) => {
    const queue = pendingUpdates.get(this) || []
    pendingUpdates.set(this, [...queue, {
      from,
      to,
      amount,
      sign,
      callback (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      }
    }])
    sendNextUpdate(this)
  })
}

/**
 * Trigger a channel shutdown
 *
 * Returned promise resolves to on-chain transaction.
 * @param {function} sign - Function which verifies and signs transaction
 * @return {Promise}
 * @example channel.shutdown(
 *   async (tx) => await account.signTransaction(tx)
 * ).then(tx => console.log('on_chain_tx', tx))
 */
function shutdown (sign) {
  return new Promise((resolve) => {
    currentState.set(this, {
      handler: awaitingShutdownTx,
      state: {
        sign,
        resolveShutdownPromise: resolve
      }
    })
    send(this, {action: 'shutdown'})
  })
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

    channelOptions.set(this, options)
    emitters.set(this, new EventEmitter())
    currentState.set(this, { handler: awaitingConnection, state: {} })

    await new Promise((resolve, reject) => {
      const resolveOnce = R.once(resolve)
      const rejectOnce = R.once(reject)
      const ws = new WebSocket(channelURL(options.url, params))
      connections.set(this, ws)
      ws.onmessage = ({ data }) => onMessage(this, data)
      ws.onopen = () => {
        resolveOnce()
        changeStatus(this, 'connected')
      }
      ws.onclose = () => changeStatus(this, 'disconnected')
      ws.onerror = (err) => rejectOnce(err)
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
