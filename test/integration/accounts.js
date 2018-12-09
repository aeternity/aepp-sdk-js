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
import { configure, ready, BaseAe } from './'
import { generateKeyPair } from '../../es/utils/crypto'
import { networkId } from './index'
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
  })

  it('determines the balance', async () => {
    return wallet.balance(await wallet.address()).should.eventually.be.a('string')
  })

  it('spends tokens', async () => {
    const ret = await wallet.spend(1, receiver)
    ret.should.have.property('tx')
    ret.tx.should.include({
      amount: 1, recipientId: receiver
    })
  })

  it('spends big amount of tokens', async () => {
    const bigAmount = '2702702702700000000123'
    const genesis = await BaseAe({ networkId })
    const balanceBefore = await wallet.balance(await wallet.address())
    const receiverId = await wallet.address()
    const ret = await genesis.spend(bigAmount, receiverId)

    const balanceAfter = await wallet.balance(await wallet.address())
    balanceAfter.should.be.equal(BigNumber(bigAmount).plus(balanceBefore).toString(10))
    ret.should.have.property('tx')
    ret.tx.should.include({
      amount: bigAmount, recipientId: receiverId
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
