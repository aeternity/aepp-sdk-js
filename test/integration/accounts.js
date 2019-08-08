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
import { configure, ready, BaseAe, networkId } from './'
import { generateKeyPair } from '../../es/utils/crypto'
import { BigNumber } from 'bignumber.js'

describe('Accounts', function () {
  configure(this)

  let wallet

  before(async function () {
    wallet = await ready(this)
  })

  const { publicKey: receiver } = generateKeyPair()

  describe('fails on unknown keypairs', () => {
    let wallet

    before(async function () {
      wallet = await ready(this)
      wallet.setKeypair(generateKeyPair())
    })

    it('determining the balance', async () => {
      return wallet.balance(await wallet.address()).should.be.rejectedWith(Error)
    })

    it('spending tokens', async () => {
      return wallet.spend(1, receiver).should.be.rejectedWith(Error)
    })

    it('spending minus amount of tokens', async () => {
      try {
        await wallet.spend(-1, receiver)
      } catch (e) {
        e.message.should.be.equal('Transaction build error. {"amount":"-1 must be >= 0"}')
      }
    })
  })

  it('determines the balance', async () => {
    return wallet.balance(await wallet.address()).should.eventually.be.a('string')
  })

  it('Spend 50% of balance', async () => {
    const balance = await wallet.balance(await wallet.address())

    await wallet.transferFunds(0.5, 'ak_DMNCzsVoZnpV5fe8FTQnNsTfQ48YM5C3WbHPsJyHjAuTXebFi')
    const balanceAfter = await wallet.balance(await wallet.address())
    BigNumber(balance).div(balanceAfter).toNumber().should.be.equal(2)
  })

  it('spends tokens', async () => {
    const ret = await wallet.spend(1, receiver)
    ret.should.have.property('tx')
    ret.tx.should.include({
      amount: 1, recipientId: receiver
    })
  })

  it('spends big amount of tokens', async () => {
    const bigAmount = '10000000000000100000000000000000'
    const genesis = await BaseAe({ networkId })
    const balanceBefore = await wallet.balance(await wallet.address(), { format: false })
    const receiverId = await wallet.address()
    const ret = await genesis.spend(bigAmount, receiverId)

    const balanceAfter = await wallet.balance(await wallet.address(), { format: false })
    balanceAfter.should.be.equal(BigNumber(bigAmount).plus(balanceBefore).toString(10))
    ret.should.have.property('tx')
    ret.tx.should.include({
      amount: bigAmount, recipientId: receiverId
    })
  })

  it('Get Account by block height/hash', async () => {
    const h = await wallet.height()
    await wallet.awaitHeight(h + 3)
    const spend = await wallet.spend(123, 'ak_DMNCzsVoZnpV5fe8FTQnNsTfQ48YM5C3WbHPsJyHjAuTXebFi')
    await wallet.awaitHeight(spend.blockHeight + 2)
    const accountAfterSpend = await wallet.getAccount(await wallet.address())
    const accountBeforeSpendByHash = await wallet.getAccount(await wallet.address(), { height: spend.blockHeight - 1 })
    BigNumber(accountBeforeSpendByHash.balance)
      .minus(BigNumber(accountAfterSpend.balance))
      .toString()
      .should.be
      .equal(`${spend.tx.fee + spend.tx.amount}`)
  })

  describe('Make operation on specific account without changing of current account', () => {
    it('Can make spend on specific account', async () => {
      const current = await wallet.address()
      const accounts = wallet.addresses()
      const onAccount = accounts.find(acc => acc !== current)
      // SPEND
      const { tx } = await wallet.spend(1, await wallet.address(), { onAccount })
      tx.senderId.should.be.equal(onAccount)
      current.should.be.equal(current)

    })

    it('Fail on invalid account', async () => {
      const current = await wallet.address()
      // SPEND
      try {
        await wallet.spend(1, await wallet.address(), { onAccount: 1 })
      } catch (e) {
        e.message.should.be.equal('Invalid account address, check "onAccount" value')
      }
    })

    it('Fail on non exist account', async () => {
      const current = await wallet.address()
      // SPEND
      try {
        await wallet.spend(1, await wallet.address(), { onAccount: 'ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk' })
      } catch (e) {
        e.message.should.be.equal('Account for ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk not available')
      }
    })
  })

  describe('can be configured to return th', () => {
    it('on creation', async () => {
      const wallet = await ready(this)
      // const wallet = await BaseAe.compose({deepProps: {Chain: {defaults: {waitMined: false}}}})()
      const th = await wallet.spend(1, receiver)
      th.should.be.a('object')
      th.hash.slice(0, 3).should.equal('th_')
    })

    it('on call', async () => {
      const th = await wallet.spend(1, receiver)
      th.should.be.a('object')
      th.hash.slice(0, 3).should.equal('th_')
    })
  })
})
