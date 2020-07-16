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
import { getSdk, BaseAe, networkId } from './'
import { generateKeyPair } from '../../es/utils/crypto'
import BigNumber from 'bignumber.js'
import MemoryAccount from '../../es/account/memory'
import { AE_AMOUNT_FORMATS } from '../../es/utils/amount-formatter'

describe('Accounts', function () {
  let wallet

  before(async function () {
    wallet = await getSdk()
  })

  const receiverKey = generateKeyPair()
  const receiver = receiverKey.publicKey

  describe('fails on unknown keypairs', () => {
    let wallet

    before(async function () {
      wallet = await getSdk()
      await wallet.addAccount(MemoryAccount({ keypair: generateKeyPair() }), { select: true })
    })

    it('determining the balance using deprecated `balance` method', async () => {
      return wallet.balance(await wallet.address()).should.be.rejectedWith(Error)
    })

    it('determining the balance', async () => {
      return wallet.getBalance(await wallet.address()).should.eventually.be.equal('0')
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

  it('determines the balance using `balance`', async () => {
    return wallet.balance(await wallet.address()).should.eventually.be.a('string')
  })

  describe('transferFunds', async () => {
    const spend = async fraction => {
      const balanceBefore = new BigNumber(await wallet.balance(await wallet.address()))
      const { tx } = await wallet.transferFunds(fraction, receiver)
      const balanceAfter = new BigNumber(await wallet.balance(await wallet.address()))
      return {
        balanceBefore,
        balanceAfter,
        amount: new BigNumber(tx.amount),
        fee: new BigNumber(tx.fee)
      }
    }

    it('throws exception if fraction is out of range', () => wallet.transferFunds(-1, receiver)
      .should.be.rejectedWith(/Fraction should be a number between 0 and 1, got/))

    it('spends 0% of balance', async () => {
      const { balanceBefore, balanceAfter, amount } = await spend(0)
      balanceBefore.should.be.not.eql(balanceAfter)
      amount.isZero().should.be.equal(true)
    })

    it('spends 68.97% of balance', async () => {
      const { balanceBefore, balanceAfter, amount, fee } = await spend(0.6897)
      balanceBefore.times(0.6897).integerValue(BigNumber.ROUND_HALF_UP).should.be.eql(amount)
      balanceAfter.plus(amount).plus(fee).should.be.eql(balanceBefore)
    })

    it('spends 100% of balance', async () => {
      const { balanceBefore, balanceAfter, amount, fee } = await spend(1)
      amount.plus(fee).should.be.eql(balanceBefore)
      balanceAfter.isZero().should.be.equal(true)
    })

    it('accepts onAccount option', async () => {
      await wallet.transferFunds(1, await wallet.address(), { onAccount: receiverKey })
      new BigNumber(await wallet.balance(receiver)).isZero().should.be.equal(true)
    })
  })

  it('spends tokens', async () => {
    const ret = await wallet.spend(1, receiver)
    ret.should.have.property('tx')
    ret.tx.should.include({
      amount: 1, recipientId: receiver
    })
  })

  it('spends tokens in AE format', async () => {
    const ret = await wallet.spend(1, receiver, { denomination: AE_AMOUNT_FORMATS.AE })
    ret.should.have.property('tx')
    ret.tx.should.include({
      amount: `${1e18}`, recipientId: receiver
    })
  })

  it('spends big amount of tokens', async () => {
    const bigAmount = '10000000000000100000000000000000'
    const genesis = await BaseAe({ networkId })
    const receiverWallet = generateKeyPair()
    const ret = await genesis.spend(bigAmount, receiverWallet.publicKey)

    const balanceAfter = await wallet.balance(receiverWallet.publicKey)
    balanceAfter.should.be.equal(bigAmount)
    ret.should.have.property('tx')
    ret.tx.should.include({
      amount: bigAmount, recipientId: receiverWallet.publicKey
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
      // SPEND
      try {
        await wallet.spend(1, await wallet.address(), { onAccount: 1 })
      } catch (e) {
        e.message.should.be.equal('Invalid `onAccount` option: should be keyPair object or account address')
      }
    })

    it('Fail on non exist account', async () => {
      // SPEND
      try {
        await wallet.spend(1, await wallet.address(), { onAccount: 'ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk' })
      } catch (e) {
        e.message.should.be.equal('Account for ak_q2HatMwDnwCBpdNtN9oXf5gpD9pGSgFxaa8i2Evcam6gjiggk not available')
      }
    })
    it('Invalid on account options', async () => {
      try {
        await wallet.sign('tx_Aasdasd', { onAccount: 123 })
      } catch (e) {
        e.message.should.be.equal('Invalid `onAccount` option: should be keyPair object or account address')
      }
    })
    it('Make operation on account using keyPair/MemoryAccount', async () => {
      const keypair = generateKeyPair()
      const memoryAccount = MemoryAccount({ keypair })
      const data = 'Hello'
      const signature = await memoryAccount.sign(data)
      const sigUsingKeypair = await wallet.sign(data, { onAccount: keypair })
      const sigUsingMemoryAccount = await wallet.sign(data, { onAccount: memoryAccount })
      signature.toString('hex').should.be.equal(sigUsingKeypair.toString('hex'))
      signature.toString('hex').should.be.equal(sigUsingMemoryAccount.toString('hex'))
      // address
      const addressFromKeypair = await wallet.address({ onAccount: keypair })
      const addressFrommemoryAccount = await wallet.address({ onAccount: memoryAccount })
      addressFromKeypair.should.be.equal(keypair.publicKey)
      addressFrommemoryAccount.should.be.equal(keypair.publicKey)
    })
    it('Make operation on account using keyPair: Invalid keypair', async () => {
      const keypair = generateKeyPair()
      keypair.publicKey = 'ak_bev1aPMdAeJTuUiCJ7mHbdQiAizrkRGgoV9FfxHYb6pAxo5WY'
      const data = 'Hello'
      try {
        await wallet.sign(data, { onAccount: keypair })
      } catch (e) {
        e.message.should.be.equal('Invalid \'onAccount\' option: Invalid Key Pair')
      }
      try {
        await wallet.address({ onAccount: keypair })
      } catch (e) {
        e.message.should.be.equal('Invalid \'onAccount\' option: Invalid Key Pair')
      }
    })
  })

  describe('can be configured to return th', () => {
    it('on creation', async () => {
      const wallet = await getSdk()
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
