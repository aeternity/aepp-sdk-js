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

import { Wallet, Crypto } from '@aeternity/aepp-sdk'
import * as utils from './utils'
import * as R from 'ramda'

describe('wallet', function () {
  utils.configure(this)

  let client
  let wallet

  before(async function () {
    client = await utils.client
    wallet = Wallet.create(client, utils.sourceWallet)
  })

  const { pub: receiver } = Crypto.generateKeyPair()

  describe('fails on unknown keypairs', () => {
    let wallet
    
    before(async function () {
      client = await utils.client
      wallet = Wallet.create(client, Crypto.generateKeyPair())
    })

    it('determining the balance', async () => {
      return wallet.balance().should.be.rejectedWith(Error)
    })

    it('spending tokens', async () => {
      return wallet.spend(1, receiver).should.be.rejectedWith(Error)
    })
  })
  
  it('determines the balance', async () => {
    return wallet.balance().should.eventually.be.a('number')
  })

  it('spends tokens', async () => {
    const ret = await wallet.spend(1, receiver)
    ret.should.have.property('tx')
    ret.tx.should.include({
      amount: 1, recipient: receiver
    })
  })

  describe('can be configured to return th', () => {
    it('on creation', async () => {
      const wallet = Wallet.create(client, utils.sourceWallet, { waitMined: false })
      const th = await wallet.spend(1, receiver)
      th.should.be.a('string')
      th.slice(0, 3).should.equal('th$')
    })

    it('on call', async () => {
      const th = await wallet.spend(1, receiver, { waitMined: false })
      th.should.be.a('string')
      th.slice(0, 3).should.equal('th$')
    })
  })
})
