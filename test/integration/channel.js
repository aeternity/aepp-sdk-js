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

import { describe, it, before } from 'mocha'
import * as sinon from 'sinon'
import { BigNumber } from 'bignumber.js'
import { configure, ready, plan, BaseAe, networkId } from './'
import { generateKeyPair } from '../../es/utils/crypto'
import { unpackTx, buildTx } from '../../es/tx/builder'
import { decode } from '../../es/tx/builder/helpers'
import Channel from '../../es/channel'

const wsUrl = process.env.TEST_WS_URL || 'ws://localhost:3014/channel'

plan(BigNumber('1000e18').toString())

const identityContract = `
contract Identity =
  type state = ()
  entrypoint main(x : int) = x
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
  configure(this)
  this.timeout(120000)

  let initiator
  let responder
  let initiatorCh
  let responderCh
  let responderShouldRejectUpdate
  let existingChannelId
  let offchainTx
  let contractAddress
  let contractEncodeCall
  let callerNonce
  const initiatorSign = sinon.spy((tag, tx) => initiator.signTransaction(tx))
  const responderSign = sinon.spy((tag, tx) => {
    if (responderShouldRejectUpdate) {
      return null
    }
    return responder.signTransaction(tx)
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
    lockPeriod: 1
  }

  before(async function () {
    initiator = await ready(this)
    responder = await BaseAe({ nativeMode: true, networkId })
    responder.setKeypair(generateKeyPair())
    sharedParams.initiatorId = await initiator.address()
    sharedParams.responderId = await responder.address()
    await initiator.spend(BigNumber('500e18').toString(), await responder.address())
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
    sinon.assert.calledOnce(initiatorSign)
    sinon.assert.calledWithExactly(initiatorSign, sinon.match('initiator_sign'), sinon.match.string)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('responder_sign'), sinon.match.string)
    const expectedTxParams = {
      initiator: await initiator.address(),
      responder: await responder.address(),
      initiatorAmount: sharedParams.initiatorAmount.toString(),
      responderAmount: sharedParams.responderAmount.toString(),
      channelReserve: sharedParams.channelReserve.toString(),
      // TODO: investigate why ttl is "0"
      // ttl: sharedParams.ttl.toString(),
      lockPeriod: sharedParams.lockPeriod.toString()
    }
    const { txType: initiatorTxType, tx: initiatorTx } = unpackTx(initiatorSign.firstCall.args[1])
    const { txType: responderTxType, tx: responderTx } = unpackTx(responderSign.firstCall.args[1])
    initiatorTxType.should.equal('channelCreate')
    initiatorTx.should.eql({ ...initiatorTx, ...expectedTxParams })
    responderTxType.should.equal('channelCreate')
    responderTx.should.eql({ ...responderTx, ...expectedTxParams })
  })

  it('can post update and accept', async () => {
    responderShouldRejectUpdate = false
    const sign = sinon.spy(initiator.signTransaction.bind(initiator))
    const amount = 1
    const result = await initiatorCh.update(
      await initiator.address(),
      await responder.address(),
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
          amount: sinon.match(amount),
          from: sinon.match(await initiator.address()),
          to: sinon.match(await responder.address()),
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
          from: sinon.match(await initiator.address()),
          to: sinon.match(await responder.address()),
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
          from: await initiator.address(),
          to: await responder.address(),
          op: 'OffChainTransfer'
        }
      ]
    })
  })

  it('can post update and reject', async () => {
    responderShouldRejectUpdate = true
    const sign = sinon.spy(initiator.signTransaction.bind(initiator))
    const amount = 1
    const result = await initiatorCh.update(
      await responder.address(),
      await initiator.address(),
      amount,
      sign
    )
    result.accepted.should.equal(false)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(
      responderSign,
      sinon.match('update_ack'),
      sinon.match.string,
      sinon.match({
        updates: sinon.match([{
          amount: sinon.match(amount),
          from: sinon.match(await responder.address()),
          to: sinon.match(await initiator.address()),
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
          from: sinon.match(await responder.address()),
          to: sinon.match(await initiator.address()),
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
          from: await responder.address(),
          to: await initiator.address(),
          op: 'OffChainTransfer'
        }
      ]
    })
  })

  it('can post bignumber update and accept', async () => {
    responderShouldRejectUpdate = false
    const sign = sinon.spy(initiator.signTransaction.bind(initiator))
    const amount = BigNumber('10e18')
    const result = await initiatorCh.update(
      await initiator.address(),
      await responder.address(),
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
          from: sinon.match(await initiator.address()),
          to: sinon.match(await responder.address()),
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
          from: sinon.match(await initiator.address()),
          to: sinon.match(await responder.address()),
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
          from: await initiator.address(),
          to: await responder.address(),
          op: 'OffChainTransfer'
        }
      ]
    })
  })

  it('can get proof of inclusion', async () => {
    const initiatorAddr = await initiator.address()
    const responderAddr = await responder.address()
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
    const initiatorAddr = await initiator.address()
    const responderAddr = await responder.address()
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
    const sender = await initiator.address()
    const recipient = await responder.address()
    const info = 'hello world'
    initiatorCh.sendMessage(info, recipient)
    const message = await new Promise(resolve => responderCh.on('message', resolve))
    message.should.eql({
      // TODO: don't ignore `channel_id` equality check
      channel_id: message.channel_id,
      from: sender,
      to: recipient,
      info
    })
  })

  it('can request a withdraw and accept', async () => {
    const sign = sinon.spy(initiator.signTransaction.bind(initiator))
    const amount = BigNumber('2e18')
    const onOnChainTx = sinon.spy()
    const onOwnWithdrawLocked = sinon.spy()
    const onWithdrawLocked = sinon.spy()
    responderShouldRejectUpdate = false
    const result = await initiatorCh.withdraw(
      amount,
      sign,
      { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked }
    )
    result.should.eql({ accepted: true, signedTx: (await initiatorCh.state()).signedTx })
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
          to: await initiator.address()
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
          to: await initiator.address()
        }]
      })
    )
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelWithdraw')
    tx.should.eql({
      ...tx,
      toId: await initiator.address(),
      amount: amount.toString()
    })
  })

  it('can request a withdraw and reject', async () => {
    const sign = sinon.spy(initiator.signTransaction.bind(initiator))
    const amount = BigNumber('2e18')
    const onOnChainTx = sinon.spy()
    const onOwnWithdrawLocked = sinon.spy()
    const onWithdrawLocked = sinon.spy()
    responderShouldRejectUpdate = true
    const result = await initiatorCh.withdraw(
      amount,
      sign,
      { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked }
    )
    result.should.eql({ accepted: false })
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
          to: await initiator.address()
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
          to: await initiator.address()
        }]
      })
    )
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelWithdraw')
    tx.should.eql({
      ...tx,
      toId: await initiator.address(),
      amount: amount.toString()
    })
  })

  it('can request a deposit and accept', async () => {
    const sign = sinon.spy(initiator.signTransaction.bind(initiator))
    const amount = BigNumber('2e18')
    const onOnChainTx = sinon.spy()
    const onOwnDepositLocked = sinon.spy()
    const onDepositLocked = sinon.spy()
    responderShouldRejectUpdate = false
    const result = await initiatorCh.deposit(
      amount,
      sign,
      { onOnChainTx, onOwnDepositLocked, onDepositLocked }
    )
    result.should.eql({ accepted: true, signedTx: (await initiatorCh.state()).signedTx })
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
          from: await initiator.address()
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
          from: await initiator.address()
        }])
      })
    )
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelDeposit')
    tx.should.eql({
      ...tx,
      fromId: await initiator.address(),
      amount: amount.toString()
    })
  })

  it('can request a deposit and reject', async () => {
    const sign = sinon.spy(initiator.signTransaction.bind(initiator))
    const amount = BigNumber('2e18')
    const onOnChainTx = sinon.spy()
    const onOwnDepositLocked = sinon.spy()
    const onDepositLocked = sinon.spy()
    responderShouldRejectUpdate = true
    const result = await initiatorCh.deposit(
      amount,
      sign,
      { onOnChainTx, onOwnDepositLocked, onDepositLocked }
    )
    result.should.eql({ accepted: false })
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
          from: await initiator.address()
        }]
      })
    )
    const { txType, tx } = unpackTx(sign.firstCall.args[0])
    txType.should.equal('channelDeposit')
    tx.should.eql({
      ...tx,
      fromId: await initiator.address(),
      amount: amount.toString()
    })
  })

  it('can close a channel', async () => {
    const sign = sinon.spy(initiator.signTransaction.bind(initiator))
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
      fromId: await initiator.address(),
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
      existingChannelId,
      offchainTx,
      sign: initiatorSign
    })
    responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      port: 3002,
      existingChannelId,
      offchainTx,
      sign: responderSign
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
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

    const initiatorAddr = await initiator.address()
    const responderAddr = await responder.address()
    const { signedTx } = await initiatorCh.update(
      await initiator.address(),
      await responder.address(),
      BigNumber('3e18'),
      tx => initiator.signTransaction(tx)
    )
    const poi = await initiatorCh.poi({
      accounts: [initiatorAddr, responderAddr],
    })
    const balances = await initiatorCh.balances([initiatorAddr, responderAddr])
    const initiatorBalanceBeforeClose = await initiator.balance(initiatorAddr)
    const responderBalanceBeforeClose = await responder.balance(responderAddr)
    const closeSoloTx = await initiator.channelCloseSoloTx({
      channelId: await initiatorCh.id(),
      fromId: initiatorAddr,
      poi,
      payload: signedTx
    })
    const closeSoloTxFee = unpackTx(closeSoloTx).tx.fee
    await initiator.sendTransaction(await initiator.signTransaction(closeSoloTx), { waitMined: true })
    const settleTx = await initiator.channelSettleTx({
      channelId: await initiatorCh.id(),
      fromId: initiatorAddr,
      initiatorAmountFinal: balances[initiatorAddr],
      responderAmountFinal: balances[responderAddr]
    })
    const settleTxFee = unpackTx(settleTx).tx.fee
    await initiator.sendTransaction(await initiator.signTransaction(settleTx), { waitMined: true })
    const initiatorBalanceAfterClose = await initiator.balance(initiatorAddr)
    const responderBalanceAfterClose = await responder.balance(responderAddr)
    new BigNumber(initiatorBalanceAfterClose).minus(initiatorBalanceBeforeClose).plus(closeSoloTxFee).plus(settleTxFee).isEqualTo(
      new BigNumber(balances[initiatorAddr])
    ).should.be.equal(true)
    new BigNumber(responderBalanceAfterClose).minus(responderBalanceBeforeClose).isEqualTo(
      new BigNumber(balances[responderAddr])
    ).should.be.equal(true)
  })

  it('can dispute via slash tx', async () => {
    const initiatorAddr = await initiator.address()
    const responderAddr = await responder.address()
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
    const initiatorBalanceBeforeClose = await initiator.balance(initiatorAddr)
    const responderBalanceBeforeClose = await responder.balance(responderAddr)
    const oldUpdate = await initiatorCh.update(initiatorAddr, responderAddr, 100, (tx) => initiator.signTransaction(tx))
    const oldPoi = await initiatorCh.poi({
      accounts: [initiatorAddr, responderAddr]
    })
    const recentUpdate = await initiatorCh.update(initiatorAddr, responderAddr, 100, (tx) => initiator.signTransaction(tx))
    const recentPoi = await responderCh.poi({
      accounts: [initiatorAddr, responderAddr]
    })
    const recentBalances = await responderCh.balances([initiatorAddr, responderAddr])
    const closeSoloTx = await initiator.channelCloseSoloTx({
      channelId: initiatorCh.id(),
      fromId: initiatorAddr,
      poi: oldPoi,
      payload: oldUpdate.signedTx
    })
    const closeSoloTxFee = unpackTx(closeSoloTx).tx.fee
    await initiator.sendTransaction(await initiator.signTransaction(closeSoloTx), { waitMined: true })
    const slashTx = await responder.channelSlashTx({
      channelId: responderCh.id(),
      fromId: responderAddr,
      poi: recentPoi,
      payload: recentUpdate.signedTx
    })
    const slashTxFee = unpackTx(slashTx).tx.fee
    await responder.sendTransaction(await responder.signTransaction(slashTx), { waitMined: true })
    const settleTx = await responder.channelSettleTx({
      channelId: responderCh.id(),
      fromId: responderAddr,
      initiatorAmountFinal: recentBalances[initiatorAddr],
      responderAmountFinal: recentBalances[responderAddr]
    })
    const settleTxFee = unpackTx(settleTx).tx.fee
    await responder.sendTransaction(await responder.signTransaction(settleTx), { waitMined: true })
    const initiatorBalanceAfterClose = await initiator.balance(initiatorAddr)
    const responderBalanceAfterClose = await responder.balance(responderAddr)
    new BigNumber(initiatorBalanceAfterClose).minus(initiatorBalanceBeforeClose).plus(closeSoloTxFee).isEqualTo(
      new BigNumber(recentBalances[initiatorAddr])
    ).should.be.equal(true)
    new BigNumber(responderBalanceAfterClose).minus(responderBalanceBeforeClose).plus(slashTxFee).plus(settleTxFee).isEqualTo(
      new BigNumber(recentBalances[responderAddr])
    ).should.be.equal(true)
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
    const code = await initiator.compileContractAPI(identityContract)
    const callData = await initiator.contractEncodeCallDataAPI(identityContract, 'init', [])
    const result = await initiatorCh.createContract({
      code,
      callData,
      deposit: 1000,
      vmVersion: 4,
      abiVersion: 1
    }, async (tx) => await initiator.signTransaction(tx))
    result.should.eql({ accepted: true, address: result.address, signedTx: (await initiatorCh.state()).signedTx })
    contractAddress = result.address
    contractEncodeCall = (method, args) => initiator.contractEncodeCallDataAPI(identityContract, method, args)
  })

  it('can create a contract and reject', async () => {
    responderShouldRejectUpdate = true
    const code = await initiator.compileContractAPI(identityContract)
    const callData = await initiator.contractEncodeCallDataAPI(identityContract, 'init', [])
    const result = await initiatorCh.createContract({
      code,
      callData,
      deposit: BigNumber('10e18'),
      vmVersion: 4,
      abiVersion: 1
    }, async (tx) => await initiator.signTransaction(tx))
    result.should.eql({ accepted: false })
  })

  it('can call a contract and accept', async () => {
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: await contractEncodeCall('main', ['42']),
      contract: contractAddress,
      abiVersion: 1
    }, async (tx) => await initiator.signTransaction(tx))
    result.should.eql({ accepted: true, signedTx: (await initiatorCh.state()).signedTx })
    callerNonce = Number(unpackTx((await initiatorCh.state()).signedTx).tx.encodedTx.tx.round)
  })

  it('can call a contract and reject', async () => {
    responderShouldRejectUpdate = true
    const result = await initiatorCh.callContract({
      amount: 0,
      callData: await contractEncodeCall('main', ['42']),
      contract: contractAddress,
      abiVersion: 1
    }, async (tx) => await initiator.signTransaction(tx))
    result.should.eql({ accepted: false })
  })

  it('can get contract call', async () => {
    const result = await initiatorCh.getContractCall({
      caller: await initiator.address(),
      contract: contractAddress,
      round: callerNonce
    })
    result.should.eql({
      callerId: await initiator.address(),
      callerNonce,
      contractId: contractAddress,
      gasPrice: result.gasPrice,
      gasUsed: result.gasUsed,
      height: result.height,
      log: result.log,
      returnType: 'ok',
      returnValue: result.returnValue
    })
    const value = await initiator.contractDecodeDataAPI('int', result.returnValue)
    value.should.eql({ type: 'word', value: 42 })
  })

  it('can call a contract using dry-run', async () => {
    const result = await initiatorCh.callContractStatic({
      amount: BigNumber('2e18'),
      callData: await contractEncodeCall('main', ['42']),
      contract: contractAddress,
      abiVersion: 1
    })
    result.should.eql({
      callerId: await initiator.address(),
      callerNonce: result.callerNonce,
      contractId: contractAddress,
      gasPrice: result.gasPrice,
      gasUsed: result.gasUsed,
      height: result.height,
      log: result.log,
      returnType: 'ok',
      returnValue: result.returnValue
    })
    const value = await initiator.contractDecodeDataAPI('int', result.returnValue)
    value.should.eql({ type: 'word', value: 42 })
  })

  it('can clean contract calls', async () => {
    await initiatorCh.cleanContractCalls()
    initiatorCh.getContractCall({
      caller: await initiator.address(),
      contract: contractAddress,
      round: callerNonce
    }).should.eventually.be.rejectedWith('Rejected: Call not found')
  })

  it('can get contract state', async () => {
    const result = await initiatorCh.getContractState(contractAddress)
    result.should.eql({
      contract: {
        abiVersion: 1,
        active: true,
        deposit: 1000,
        id: contractAddress,
        ownerId: await initiator.address(),
        referrerIds: [],
        vmVersion: 4,
      },
      contractState: result.contractState
    })
    // TODO: contractState deserialization
  })

  it('can post snapshot solo transaction', async () => {
    const snapshotSoloTx = await initiator.channelSnapshotSoloTx({
      channelId: initiatorCh.id(),
      fromId: await initiator.address(),
      payload: (await initiatorCh.state()).signedTx
    })
    await initiator.sendTransaction(await initiator.signTransaction(snapshotSoloTx), { waitMined: true })
  })

  describe('throws errors', function () {
    before(async function () {
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
    })

    after(() => {
      initiatorCh.disconnect()
      responderCh.disconnect()
    })

    async function update ({ from, to, amount, sign }) {
      return initiatorCh.update(
        from || await initiator.address(),
        to || await responder.address(),
        amount || 1,
        sign || initiator.signTransaction
      )
    }

    it('when posting an update with negative amount', async () => {
      return update({ amount: -10 }).should.eventually.be.rejectedWith('Amount cannot be negative')
    })

    it('when posting an update with insufficient balance', async () => {
      return update({ amount: BigNumber('999e18') }).should.eventually.be.rejectedWith('Insufficient balance')
    })

    it('when posting an update with incorrect address', async () => {
      return update({ from: 'ak_123' }).should.eventually.be.rejectedWith('Rejected')
    })
  })
})
