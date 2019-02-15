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

import { generateKeyPair } from '../utils/crypto'
import {
  options,
  changeStatus,
  changeState,
  send,
  emit
} from './internal'
import * as R from 'ramda'

export function awaitingConnection (channel, message, state) {
  if (message.method === 'channels.info') {
    if (['channel_accept', 'funding_created'].includes(message.params.data.event)) {
      changeStatus(channel, {
        channel_accept: 'accepted',
        funding_created: 'halfSigned'
      }[message.params.data.event])
      return { handler: awaitingChannelCreateTx }
    }
    if (message.params.data.event === 'channel_reestablished') {
      return { handler: awaitingOpenConfirmation }
    }
    return { handler: awaitingConnection }
  }
  if (message.method === 'channels.error') {
    emit(channel, 'error', new Error(message.payload.message))
    return { handler: channelClosed }
  }
}

export async function awaitingChannelCreateTx (channel, message, state) {
  const tag = {
    initiator: 'initiator_sign',
    responder: 'responder_sign'
  }[options.get(channel).role]
  if (message.method === `channels.sign.${tag}`) {
    const signedTx = await options.get(channel).sign(message.tag, message.params.data.tx)
    send(channel, { jsonrpc: '2.0', method: `channels.${tag}`, params: { tx: signedTx } })
    return { handler: awaitingOnChainTx }
  }
}

export function awaitingOnChainTx (channel, message, state) {
  if (message.method === 'channels.on_chain_tx') {
    emit(channel, 'onChainTx', message.params.data.tx)
    return { handler: awaitingBlockInclusion }
  }
  if (
    message.method === 'channels.info' &&
    message.params.data.event === 'funding_signed' &&
    options.get(channel).role === 'initiator'
  ) {
    changeStatus(channel, 'signed')
    return { handler: awaitingOnChainTx }
  }
}

export function awaitingBlockInclusion (channel, message, state) {
  if (message.method === 'channels.info') {
    const handler = {
      own_funding_locked: awaitingBlockInclusion,
      funding_locked: awaitingOpenConfirmation
    }[message.params.data.event]
    if (handler) {
      return { handler }
    }
  }
}

export function awaitingOpenConfirmation (channel, message, state) {
  if (message.method === 'channels.info' && message.params.data.event === 'open') {
    return { handler: awaitingInitialState }
  }
}

export function awaitingInitialState (channel, message, state) {
  if (message.method === 'channels.update') {
    changeState(channel, message.params.data.state)
    return { handler: channelOpen }
  }
}

export async function channelOpen (channel, message, state) {
  if (message.method === 'channels.info') {
    if (message.params.data.event === 'died') {
      changeStatus(channel, 'died')
    }
    const handler = {
      update: awaitingUpdateTxSignRequest,
      close_mutual: channelOpen,
      died: channelClosed
    }[message.params.data.event]
    if (handler) {
      return { handler }
    }
  }
  if (message.method === 'channels.sign.shutdown_sign_ack') {
    const signedTx = await Promise.resolve(options.get(channel).sign(message.tag, message.params.data.tx))
    send(channel, { jsonrpc: '2.0', method: 'channels.shutdown_sign_ack', params: { tx: signedTx } })
    return { handler: channelOpen }
  }
  if (message.method === 'channels.on_chain_tx') {
    emit(channel, 'onChainTx', message.params.data.tx)
    return { handler: channelOpen }
  }
  if (message.method === 'channels.leave') {
    // TODO: emit event
    return { handler: channelOpen }
  }
  if (message.method === 'channels.message') {
    emit(channel, 'message', message.params.data.message)
    return { handler: channelOpen }
  }
}
channelOpen.enter = (channel) => {
  changeStatus(channel, 'open')
}

export async function awaitingOffChainTx (channel, message, state) {
  if (message.method === 'channels.sign.update') {
    const { sign } = state
    const signedTx = await sign(message.params.data.tx)
    send(channel, { jsonrpc: '2.0', method: 'channels.update', params: { tx: signedTx } })
    return { handler: awaitingOffChainUpdate, state }
  }
  if (message.method === 'channels.error') {
    state.reject(new Error(message.data.message))
    return { handler: channelOpen }
  }
}

export function awaitingOffChainUpdate (channel, message, state) {
  if (message.method === 'channels.update') {
    changeState(channel, message.params.data.state)
    state.resolve({ accepted: true, state: message.params.data.state })
    return { handler: channelOpen }
  }
  if (message.method === 'channels.conflict') {
    state.resolve({ accepted: false })
    return { handler: channelOpen }
  }
}

export async function awaitingUpdateTxSignRequest (channel, message, state) {
  if (message.method === 'channels.sign.update_ack') {
    const signedTx = await options.get(channel).sign(message.tag, message.params.data.tx)
    if (signedTx) {
      send(channel, { jsonrpc: '2.0', method: 'channels.update_ack', params: { tx: signedTx } })
      return { handler: awaitingUpdateTx }
    }
    // soft-reject via competing update
    send(channel, {
      jsonrpc: '2.0',
      method: 'channels.update.new',
      params: {
        from: generateKeyPair().publicKey,
        to: generateKeyPair().publicKey,
        amount: 1
      }
    })
    return { handler: awaitingUpdateConflict }
  }
}

export function awaitingUpdateTx (channel, message, state) {
  if (message.method === 'channels.update') {
    // TODO: change state to `message.params.data.state`
    return { handler: channelOpen }
  }
}

export function awaitingUpdateConflict (channel, message, state) {
  if (message.error) {
    return { handler: awaitingUpdateConflict }
  }
  if (message.method === 'channels.conflict') {
    return { handler: channelOpen }
  }
}

export function awaitingProofOfInclusion (channel, message, state) {
  if (message.id === state.messageId) {
    state.resolve(message.result.poi)
    return { handler: channelOpen }
  }
  if (message.method === 'channels.error') {
    state.reject(new Error(message.data.message))
    return { handler: channelOpen }
  }
}

export function awaitingBalances (channel, message, state) {
  if (message.id === state.messageId) {
    state.resolve(R.reduce((acc, item) => ({
      ...acc,
      [item.account]: item.balance
    }), {}, message.result))
    return { handler: channelOpen }
  }
  if (message.method === 'channels.error') {
    state.reject(new Error(message.data.message))
    return { handler: channelOpen }
  }
}

export async function awaitingShutdownTx (channel, message, state) {
  if (message.method === 'channels.sign.shutdown_sign') {
    const signedTx = await Promise.resolve(state.sign(message.params.data.tx))
    send(channel, { jsonrpc: '2.0', method: 'channels.shutdown_sign', params: { tx: signedTx } })
    return { handler: awaitingShutdownOnChainTx, state }
  }
}

export function awaitingShutdownOnChainTx (channel, message, state) {
  if (message.method === 'channels.on_chain_tx') {
    state.resolveShutdownPromise(message.params.data.tx)
    return { handler: channelClosed }
  }
}

export function awaitingLeave (channel, message, state) {
  if (message.method === 'channels.leave') {
    state.resolve({ channelId: message.params.channel_id, state: message.params.data.state })
    return { handler: channelClosed }
  }
  if (message.method === 'channels.error') {
    state.reject(new Error(message.data.message))
    return { handler: channelOpen }
  }
}

export function channelClosed (channel, message, state) {
  return { handler: channelClosed }
}
