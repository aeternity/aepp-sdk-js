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

import {w3cwebsocket as W3CWebSocket} from 'websocket'
import {EventEmitter} from 'events'
import * as R from 'ramda'
import {pascalToSnake} from '../utils/string'
import {awaitingConnection} from './handlers'

const options = new WeakMap()
const status = new WeakMap()
const state = new WeakMap()
const fsm = new WeakMap()
const websockets = new WeakMap()
const eventEmitters = new WeakMap()
const messageQueue = new WeakMap()
const messageQueueLocked = new WeakMap()
const actionQueue = new WeakMap()
const actionQueueLocked = new WeakMap()

function channelURL (url, { endpoint = 'channel', ...params }) {
  const paramString = R.join('&', R.values(R.mapObjIndexed((value, key) =>
    `${pascalToSnake(key)}=${value}`, params)))

  return `${url}/${endpoint}?${paramString}`
}

function emit (channel, ...args) {
  eventEmitters.get(channel).emit(...args)
}

function enterState (channel, nextState) {
  if (!nextState) {
    throw new Error('State Channels FSM entered unknown state')
  }
  fsm.set(channel, nextState)
  if (nextState.handler.enter) {
    nextState.handler.enter(channel)
  }
  dequeueAction(channel)
}

function changeStatus (channel, newStatus) {
  const prevStatus = status.get(channel)
  if (newStatus !== prevStatus) {
    status.set(channel, newStatus)
    emit(channel, 'statusChanged', newStatus)
  }
}

function changeState (channel, newState) {
  state.set(channel, newState)
  emit(channel, 'stateChanged', newState)
}

function send (channel, message) {
  websockets.get(channel).send(JSON.stringify(message, undefined, 2))
}

function enqueueAction (channel, guard, action) {
  actionQueue.set(channel, [
    ...actionQueue.get(channel) || [],
    {guard, action}
  ])
  dequeueAction(channel)
}

async function dequeueAction (channel) {
  const locked = actionQueueLocked.get(channel)
  const queue = actionQueue.get(channel) || []
  if (locked || !queue.length) {
    return
  }
  const state = fsm.get(channel)
  const index = queue.findIndex(item => item.guard(channel, state))
  if (index === -1) {
    return
  }
  actionQueue.set(channel, queue.filter((_, i) => index !== i))
  actionQueueLocked.set(channel, true)
  const nextState = await Promise.resolve(queue[index].action(channel, state))
  actionQueueLocked.set(channel, false)
  enterState(channel, nextState)
}

async function handleMessage (channel, message) {
  const { handler, state } = fsm.get(channel)
  enterState(channel, await Promise.resolve(handler(channel, message, state)))
}

async function enqueueMessage (channel, message) {
  const queue = messageQueue.get(channel) || []
  messageQueue.set(channel, [...queue, JSON.parse(message)])
  dequeueMessage(channel)
}

async function dequeueMessage (channel) {
  const queue = messageQueue.get(channel)
  if (messageQueueLocked.get(channel) || !queue.length) {
    return
  }
  const [message, ...remaining] = queue
  messageQueue.set(channel, remaining || [])
  messageQueueLocked.set(channel, true)
  await handleMessage(channel, message)
  messageQueueLocked.set(channel, false)
  dequeueMessage(channel)
}

function sendMessage (channel, info, to) {
  send(channel, {action: 'message', payload: {info, to}})
}

function WebSocket (url, callbacks) {
  function fireOnce (target, key, always) {
    target[key] = (...args) => {
      always(...args)
      target[key] = callbacks[key]
      if (typeof target === 'function') {
        target(...args)
      }
    }
  }

  return new Promise((resolve, reject) => {
    const ws = new W3CWebSocket(url)
    // eslint-disable-next-line no-return-assign
    Object.entries(callbacks).forEach(([key, callback]) => ws[key] = callback)
    fireOnce(ws, 'onopen', () => resolve(ws))
    fireOnce(ws, 'onerror', (err) => reject(err))
  })
}

async function initialize (channel, channelOptions) {
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
    'role',
    'existingChannelId',
    'offchainTx'
  ], channelOptions)

  options.set(channel, channelOptions)
  fsm.set(channel, {handler: awaitingConnection})
  eventEmitters.set(channel, new EventEmitter())
  websockets.set(channel, await WebSocket(channelURL(channelOptions.url, params), {
    onopen: () => changeStatus(channel, 'connected'),
    onclose: () => changeStatus(channel, 'disconnected'),
    onmessage: ({data}) => enqueueMessage(channel, data)
  }))
}

export {
  initialize,
  options,
  status,
  state,
  eventEmitters,
  emit,
  changeStatus,
  changeState,
  send,
  enqueueAction,
  sendMessage
}
