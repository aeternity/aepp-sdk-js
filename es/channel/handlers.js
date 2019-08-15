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

import { generateKeyPair, encodeContractAddress, encodeBase64Check } from '../utils/crypto'
import {
  options,
  changeStatus,
  changeState,
  send,
  emit,
  channelId,
  disconnect
} from './internal'
import { unpackTx, buildTx } from '../tx/builder'

function encodeRlpTx (rlpBinary) {
  return `tx_${encodeBase64Check(rlpBinary)}`
}

async function appendSignature (tx, signFn) {
  const { signatures, encodedTx } = unpackTx(tx).tx
  const result = await signFn(encodeRlpTx(encodedTx.rlpEncoded))
  if (result) {
    const { tx: signedTx, txType } = unpackTx(result)
    return encodeRlpTx(buildTx({
      signatures: signatures.concat(signedTx.signatures),
      encodedTx: signedTx.encodedTx.rlpEncoded
    }, txType).rlpEncoded)
  }
}

function handleUnexpectedMessage (channel, message, state) {
  if (state.reject) {
    state.reject(Object.assign(
      Error(`Unexpected message received:\n\n${JSON.stringify(message)}`),
      { wsMessage: message }
    ))
  }
  return { handler: channelOpen }
}

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
    if (message.params.data.tx) {
      const signedTx = await options.get(channel).sign(tag, message.params.data.tx)
      send(channel, { jsonrpc: '2.0', method: `channels.${tag}`, params: { tx: signedTx } })
      return { handler: awaitingOnChainTx }
    }
    const signedTx = await appendSignature(message.params.data.signed_tx, tx => options.get(channel).sign(tag, tx))
    send(channel, { jsonrpc: '2.0', method: `channels.${tag}`, params: { signed_tx: signedTx } })
    return { handler: awaitingOnChainTx }
  }
}

export function awaitingOnChainTx (channel, message, state) {
  if (message.method === 'channels.on_chain_tx') {
    if (
      message.params.data.info === 'funding_signed' &&
      options.get(channel).role === 'initiator'
    ) {
      return { handler: awaitingBlockInclusion }
    }
    if (
      message.params.data.info === 'funding_created' &&
      options.get(channel).role === 'responder'
    ) {
      return { handler: awaitingBlockInclusion }
    }
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
      funding_created: awaitingBlockInclusion,
      own_funding_locked: awaitingBlockInclusion,
      funding_locked: awaitingOpenConfirmation
    }[message.params.data.event]
    if (handler) {
      return { handler }
    }
  }
  if (message.method === 'channels.on_chain_tx') {
    emit(channel, 'onChainTx', message.params.data.tx, {
      info: message.params.data.info,
      type: message.params.data.type
    })
    return { handler: awaitingBlockInclusion }
  }
}

export function awaitingOpenConfirmation (channel, message, state) {
  if (message.method === 'channels.info' && message.params.data.event === 'open') {
    channelId.set(channel, message.params.channel_id)
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
  switch (message.method) {
    case 'channels.info':
      switch (message.params.data.event) {
        case 'update':
        case 'withdraw_created':
        case 'deposit_created':
          return { handler: awaitingTxSignRequest }
        case 'own_withdraw_locked':
        case 'withdraw_locked':
        case 'own_deposit_locked':
        case 'deposit_locked':
          emit(channel, message.params.data.event)
          return { handler: channelOpen }
        case 'close_mutual':
          return { handler: channelOpen }
        case 'closing':
          changeStatus(channel, 'closing')
          return { handler: channelOpen }
        case 'closed_confirmed':
          changeStatus(channel, 'closed')
          return { handler: channelClosed }
        case 'died':
          changeStatus(channel, 'died')
          return { handler: channelClosed }
      }
      break
    case 'channels.on_chain_tx':
      emit(channel, 'onChainTx', message.params.data.tx, {
        info: message.params.data.info,
        type: message.params.data.type
      })
      return { handler: channelOpen }
    case 'channels.leave':
      // TODO: emit event
      return { handler: channelOpen }
    case 'channels.update':
      changeState(channel, message.params.data.state)
      return { handler: channelOpen }
    case 'channels.sign.shutdown_sign_ack':
      return awaitingTxSignRequest(channel, message, state)
  }
}
channelOpen.enter = (channel) => {
  changeStatus(channel, 'open')
}

export async function awaitingOffChainTx (channel, message, state) {
  if (message.method === 'channels.sign.update') {
    const { sign } = state
    if (message.params.data.tx) {
      const signedTx = await sign(message.params.data.tx, { updates: message.params.data.updates })
      send(channel, { jsonrpc: '2.0', method: 'channels.update', params: { tx: signedTx } })
      return { handler: awaitingOffChainUpdate, state }
    }
    const signedTx = await appendSignature(message.params.data.signed_tx, tx =>
      sign(tx, { updates: message.params.data.updates })
    )
    send(channel, { jsonrpc: '2.0', method: 'channels.update', params: { signed_tx: signedTx } })
    return { handler: awaitingOffChainUpdate, state }
  }
  if (message.method === 'channels.error') {
    state.reject(new Error(message.data.message))
    return { handler: channelOpen }
  }
  if (message.error) {
    const { data = [] } = message.error
    if (data.find(i => i.code === 1001)) {
      state.reject(new Error('Insufficient balance'))
    } else if (data.find(i => i.code === 1002)) {
      state.reject(new Error('Amount cannot be negative'))
    } else {
      state.reject(new Error(message.error.message))
    }
    return { handler: channelOpen }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingOffChainUpdate (channel, message, state) {
  if (message.method === 'channels.update') {
    changeState(channel, message.params.data.state)
    state.resolve({ accepted: true, signedTx: message.params.data.state })
    return { handler: channelOpen }
  }
  if (message.method === 'channels.conflict') {
    state.resolve({ accepted: false })
    return { handler: channelOpen }
  }
  if (message.error) {
    state.reject(new Error(message.error.message))
    return { handler: channelOpen }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export async function awaitingTxSignRequest (channel, message, state) {
  // eslint-disable-next-line no-useless-escape
  const [, tag] = message.method.match(/^channels\.sign\.([^\.]+)$/) || []
  if (tag) {
    if (message.params.data.tx) {
      const signedTx = await options.get(channel).sign(tag, message.params.data.tx, {
        updates: message.params.data.updates
      })
      if (signedTx) {
        send(channel, { jsonrpc: '2.0', method: `channels.${tag}`, params: { tx: signedTx } })
        return { handler: channelOpen }
      }
    } else {
      const signedTx = await appendSignature(message.params.data.signed_tx, tx =>
        options.get(channel).sign(tag, tx, { updates: message.params.data.updates })
      )
      if (signedTx) {
        send(channel, { jsonrpc: '2.0', method: `channels.${tag}`, params: { signed_tx: signedTx } })
        return { handler: channelOpen }
      }
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
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingUpdateConflict (channel, message, state) {
  if (message.error) {
    return { handler: awaitingUpdateConflict }
  }
  if (message.method === 'channels.conflict') {
    return { handler: channelOpen }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export async function awaitingShutdownTx (channel, message, state) {
  if (message.method === 'channels.sign.shutdown_sign') {
    if (message.params.data.tx) {
      const signedTx = await state.sign(message.params.data.tx)
      send(channel, { jsonrpc: '2.0', method: 'channels.shutdown_sign', params: { tx: signedTx } })
      return { handler: awaitingShutdownOnChainTx, state }
    }
    const signedTx = await appendSignature(message.params.data.signed_tx, tx => state.sign(tx))
    send(channel, { jsonrpc: '2.0', method: 'channels.shutdown_sign', params: { signed_tx: signedTx } })
    return { handler: awaitingShutdownOnChainTx, state }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingShutdownOnChainTx (channel, message, state) {
  if (message.method === 'channels.on_chain_tx') {
    state.resolve(message.params.data.tx)
    return { handler: channelClosed }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingLeave (channel, message, state) {
  if (message.method === 'channels.leave') {
    state.resolve({ channelId: message.params.channel_id, signedTx: message.params.data.state })
    disconnect(channel)
    return { handler: channelClosed }
  }
  if (message.method === 'channels.error') {
    state.reject(new Error(message.data.message))
    return { handler: channelOpen }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export async function awaitingWithdrawTx (channel, message, state) {
  if (message.method === 'channels.sign.withdraw_tx') {
    const { sign } = state
    if (message.params.data.tx) {
      const signedTx = await sign(message.params.data.tx, { updates: message.params.data.updates })
      send(channel, { jsonrpc: '2.0', method: 'channels.withdraw_tx', params: { tx: signedTx } })
      return { handler: awaitingWithdrawCompletion, state }
    }
    const signedTx = await appendSignature(message.params.data.signed_tx, tx =>
      sign(tx, { updates: message.params.data.updates })
    )
    send(channel, { jsonrpc: '2.0', method: 'channels.withdraw_tx', params: { signed_tx: signedTx } })
    return { handler: awaitingWithdrawCompletion, state }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingWithdrawCompletion (channel, message, state) {
  if (message.method === 'channels.on_chain_tx') {
    if (state.onOnChainTx) {
      state.onOnChainTx(message.params.data.tx)
    }
    return { handler: awaitingWithdrawCompletion, state }
  }
  if (message.method === 'channels.info') {
    if (['own_withdraw_locked', 'withdraw_locked'].includes(message.params.data.event)) {
      const callback = {
        own_withdraw_locked: state.onOwnWithdrawLocked,
        withdraw_locked: state.onWithdrawLocked
      }[message.params.data.event]
      if (callback) {
        callback()
      }
      return { handler: awaitingWithdrawCompletion, state }
    }
  }
  if (message.method === 'channels.update') {
    changeState(channel, message.params.data.state)
    state.resolve({ accepted: true, signedTx: message.params.data.state })
    return { handler: channelOpen }
  }
  if (message.method === 'channels.conflict') {
    state.resolve({ accepted: false })
    return { handler: channelOpen }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export async function awaitingDepositTx (channel, message, state) {
  if (message.method === 'channels.sign.deposit_tx') {
    const { sign } = state
    if (message.params.data.tx) {
      const signedTx = await sign(message.params.data.tx, { updates: message.params.data.updates })
      send(channel, { jsonrpc: '2.0', method: 'channels.deposit_tx', params: { tx: signedTx } })
      return { handler: awaitingDepositCompletion, state }
    }
    const signedTx = await appendSignature(message.params.data.signed_tx, tx =>
      sign(tx, { updates: message.params.data.updates })
    )
    send(channel, { jsonrpc: '2.0', method: 'channels.deposit_tx', params: { signed_tx: signedTx } })
    return { handler: awaitingDepositCompletion, state }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingDepositCompletion (channel, message, state) {
  if (message.method === 'channels.on_chain_tx') {
    if (state.onOnChainTx) {
      state.onOnChainTx(message.params.data.tx)
    }
    return { handler: awaitingDepositCompletion, state }
  }
  if (message.method === 'channels.info') {
    if (['own_deposit_locked', 'deposit_locked'].includes(message.params.data.event)) {
      const callback = {
        own_deposit_locked: state.onOwnDepositLocked,
        deposit_locked: state.onDepositLocked
      }[message.params.data.event]
      if (callback) {
        callback()
      }
      return { handler: awaitingDepositCompletion, state }
    }
  }
  if (message.method === 'channels.update') {
    changeState(channel, message.params.data.state)
    state.resolve({ accepted: true, signedTx: message.params.data.state })
    return { handler: channelOpen }
  }
  if (message.method === 'channels.conflict') {
    state.resolve({ accepted: false })
    return { handler: channelOpen }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export async function awaitingNewContractTx (channel, message, state) {
  if (message.method === 'channels.sign.update') {
    if (message.params.data.tx) {
      const signedTx = await state.sign(message.params.data.tx)
      send(channel, { jsonrpc: '2.0', method: 'channels.update', params: { tx: signedTx } })
      return { handler: awaitingNewContractCompletion, state }
    }
    const signedTx = await appendSignature(message.params.data.signed_tx, tx => state.sign(tx))
    send(channel, { jsonrpc: '2.0', method: 'channels.update', params: { signed_tx: signedTx } })
    return { handler: awaitingNewContractCompletion, state }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingNewContractCompletion (channel, message, state) {
  if (message.method === 'channels.update') {
    const { round } = unpackTx(message.params.data.state).tx.encodedTx.tx
    // eslint-disable-next-line standard/computed-property-even-spacing
    const owner = options.get(channel)[{
      initiator: 'initiatorId',
      responder: 'responderId'
    }[options.get(channel).role]]
    changeState(channel, message.params.data.state)
    state.resolve({
      accepted: true,
      address: encodeContractAddress(owner, round),
      signedTx: message.params.data.state
    })
    return { handler: channelOpen }
  }
  if (message.method === 'channels.conflict') {
    state.resolve({ accepted: false })
    return { handler: channelOpen }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export async function awaitingCallContractUpdateTx (channel, message, state) {
  if (message.method === 'channels.sign.update') {
    if (message.params.data.tx) {
      const signedTx = await state.sign(message.params.data.tx)
      send(channel, { jsonrpc: '2.0', method: 'channels.update', params: { tx: signedTx } })
      return { handler: awaitingCallContractCompletion, state }
    }
    const signedTx = await appendSignature(message.params.data.signed_tx, tx => state.sign(tx))
    send(channel, { jsonrpc: '2.0', method: 'channels.update', params: { signed_tx: signedTx } })
    return { handler: awaitingCallContractCompletion, state }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingCallContractCompletion (channel, message, state) {
  if (message.method === 'channels.update') {
    changeState(channel, message.params.data.state)
    state.resolve({ accepted: true, signedTx: message.params.data.state })
    return { handler: channelOpen }
  }
  if (message.method === 'channels.conflict') {
    state.resolve({ accepted: false })
    return { handler: channelOpen }
  }
  return handleUnexpectedMessage(channel, message, state)
}

export function awaitingCallsPruned (channels, message, state) {
  if (message.method === 'channels.calls_pruned.reply') {
    state.resolve()
    return { handler: channelOpen }
  }
  state.reject(new Error('Unexpected message received'))
  return { handler: channelClosed }
}

export function channelClosed (channel, message, state) {
  return { handler: channelClosed }
}
