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

import {generateKeyPair} from '../utils/crypto'
import {
  options,
  changeStatus,
  changeState,
  send,
  emit
} from './internal'
import * as R from 'ramda'

export function awaitingConnection (channel, message, state) {
  if (message.action === 'info') {
    if (['channel_accept', 'funding_created'].includes(message.payload.event)) {
      changeStatus(channel, {
        channel_accept: 'accepted',
        funding_created: 'halfSigned'
      }[message.payload.event])
      return {handler: awaitingChannelCreateTx}
    }
    if (message.payload.event === 'channel_reestablished') {
      return {handler: awaitingOpenConfirmation}
    }
    return {handler: awaitingConnection}
  }
}

export async function awaitingChannelCreateTx (channel, message, state) {
  if (message.action === 'sign') {
    const signedTx = await options.get(channel).sign(message.tag, message.payload.tx)
    send(channel, {action: message.tag, payload: {tx: signedTx}})
    return {handler: awaitingOnChainTx}
  }
}

export function awaitingOnChainTx (channel, message, state) {
  if (message.action === 'on_chain_tx') {
    emit(channel, 'onChainTx', message.payload.tx)
    return {handler: awaitingBlockInclusion}
  }
  if (
    message.action === 'info' &&
    message.payload.event === 'funding_signed' &&
    options.get(channel).role === 'initiator'
  ) {
    changeStatus(channel, 'signed')
    return {handler: awaitingOnChainTx}
  }
}

export function awaitingBlockInclusion (channel, message, state) {
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

export function awaitingOpenConfirmation (channel, message, state) {
  if (message.action === 'info' && message.payload.event === 'open') {
    return {handler: awaitingInitialState}
  }
}

export function awaitingInitialState (channel, message, state) {
  if (message.action === 'update') {
    changeState(channel, message.payload.state)
    return {handler: channelOpen}
  }
}

export async function channelOpen (channel, message, state) {
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
    const signedTx = await Promise.resolve(options.get(channel).sign(message.tag, message.payload.tx))
    send(channel, {action: message.tag, payload: {tx: signedTx}})
    return {handler: channelOpen}
  }
  if (message.action === 'on_chain_tx') {
    emit(channel, 'onChainTx', message.payload.tx)
    return {handler: channelOpen}
  }
  if (message.action === 'leave') {
    // TODO: emit event
    return {handler: channelOpen}
  }
  if (message.action === 'message') {
    emit(channel, 'message', message.payload.message)
    return {handler: channelOpen}
  }
}
channelOpen.enter = (channel) => {
  changeStatus(channel, 'open')
}

export async function awaitingOffChainTx (channel, message, state) {
  if (message.action === 'sign' && message.tag === 'update') {
    const {sign} = state
    const signedTx = await sign(message.payload.tx)
    send(channel, {action: message.tag, payload: {tx: signedTx}})
    return {handler: awaitingOffChainUpdate, state}
  }
  if (message.action === 'error') {
    state.reject(new Error(JSON.stringify(message.payload)))
    return {handler: channelOpen}
  }
}

export function awaitingOffChainUpdate (channel, message, state) {
  if (message.action === 'update') {
    changeState(channel, message.payload.state)
    state.resolve({accepted: true, state: message.payload.state})
    return {handler: channelOpen}
  }
  if (message.action === 'conflict') {
    state.resolve({accepted: false})
    return {handler: channelOpen}
  }
}

export async function awaitingUpdateTxSignRequest (channel, message, state) {
  if (message.action === 'sign' && message.tag === 'update_ack') {
    const signedTx = await options.get(channel).sign(message.tag, message.payload.tx)
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

export function awaitingUpdateTx (channel, message, state) {
  if (message.action === 'update') {
    return {handler: channelOpen}
  }
}

export function awaitingUpdateConflict (channel, message, state) {
  if (message.action === 'error' && message.payload.reason === 'conflict') {
    return {handler: awaitingUpdateConflict}
  }
  if (message.action === 'conflict') {
    return {handler: channelOpen}
  }
}

export function awaitingProofOfInclusion (channel, message, state) {
  if (message.action === 'get' && message.tag === 'poi') {
    state.resolve(message.payload.poi)
    return {handler: channelOpen}
  }
  if (message.action === 'error') {
    state.reject(new Error(message.payload.reason))
    return {handler: channelOpen}
  }
}

export function awaitingBalances (channel, message, state) {
  if (message.action === 'get' && message.tag === 'balances') {
    state.resolve(R.reduce((acc, item) => ({
      ...acc,
      [item.account]: item.balance
    }), {}, message.payload))
    return {handler: channelOpen}
  }
  if (message.action === 'error') {
    state.reject(new Error(message.payload.reason))
    return {handler: channelOpen}
  }
}

export async function awaitingShutdownTx (channel, message, state) {
  if (message.action === 'sign' && message.tag === 'shutdown_sign') {
    const signedTx = await Promise.resolve(state.sign(message.payload.tx))
    send(channel, {action: message.tag, payload: {tx: signedTx}})
    return {handler: awaitingShutdownOnChainTx, state}
  }
}

export function awaitingShutdownOnChainTx (channel, message, state) {
  if (message.action === 'on_chain_tx') {
    state.resolveShutdownPromise(message.payload.tx)
    return {handler: channelClosed}
  }
}

export function awaitingLeave (channel, message, state) {
  state.resolve({channelId: message.channel_id, state: message.payload.state})
  return {handler: channelClosed}
}

export function channelClosed (channel, message, state) {
  return {handler: channelClosed}
}
