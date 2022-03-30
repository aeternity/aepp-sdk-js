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
/* eslint-disable no-unused-expressions */

import { describe, it, before, after, beforeEach, afterEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import BigNumber from 'bignumber.js'
import { getSdk, BaseAe, networkId } from './'
import { generateKeyPair } from '../../src/utils/crypto'
import { unpackTx, buildTx, buildTxHash } from '../../src/tx/builder'
import { decode } from '../../src/tx/builder/helpers'
import Channel from '../../src/channel'
import { send } from '../../src/channel/internal'
import MemoryAccount from '../../src/account/memory'
import {
  IllegalArgumentError,
  InsufficientBalanceError,
  ChannelConnectionError
} from '../../src/utils/errors'

const wsUrl = process.env.TEST_WS_URL || 'ws://localhost:3014/channel'

const contractSource = `
contract Identity =
  entrypoint getArg(x : int) : int = x
`

function waitForChannel (channel) {
  return new Promise(resolve =>
    channel.on('statusChanged', (status) => {
      if (status === 'open') {
        resolve()
      }
    })
  )
}

describe('Channel', function () {
  let aeSdkInitiatior
  let aeSdkResponder
  let initiatorCh
  let responderCh
  let responderShouldRejectUpdate
  let existingChannelId
  let offchainTx
  let contractAddress
  let callerNonce
  let contract
  const initiatorSign = sinon.spy((tag, tx) => aeSdkInitiatior.signTransaction(tx))
  const responderSign = sinon.spy((tag, tx) => {
    if (typeof responderShouldRejectUpdate === 'number') {
      return responderShouldRejectUpdate
    }
    if (responderShouldRejectUpdate) {
      return null
    }
    return aeSdkResponder.signTransaction(tx)
  })
  const sharedParams = {
    url: wsUrl,
    pushAmount: 3,
    initiatorAmount: BigNumber('100e18'),
    responderAmount: BigNumber('100e18'),
    channelReserve: 0,
    ttl: 10000,
    host: 'localhost',
    port: 3001,
    lockPeriod: 1,
    statePassword: 'correct horse battery staple',
    debug: false
  }

  before(async function () {
    aeSdkInitiatior = await getSdk()
    aeSdkResponder = await BaseAe({ networkId, accounts: [] })
    await aeSdkResponder.addAccount(MemoryAccount({ keypair: generateKeyPair() }), { select: true })
    sharedParams.initiatorId = await aeSdkInitiatior.address()
    sharedParams.responderId = await aeSdkResponder.address()
    await aeSdkInitiatior.spend(BigNumber('500e18').toString(), await aeSdkResponder.address())
  })

  after(() => {
    initiatorCh.disconnect()
    responderCh.disconnect()
  })

  beforeEach(() => {
    responderShouldRejectUpdate = false
  })

  afterEach(() => {
    initiatorSign.resetHistory()
    responderSign.resetHistory()
  })

  it('can open a channel', async () => {
    initiatorCh = await Channel({
      ...sharedParams,
      role: 'initiator',
      sign: initiatorSign
    })
    responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      sign: responderSign
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
    initiatorCh.round().should.equal(1)
    responderCh.round().should.equal(1)
    sinon.assert.calledOnce(initiatorSign)
    sinon.assert.calledWithExactly(initiatorSign, sinon.match('initiator_sign'), sinon.match.string)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('responder_sign'), sinon.match.string)
    const expectedTxParams = {
      initiator: await aeSdkInitiatior.address(),
      responder: await aeSdkResponder.address(),
      initiatorAmount: sharedParams.initiatorAmount.toString(),
      responderAmount: sharedParams.responderAmount.toString(),
      channelReserve: sharedParams.channelReserve.toString(),
      lockPeriod: sharedParams.lockPeriod.toString()
    }
    const { txType: initiatorTxType, tx: initiatorTx } = unpackTx(initiatorSign.firstCall.args[1])
    const { txType: responderTxType, tx: responderTx } = unpackTx(responderSign.firstCall.args[1])
    initiatorTxType.should.equal('channelCreate')
    initiatorTx.should.eql({ ...initiatorTx, ...expectedTxParams })
    responderTxType.should.equal('channelCreate')
    responderTx.should.eql({ ...responderTx, ...expectedTxParams })
  })

  it('prints error on handling incoming messages', async () => {
    const received = new Promise(resolve => sinon.stub(console, 'error').callsFake(resolve))
    send(initiatorCh, {
      jsonrpc: '2.0',
      method: 'not-existing-method',
      params: {}
    })
    await received
    expect(console.error.callCount).to.be.equal(3)
    expect(console.error.getCall(0).firstArg).to.be.equal('Error handling incoming message:')
    expect(console.error.getCall(1).firstArg.error.message).to.be.equal('Method not found')
    expect(console.error.getCall(2).firstArg.toString())
      .to.be.equal('UnknownChannelStateError: State Channels FSM entered unknown state')
    console.error.restore()
  })

  it('can post update and accept', async () => {
    responderShouldRejectUpdate = false
    const roundBefore = initiatorCh.round()
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    const amount = 1
    const result = await initiatorCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      amount,
      sign
    )
    initiatorCh.round().should.equal(roundBefore + 1)
    result.accepted.should.equal(true)
    result.signedTx.should.be.a('string')
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('update_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount),
          from: sinon.match(await aeSdkInitiatior.address()),
          to: sinon.match(await aeSdkResponder.address()),
          op: sinon.match('OffChainTransfer')
        }])
      })
    )
    sinon.assert.calledOnce(sign)
    sinon.assert.calledWithExactly(
      sign,
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount),
          from: sinon.match(await aeSdkInitiatior.address()),
          to: sinon.match(await aeSdkResponder.address()),
          op: sinon.match('OffChainTransfer')
        }])
      })
    )
    const { txType } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelOffChain')
    sign.firstCall.args[1].should.eql({
      updates: [
        {
          amount,
          from: await aeSdkInitiatior.address(),
          to: await aeSdkResponder.address(),
          op: 'OffChainTransfer'
        }
      ]
    })
  })

  it('can post update and reject', async () => {
    responderShouldRejectUpdate = true
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    const amount = 1
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.update(
      await aeSdkResponder.address(),
      await aeSdkInitiatior.address(),
      amount,
      sign
    )
    result.accepted.should.equal(false)
    initiatorCh.round().should.equal(roundBefore)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('update_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount),
          from: sinon.match(await aeSdkResponder.address()),
          to: sinon.match(await aeSdkInitiatior.address()),
          op: sinon.match('OffChainTransfer')
        }])
      })
    )
    sinon.assert.calledOnce(sign)
    sinon.assert.calledWithExactly(
      sign,
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount),
          from: sinon.match(await aeSdkResponder.address()),
          to: sinon.match(await aeSdkInitiatior.address()),
          op: sinon.match('OffChainTransfer')
        }])
      })
    )
    const { txType } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelOffChain')
    sign.firstCall.args[1].should.eql({
      updates: [
        {
          amount,
          from: await aeSdkResponder.address(),
          to: await aeSdkInitiatior.address(),
          op: 'OffChainTransfer'
        }
      ]
    })
  })

  it('can abort update sign request', async () => {
    const errorCode = 12345
    const result = await initiatorCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      100,
      () => errorCode
    )
    result.should.eql({ accepted: false })
  })

  it('can abort update with custom error code', async () => {
    responderShouldRejectUpdate = 1234
    const result = await initiatorCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      100,
      tx => aeSdkInitiatior.signTransaction(tx)
    )
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined'
    })
  })

  it('can post bignumber update and accept', async () => {
    responderShouldRejectUpdate = false
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    const amount = BigNumber('10e18')
    const result = await initiatorCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      amount,
      sign
    )
    result.accepted.should.equal(true)
    result.signedTx.should.be.a('string')
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('update_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount.toString()),
          from: sinon.match(await aeSdkInitiatior.address()),
          to: sinon.match(await aeSdkResponder.address()),
          op: sinon.match('OffChainTransfer')
        }])
      })
    )
    sinon.assert.calledOnce(sign)
    sinon.assert.calledWithExactly(
      sign,
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount.toString()),
          from: sinon.match(await aeSdkInitiatior.address()),
          to: sinon.match(await aeSdkResponder.address()),
          op: sinon.match('OffChainTransfer')
        }])
      })
    )
    const { txType } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelOffChain')
    sign.firstCall.args[1].should.eql({
      updates: [
        {
          amount: amount.toString(),
          from: await aeSdkInitiatior.address(),
          to: await aeSdkResponder.address(),
          op: 'OffChainTransfer'
        }
      ]
    })
  })

  it('can post update with metadata', async () => {
    responderShouldRejectUpdate = true
    const meta = 'meta 1'
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    await initiatorCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      100,
      sign,
      [meta]
    )
    sign.firstCall.args[1].updates.should.eql([
      sign.firstCall.args[1].updates[0],
      { data: meta, op: 'OffChainMeta' }
    ])
    responderSign.firstCall.args[2].updates.should.eql([
      responderSign.firstCall.args[2].updates[0],
      { data: meta, op: 'OffChainMeta' }
    ])
  })

  it('can get proof of inclusion', async () => {
    const initiatorAddr = await aeSdkInitiatior.address()
    const responderAddr = await aeSdkResponder.address()
    const params = { accounts: [initiatorAddr, responderAddr] }
    const initiatorPoi = await initiatorCh.poi(params)
    const responderPoi = await responderCh.poi(params)
    initiatorPoi.should.be.a('string')
    responderPoi.should.be.a('string')
    const unpackedInitiatorPoi = unpackTx(decode(initiatorPoi, 'pi'), true)
    const unpackedResponderPoi = unpackTx(decode(responderPoi, 'pi'), true)
    buildTx(unpackedInitiatorPoi.tx, unpackedInitiatorPoi.txType, { prefix: 'pi' }).tx.should.equal(initiatorPoi)
    buildTx(unpackedResponderPoi.tx, unpackedResponderPoi.txType, { prefix: 'pi' }).tx.should.equal(responderPoi)
  })

  it('can get balances', async () => {
    const initiatorAddr = await aeSdkInitiatior.address()
    const responderAddr = await aeSdkResponder.address()
    const addresses = [initiatorAddr, responderAddr]
    const initiatorBalances = await initiatorCh.balances(addresses)
    const responderBalances = await responderCh.balances(addresses)
    initiatorBalances.should.be.an('object')
    responderBalances.should.be.an('object')
    initiatorBalances[initiatorAddr].should.be.a('string')
    initiatorBalances[responderAddr].should.be.a('string')
    responderBalances[initiatorAddr].should.be.a('string')
    responderBalances[responderAddr].should.be.a('string')
  })

  it('can send a message', async () => {
    const sender = await aeSdkInitiatior.address()
    const recipient = await aeSdkResponder.address()
    const info = 'hello world'
    initiatorCh.sendMessage(info, recipient)
    const message = await new Promise(resolve => responderCh.on('message', resolve))
    message.should.eql({
      channel_id: initiatorCh.id(),
      from: sender,
      to: recipient,
      info
    })
  })

  it('can request a withdraw and accept', async () => {
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    const amount = BigNumber('2e18')
    const onOnChainTx = sinon.spy()
    const onOwnWithdrawLocked = sinon.spy()
    const onWithdrawLocked = sinon.spy()
    responderShouldRejectUpdate = false
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.withdraw(
      amount,
      sign,
      { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked }
    )
    result.should.eql({ accepted: true, signedTx: (await initiatorCh.state()).signedTx })
    initiatorCh.round().should.equal(roundBefore + 1)
    sinon.assert.called(onOnChainTx)
    sinon.assert.calledWithExactly(onOnChainTx, sinon.match.string)
    sinon.assert.calledOnce(onOwnWithdrawLocked)
    sinon.assert.calledOnce(onWithdrawLocked)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('withdraw_ack'),
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainWithdrawal',
          to: await aeSdkInitiatior.address()
        }]
      })
    )
    sinon.assert.calledOnce(sign)
    sinon.assert.calledWithExactly(
      sign,
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainWithdrawal',
          to: await aeSdkInitiatior.address()
        }]
      })
    )
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelWithdraw')
    tx.should.eql({
      ...tx,
      toId: await aeSdkInitiatior.address(),
      amount: amount.toString()
    })
  })

  it('can request a withdraw and reject', async () => {
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    const amount = BigNumber('2e18')
    const onOnChainTx = sinon.spy()
    const onOwnWithdrawLocked = sinon.spy()
    const onWithdrawLocked = sinon.spy()
    responderShouldRejectUpdate = true
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.withdraw(
      amount,
      sign,
      { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked }
    )
    initiatorCh.round().should.equal(roundBefore)
    result.should.eql({ ...result, accepted: false })
    sinon.assert.notCalled(onOnChainTx)
    sinon.assert.notCalled(onOwnWithdrawLocked)
    sinon.assert.notCalled(onWithdrawLocked)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('withdraw_ack'),
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainWithdrawal',
          to: await aeSdkInitiatior.address()
        }]
      })
    )
    sinon.assert.calledOnce(sign)
    sinon.assert.calledWithExactly(
      sign,
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainWithdrawal',
          to: await aeSdkInitiatior.address()
        }]
      })
    )
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelWithdraw')
    tx.should.eql({
      ...tx,
      toId: await aeSdkInitiatior.address(),
      amount: amount.toString()
    })
  })

  it('can abort withdraw sign request', async () => {
    const errorCode = 12345
    const result = await initiatorCh.withdraw(
      100,
      () => errorCode
    )
    result.should.eql({ accepted: false })
  })

  it('can abort withdraw with custom error code', async () => {
    responderShouldRejectUpdate = 12345
    const result = await initiatorCh.withdraw(
      100,
      tx => aeSdkInitiatior.signTransaction(tx)
    )
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined'
    })
  })

  it('can request a deposit and accept', async () => {
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    const amount = BigNumber('2e18')
    const onOnChainTx = sinon.spy()
    const onOwnDepositLocked = sinon.spy()
    const onDepositLocked = sinon.spy()
    responderShouldRejectUpdate = false
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.deposit(
      amount,
      sign,
      { onOnChainTx, onOwnDepositLocked, onDepositLocked }
    )
    result.should.eql({ accepted: true, signedTx: (await initiatorCh.state()).signedTx })
    initiatorCh.round().should.equal(roundBefore + 1)
    sinon.assert.called(onOnChainTx)
    sinon.assert.calledWithExactly(onOnChainTx, sinon.match.string)
    sinon.assert.calledOnce(onOwnDepositLocked)
    sinon.assert.calledOnce(onDepositLocked)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('deposit_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: await aeSdkInitiatior.address()
        }])
      })
    )
    sinon.assert.calledOnce(sign)
    sinon.assert.calledWithExactly(
      sign,
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: await aeSdkInitiatior.address()
        }])
      })
    )
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelDeposit')
    tx.should.eql({
      ...tx,
      fromId: await aeSdkInitiatior.address(),
      amount: amount.toString()
    })
  })

  it('can request a deposit and reject', async () => {
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    const amount = BigNumber('2e18')
    const onOnChainTx = sinon.spy()
    const onOwnDepositLocked = sinon.spy()
    const onDepositLocked = sinon.spy()
    responderShouldRejectUpdate = true
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.deposit(
      amount,
      sign,
      { onOnChainTx, onOwnDepositLocked, onDepositLocked }
    )
    initiatorCh.round().should.equal(roundBefore)
    result.should.eql({ ...result, accepted: false })
    sinon.assert.notCalled(onOnChainTx)
    sinon.assert.notCalled(onOwnDepositLocked)
    sinon.assert.notCalled(onDepositLocked)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('deposit_ack'),
      sinon.match.string,
      sinon.match({
        updates: [{
          amount: amount.toString(),
          op: 'OffChainDeposit',
          from: await aeSdkInitiatior.address()
        }]
      })
    )
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelDeposit')
    tx.should.eql({
      ...tx,
      fromId: await aeSdkInitiatior.address(),
      amount: amount.toString()
    })
  })

  it('can abort deposit sign request', async () => {
    const errorCode = 12345
    const result = await initiatorCh.deposit(
      100,
      () => errorCode
    )
    result.should.eql({ accepted: false })
  })

  it('can abort deposit with custom error code', async () => {
    responderShouldRejectUpdate = 12345
    const result = await initiatorCh.deposit(
      100,
      tx => aeSdkInitiatior.signTransaction(tx)
    )
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined'
    })
  })

  it('can close a channel', async () => {
    const sign = sinon.spy(aeSdkInitiatior.signTransaction.bind(aeSdkInitiatior))
    const result = await initiatorCh.shutdown(sign)
    result.should.be.a('string')
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('shutdown_sign_ack'),
      sinon.match.string,
      sinon.match.any
    )
    sinon.assert.calledOnce(sign)
    sinon.assert.calledWithExactly(sign, sinon.match.string)
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelCloseMutual')
    tx.should.eql({
      ...tx,
      fromId: await aeSdkInitiatior.address()
      // TODO: check `initiatorAmountFinal` and `responderAmountFinal`
    })
  })

  it('can leave a channel', async () => {
    initiatorCh.disconnect()
    responderCh.disconnect()
    initiatorCh = await Channel({
      ...sharedParams,
      role: 'initiator',
      sign: initiatorSign
    })
    responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      sign: responderSign
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
    initiatorCh.round() // existingChannelRound
    const result = await initiatorCh.leave()
    result.channelId.should.be.a('string')
    result.signedTx.should.be.a('string')
    existingChannelId = result.channelId
    offchainTx = result.signedTx
  })

  it('can reestablish a channel', async () => {
    initiatorCh = await Channel({
      ...sharedParams,
      role: 'initiator',
      port: 3002,
      existingFsmId: existingChannelId,
      offchainTx,
      sign: initiatorSign
    })
    await waitForChannel(initiatorCh)
    // TODO: why node doesn't return signed_tx when channel is reestablished?
    // initiatorCh.round().should.equal(existingChannelRound)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.notCalled(responderSign)
  })

  it('can solo close a channel', async () => {
    initiatorCh.disconnect()
    responderCh.disconnect()
    initiatorCh = await Channel({
      ...sharedParams,
      role: 'initiator',
      port: 3003,
      sign: initiatorSign
    })
    responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      port: 3003,
      sign: responderSign
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])

    const initiatorAddr = await aeSdkInitiatior.address()
    const responderAddr = await aeSdkResponder.address()
    const { signedTx } = await initiatorCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      BigNumber('3e18'),
      tx => aeSdkInitiatior.signTransaction(tx)
    )
    const poi = await initiatorCh.poi({
      accounts: [initiatorAddr, responderAddr]
    })
    const balances = await initiatorCh.balances([initiatorAddr, responderAddr])
    const initiatorBalanceBeforeClose = await aeSdkInitiatior.balance(initiatorAddr)
    const responderBalanceBeforeClose = await aeSdkResponder.balance(responderAddr)
    const closeSoloTx = await aeSdkInitiatior.channelCloseSoloTx({
      channelId: await initiatorCh.id(),
      fromId: initiatorAddr,
      poi,
      payload: signedTx
    })
    const closeSoloTxFee = unpackTx(closeSoloTx).tx.fee
    await aeSdkInitiatior.sendTransaction(
      await aeSdkInitiatior.signTransaction(closeSoloTx),
      { waitMined: true }
    )
    const settleTx = await aeSdkInitiatior.channelSettleTx({
      channelId: await initiatorCh.id(),
      fromId: initiatorAddr,
      initiatorAmountFinal: balances[initiatorAddr],
      responderAmountFinal: balances[responderAddr]
    })
    const settleTxFee = unpackTx(settleTx).tx.fee
    await aeSdkInitiatior.sendTransaction(
      await aeSdkInitiatior.signTransaction(settleTx), { waitMined: true })
    const initiatorBalanceAfterClose = await aeSdkInitiatior.balance(initiatorAddr)
    const responderBalanceAfterClose = await aeSdkResponder.balance(responderAddr)
    new BigNumber(initiatorBalanceAfterClose)
      .minus(initiatorBalanceBeforeClose)
      .plus(closeSoloTxFee)
      .plus(settleTxFee)
      .isEqualTo(balances[initiatorAddr])
      .should.be.equal(true)
    new BigNumber(responderBalanceAfterClose)
      .minus(responderBalanceBeforeClose)
      .isEqualTo(balances[responderAddr])
      .should.be.equal(true)
  })

  it('can dispute via slash tx', async () => {
    const initiatorAddr = await aeSdkInitiatior.address()
    const responderAddr = await aeSdkResponder.address()
    initiatorCh.disconnect()
    responderCh.disconnect()
    initiatorCh = await Channel({
      ...sharedParams,
      lockPeriod: 5,
      role: 'initiator',
      sign: initiatorSign,
      port: 3004
    })
    responderCh = await Channel({
      ...sharedParams,
      lockPeriod: 5,
      role: 'responder',
      sign: responderSign,
      port: 3004
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
    const initiatorBalanceBeforeClose = await aeSdkInitiatior.balance(initiatorAddr)
    const responderBalanceBeforeClose = await aeSdkResponder.balance(responderAddr)
    const oldUpdate = await initiatorCh.update(
      initiatorAddr, responderAddr, 100, (tx) => aeSdkInitiatior.signTransaction(tx)
    )
    const oldPoi = await initiatorCh.poi({
      accounts: [initiatorAddr, responderAddr]
    })
    const recentUpdate = await initiatorCh.update(
      initiatorAddr, responderAddr, 100, (tx) => aeSdkInitiatior.signTransaction(tx)
    )
    const recentPoi = await responderCh.poi({
      accounts: [initiatorAddr, responderAddr]
    })
    const recentBalances = await responderCh.balances([initiatorAddr, responderAddr])
    const closeSoloTx = await aeSdkInitiatior.channelCloseSoloTx({
      channelId: initiatorCh.id(),
      fromId: initiatorAddr,
      poi: oldPoi,
      payload: oldUpdate.signedTx
    })
    const closeSoloTxFee = unpackTx(closeSoloTx).tx.fee
    await aeSdkInitiatior.sendTransaction(
      await aeSdkInitiatior.signTransaction(closeSoloTx), { waitMined: true }
    )
    const slashTx = await aeSdkResponder.channelSlashTx({
      channelId: responderCh.id(),
      fromId: responderAddr,
      poi: recentPoi,
      payload: recentUpdate.signedTx
    })
    const slashTxFee = unpackTx(slashTx).tx.fee
    await aeSdkResponder.sendTransaction(
      await aeSdkResponder.signTransaction(slashTx), { waitMined: true })
    const settleTx = await aeSdkResponder.channelSettleTx({
      channelId: responderCh.id(),
      fromId: responderAddr,
      initiatorAmountFinal: recentBalances[initiatorAddr],
      responderAmountFinal: recentBalances[responderAddr]
    })
    const settleTxFee = unpackTx(settleTx).tx.fee
    await aeSdkResponder.sendTransaction(
      await aeSdkResponder.signTransaction(settleTx), { waitMined: true })
    const initiatorBalanceAfterClose = await aeSdkInitiatior.balance(initiatorAddr)
    const responderBalanceAfterClose = await aeSdkResponder.balance(responderAddr)
    new BigNumber(initiatorBalanceAfterClose)
      .minus(initiatorBalanceBeforeClose)
      .plus(closeSoloTxFee)
      .isEqualTo(recentBalances[initiatorAddr])
      .should.be.equal(true)
    new BigNumber(responderBalanceAfterClose)
      .minus(responderBalanceBeforeClose)
      .plus(slashTxFee)
      .plus(settleTxFee)
      .isEqualTo(recentBalances[responderAddr])
      .should.be.equal(true)
  })

  it('can create a contract and accept', async () => {
    initiatorCh.disconnect()
    responderCh.disconnect()
    initiatorCh = await Channel({
      ...sharedParams,
      role: 'initiator',
      port: 3005,
      sign: initiatorSign
    })
    responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      port: 3005,
      sign: responderSign
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
    contract = await aeSdkInitiatior.getContractInstance({ source: contractSource })
    await contract.compile()
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.createContract({
      code: contract.bytecode,
      callData: contract.calldata.encode('Identity', 'init', []),
      deposit: 1000,
      vmVersion: 5,
      abiVersion: 3
    }, async (tx) => aeSdkInitiatior.signTransaction(tx))
    result.should.eql({
      accepted: true, address: result.address, signedTx: (await initiatorCh.state()).signedTx
    })
    initiatorCh.round().should.equal(roundBefore + 1)
    contractAddress = result.address
  })

  it('can create a contract and reject', async () => {
    responderShouldRejectUpdate = true
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.createContract({
      code: contract.bytecode,
      callData: contract.calldata.encode('Identity', 'init', []),
      deposit: BigNumber('10e18'),
      vmVersion: 5,
      abiVersion: 3
    }, async (tx) => aeSdkInitiatior.signTransaction(tx))
    initiatorCh.round().should.equal(roundBefore)
    result.should.eql({ ...result, accepted: false })
  })

  it('can abort contract sign request', async () => {
    const errorCode = 12345
    const result = await initiatorCh.createContract({
      code: contract.bytecode,
      callData: contract.calldata.encode('Identity', 'init', []),
      deposit: BigNumber('10e18'),
      vmVersion: 5,
      abiVersion: 3
    }, () => errorCode)
    result.should.eql({ accepted: false })
  })

  it('can abort contract with custom error code', async () => {
    responderShouldRejectUpdate = 12345
    const result = await initiatorCh.createContract({
      code: contract.bytecode,
      callData: contract.calldata.encode('Identity', 'init', []),
      deposit: BigNumber('10e18'),
      vmVersion: 5,
      abiVersion: 3
    }, async (tx) => aeSdkInitiatior.signTransaction(tx))
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined'
    })
  })

  it('can call a contract and accept', async () => {
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: contract.calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: 3
    }, async (tx) => aeSdkInitiatior.signTransaction(tx))
    result.should.eql({ accepted: true, signedTx: (await initiatorCh.state()).signedTx })
    initiatorCh.round().should.equal(roundBefore + 1)
    callerNonce = initiatorCh.round()
  })

  it('can call a force progress', async () => {
    const forceTx = await initiatorCh.forceProgress({
      amount: 0,
      callData: contract.calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: 3
    }, async (tx) => aeSdkInitiatior.signTransaction(tx))
    const hash = buildTxHash(forceTx.tx)
    const { callInfo: { returnType } } = await aeSdkInitiatior.api.getTransactionInfoByHash(hash)
    expect(returnType).to.be.equal('ok')
  })

  it('can call a contract and reject', async () => {
    responderShouldRejectUpdate = true
    const roundBefore = initiatorCh.round()
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: contract.calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: 3
    }, async (tx) => aeSdkInitiatior.signTransaction(tx))
    initiatorCh.round().should.equal(roundBefore)
    result.should.eql({ ...result, accepted: false })
  })

  it('can abort contract call sign request', async () => {
    const errorCode = 12345
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: contract.calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: 3
    }, () => errorCode)
    result.should.eql({ accepted: false })
  })

  it('can abort contract call with custom error code', async () => {
    responderShouldRejectUpdate = 12345
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: contract.calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: 3
    }, async (tx) => aeSdkInitiatior.signTransaction(tx))
    result.should.eql({
      accepted: false,
      errorCode: responderShouldRejectUpdate,
      errorMessage: 'user-defined'
    })
  })

  it('can get contract call', async () => {
    const result = await initiatorCh.getContractCall({
      caller: await aeSdkInitiatior.address(),
      contract: contractAddress,
      round: callerNonce
    })
    result.should.eql({
      callerId: await aeSdkInitiatior.address(),
      callerNonce,
      contractId: contractAddress,
      gasPrice: result.gasPrice,
      gasUsed: result.gasUsed,
      height: result.height,
      log: result.log,
      returnType: 'ok',
      returnValue: result.returnValue
    })
    expect(result.returnType).to.be.equal('ok')
    expect(contract.calldata.decode('Identity', 'getArg', result.returnValue)).to.be.equal(42n)
  })

  it('can call a contract using dry-run', async () => {
    const result = await initiatorCh.callContractStatic({
      amount: 0,
      callData: contract.calldata.encode('Identity', 'getArg', [42]),
      contract: contractAddress,
      abiVersion: 3
    })
    result.should.eql({
      callerId: await aeSdkInitiatior.address(),
      callerNonce: result.callerNonce,
      contractId: contractAddress,
      gasPrice: result.gasPrice,
      gasUsed: result.gasUsed,
      height: result.height,
      log: result.log,
      returnType: 'ok',
      returnValue: result.returnValue
    })
    expect(result.returnType).to.be.equal('ok')
    expect(contract.calldata.decode('Identity', 'getArg', result.returnValue)).to.be.equal(42n)
  })

  it('can clean contract calls', async () => {
    await initiatorCh.cleanContractCalls()
    initiatorCh.getContractCall({
      caller: await aeSdkInitiatior.address(),
      contract: contractAddress,
      round: callerNonce
    }).should.eventually.be.rejected
  })

  it('can get contract state', async () => {
    const result = await initiatorCh.getContractState(contractAddress)
    result.should.eql({
      contract: {
        abiVersion: 3,
        active: true,
        deposit: 1000,
        id: contractAddress,
        ownerId: await aeSdkInitiatior.address(),
        referrerIds: [],
        vmVersion: 5
      },
      contractState: result.contractState
    })
    // TODO: contractState deserialization
  })
  // TODO fix this
  it.skip('can post snapshot solo transaction', async () => {
    const snapshotSoloTx = await aeSdkInitiatior.channelSnapshotSoloTx({
      channelId: initiatorCh.id(),
      fromId: await aeSdkInitiatior.address(),
      payload: (await initiatorCh.state()).signedTx
    })
    await aeSdkInitiatior.sendTransaction(
      await aeSdkInitiatior.signTransaction(snapshotSoloTx), { waitMined: true }
    )
  })

  it('can reconnect', async () => {
    initiatorCh.disconnect()
    responderCh.disconnect()
    initiatorCh = await Channel({
      ...sharedParams,
      role: 'initiator',
      port: 3006,
      sign: initiatorSign
    })
    responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      port: 3006,
      sign: responderSign
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
    const result = await initiatorCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      100,
      tx => aeSdkInitiatior.signTransaction(tx)
    )
    result.accepted.should.be.true
    const channelId = await initiatorCh.id()
    const fsmId = initiatorCh.fsmId()
    initiatorCh.disconnect()
    const ch = await Channel({
      url: sharedParams.url,
      host: sharedParams.host,
      port: 3006,
      role: 'initiator',
      existingChannelId: channelId,
      existingFsmId: fsmId
    })
    await waitForChannel(ch)
    ch.fsmId().should.equal(fsmId)
    // TODO: why node doesn't return signed_tx when channel is reestablished?
    // await new Promise((resolve) => {
    //   const checkRound = () => {
    //     ch.round().should.equal(round)
    //     // TODO: enable line below
    //     // ch.off('stateChanged', checkRound)
    //     resolve()
    //   }
    //   ch.on('stateChanged', checkRound)
    // })
    ch.state().should.eventually.be.fulfilled
    await new Promise(resolve => setTimeout(resolve, 10 * 1000))
  })

  it('can post backchannel update', async () => {
    async function appendSignature (target, source) {
      const { txType, tx: { signatures, encodedTx: { rlpEncoded } } } = unpackTx(target)
      return buildTx({
        signatures: signatures.concat(unpackTx(source).tx.signatures),
        encodedTx: rlpEncoded
      }, txType).tx
    }

    initiatorCh.disconnect()
    responderCh.disconnect()
    initiatorCh = await Channel({
      ...sharedParams,
      role: 'initiator',
      port: 3007,
      sign: initiatorSign
    })
    responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      port: 3007,
      sign: responderSign
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
    initiatorCh.disconnect()
    const { accepted } = await responderCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      100,
      tx => aeSdkResponder.signTransaction(tx)
    )
    accepted.should.be.false
    const result = await responderCh.update(
      await aeSdkInitiatior.address(),
      await aeSdkResponder.address(),
      100,
      async (tx) => appendSignature(
        await aeSdkResponder.signTransaction(tx),
        await aeSdkInitiatior.signTransaction(tx)
      )
    )
    result.accepted.should.equal(true)
    result.signedTx.should.be.a('string')
    initiatorCh.disconnect()
    initiatorCh.disconnect()
  })

  describe('throws errors', function () {
    before(async function () {
      initiatorCh.disconnect()
      responderCh.disconnect()
      initiatorCh = await Channel({
        ...sharedParams,
        role: 'initiator',
        port: 3008,
        sign: initiatorSign
      })
      responderCh = await Channel({
        ...sharedParams,
        role: 'responder',
        port: 3008,
        sign: responderSign
      })
      await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
    })

    after(() => {
      initiatorCh.disconnect()
      responderCh.disconnect()
    })

    async function update ({ from, to, amount, sign }) {
      return initiatorCh.update(
        from || await aeSdkInitiatior.address(),
        to || await aeSdkResponder.address(),
        amount || 1,
        sign || aeSdkInitiatior.signTransaction
      )
    }

    it('when posting an update with negative amount', async () => {
      return update({ amount: -10 }).should.eventually.be.rejectedWith(IllegalArgumentError, 'Amount cannot be negative')
    })

    it('when posting an update with insufficient balance', async () => {
      return update({ amount: BigNumber('999e18') }).should.eventually.be.rejectedWith(InsufficientBalanceError, 'Insufficient balance')
    })

    it('when posting an update with incorrect address', async () => {
      return update({ from: 'ak_123' }).should.eventually.be.rejectedWith(ChannelConnectionError, 'Rejected')
    })
  })
})
