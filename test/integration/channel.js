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
import { configure, ready, plan, BaseAe, networkId } from './'
import { generateKeyPair } from '../../es/utils/crypto'
import { unpackTx } from '../../es/tx/builder'
import Channel from '../../es/channel'

const wsUrl = process.env.WS_URL || 'ws://node:3014'

plan('10000000000000000')

const identityContract = `
contract Identity =
  type state = ()
  public function main(x : int) = x
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
    initiatorAmount: 1000000000000000,
    responderAmount: 1000000000000000,
    channelReserve: 20000000000,
    ttl: 10000,
    host: 'localhost',
    port: 3001,
    lockPeriod: 10
  }

  before(async function () {
    initiator = await ready(this)
    responder = await BaseAe({ nativeMode: true, networkId })
    responder.setKeypair(generateKeyPair())
    sharedParams.initiatorId = await initiator.address()
    sharedParams.responderId = await responder.address()
    await initiator.spend('6000000000000000', await responder.address())
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
  })

  it('can post update and accept', async () => {
    responderShouldRejectUpdate = false
    const result = await initiatorCh.update(
      await initiator.address(),
      await responder.address(),
      1,
      async (tx) => await initiator.signTransaction(tx)
    )
    result.accepted.should.equal(true)
    result.signedTx.should.be.a('string')
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('update_ack'), sinon.match.string)
  })

  it('can post update and reject', async () => {
    responderShouldRejectUpdate = true
    const result = await initiatorCh.update(
      await responder.address(),
      await initiator.address(),
      1,
      async (tx) => await initiator.signTransaction(tx)
    )
    result.accepted.should.equal(false)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('update_ack'), sinon.match.string)
  })

  it('can get proof of inclusion', async () => {
    const initiatorAddr = await initiator.address()
    const responderAddr = await responder.address()
    const params = { accounts: [initiatorAddr, responderAddr] }
    const initiatorPoi = await initiatorCh.poi(params)
    const responderPoi = await responderCh.poi(params)
    initiatorPoi.should.be.a('string')
    responderPoi.should.be.a('string')
  })

  it('can get balances', async () => {
    const initiatorAddr = await initiator.address()
    const responderAddr = await responder.address()
    const addresses = [initiatorAddr, responderAddr]
    const initiatorBalances = await initiatorCh.balances(addresses)
    const responderBalances = await responderCh.balances(addresses)
    initiatorBalances.should.be.an('object')
    responderBalances.should.be.an('object')
    initiatorBalances[initiatorAddr].should.be.a('number')
    initiatorBalances[responderAddr].should.be.a('number')
    responderBalances[initiatorAddr].should.be.a('number')
    responderBalances[responderAddr].should.be.a('number')
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
    const onOnChainTx = sinon.spy()
    const onOwnWithdrawLocked = sinon.spy()
    const onWithdrawLocked = sinon.spy()
    responderShouldRejectUpdate = false
    const result = await initiatorCh.withdraw(
      2,
      async (tx) => initiator.signTransaction(tx),
      { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked }
    )
    result.should.eql({ accepted: true, signedTx: (await initiatorCh.state()).signedTx })
    sinon.assert.calledOnce(onOnChainTx)
    sinon.assert.calledWithExactly(onOnChainTx, sinon.match.string)
    sinon.assert.calledOnce(onOwnWithdrawLocked)
    sinon.assert.calledOnce(onWithdrawLocked)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('withdraw_ack'), sinon.match.string)
  })

  it('can request a withdraw and reject', async () => {
    const onOnChainTx = sinon.spy()
    const onOwnWithdrawLocked = sinon.spy()
    const onWithdrawLocked = sinon.spy()
    responderShouldRejectUpdate = true
    const result = await initiatorCh.withdraw(
      2,
      async (tx) => initiator.signTransaction(tx),
      { onOnChainTx, onOwnWithdrawLocked, onWithdrawLocked }
    )
    result.should.eql({ accepted: false })
    sinon.assert.notCalled(onOnChainTx)
    sinon.assert.notCalled(onOwnWithdrawLocked)
    sinon.assert.notCalled(onWithdrawLocked)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('withdraw_ack'), sinon.match.string)
  })

  it('can request a deposit and accept', async () => {
    const onOnChainTx = sinon.spy()
    const onOwnDepositLocked = sinon.spy()
    const onDepositLocked = sinon.spy()
    responderShouldRejectUpdate = false
    const result = await initiatorCh.deposit(
      2,
      async (tx) => initiator.signTransaction(tx),
      { onOnChainTx, onOwnDepositLocked, onDepositLocked }
    )
    result.should.eql({ accepted: true, signedTx: (await initiatorCh.state()).signedTx })
    sinon.assert.calledOnce(onOnChainTx)
    sinon.assert.calledWithExactly(onOnChainTx, sinon.match.string)
    sinon.assert.calledOnce(onOwnDepositLocked)
    sinon.assert.calledOnce(onDepositLocked)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('deposit_ack'), sinon.match.string)
  })

  it('can request a deposit and reject', async () => {
    const onOnChainTx = sinon.spy()
    const onOwnDepositLocked = sinon.spy()
    const onDepositLocked = sinon.spy()
    responderShouldRejectUpdate = true
    const result = await initiatorCh.deposit(
      2,
      async (tx) => initiator.signTransaction(tx),
      { onOnChainTx, onOwnDepositLocked, onDepositLocked }
    )
    result.should.eql({ accepted: false })
    sinon.assert.notCalled(onOnChainTx)
    sinon.assert.notCalled(onOwnDepositLocked)
    sinon.assert.notCalled(onDepositLocked)
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('deposit_ack'), sinon.match.string)
  })

  it('can close a channel', async () => {
    const tx = await initiatorCh.shutdown(async (tx) => await initiator.signTransaction(tx))
    tx.should.be.a('string')
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.calledOnce(responderSign)
    sinon.assert.calledWithExactly(responderSign, sinon.match('shutdown_sign_ack'), sinon.match.string)
  })

  it('can leave a channel', async () => {
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
      existingChannelId,
      offchainTx,
      sign: initiatorSign
    })
    responderCh = await Channel({
      ...sharedParams,
      role: 'responder',
      existingChannelId,
      offchainTx,
      sign: responderSign
    })
    await Promise.all([waitForChannel(initiatorCh), waitForChannel(responderCh)])
    sinon.assert.notCalled(initiatorSign)
    sinon.assert.notCalled(responderSign)
    await initiatorCh.leave()
  })

  it('can create a contract and accept', async () => {
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
    const code = await initiator.compileContractAPI(identityContract)
    const callData = await initiator.contractEncodeCallDataAPI(identityContract, 'init', [])
    const result = await initiatorCh.createContract({
      code,
      callData,
      deposit: 1000,
      vmVersion: 3,
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
      deposit: 1000,
      vmVersion: 3,
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

  describe('throws errors', function () {
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
      return update({ amount: 2000000000000000 }).should.eventually.be.rejectedWith('Insufficient balance')
    })

    it('when posting an update with incorrect address', async () => {
      return update({ from: 'ak_123' }).should.eventually.be.rejectedWith('Rejected')
    })

    it('when posting an update with incorrect amount', async () => {
      return update({ amount: '1' }).should.eventually.be.rejectedWith('Internal error')
    })

    it('when posting incorrect update tx', async () => {
      return update({ sign: () => 'abcdefg' }).should.eventually.be.rejectedWith('Internal error')
    })
  })
})
