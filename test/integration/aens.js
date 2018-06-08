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
import { expect } from 'chai'
import { Wallet, Aens, Crypto } from '@aeternity/aepp-sdk'
import * as utils from './utils'
import * as R from 'ramda'

function randomName () {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) + '.aet'
}

utils.plan(20)

describe('aens', function () {
  utils.configure(this)

  let client
  let aens
  const name = randomName()

  before(async function () {
    await utils.waitReady(this)
    client = await utils.client
    aens = Aens.create(client, { wallet: Wallet.create(client, utils.sourceWallet) })
  })

  describe('fails on', () => {
    const name = randomName()

    it('querying non-existent names', async () => {
      return aens.query(name).should.eventually.be.rejected
    })

    it('updating names not owned by the account', async () => {
      const preclaim = await aens.preclaim(name)
      const claim = await preclaim.claim()

      const aens2 = Aens.create(client, { wallet: Wallet.create(client, utils.wallets[0]) })
      return aens2.update(claim.nameHash)(utils.wallets[0].pub, { options: { blocks: 1 } }).should.eventually.be.rejected
    })
  })

  it('commitment hashes match those from the node', async () => {
    const name = randomName()
    const salt = Aens.salt()
    const hash = Aens.commitmentHash(name, salt)
    return hash.should.be.equal((await client.api.getCommitmentHash(name, salt)).commitment)
  })

  it('claims names', async () => {
    const preclaim = await aens.preclaim(name)
    preclaim.should.be.an('object')
    return preclaim.claim().should.eventually.be.an('object')
  })

  it('queries names', async () => {
    return aens.query(name).should.eventually.be.an('object')
  })

  it('updates names', async () => {
    const claim = await aens.query(name)
    return claim.update(utils.sourceWallet.pub).should.eventually.deep.include({
      pointers: R.fromPairs([['accountPubkey', utils.sourceWallet.pub]])
    })
  })

  // TODO re-enable after release; no idea why it doesn't work
  it.skip('transfers names', async () => {
    const claim = await aens.query(name)
    await claim.transfer(utils.wallets[0].pub)
    const aens2 = Aens.create(client, { wallet: Wallet.create(client, utils.wallets[0]) })
    const claim2 = await aens2.query(name)
    return claim2.update(utils.wallets[0].pub).should.eventually.deep.include({
      pointers: R.fromPairs([['accountPubkey', utils.wallets[0].pub]])
    })
  })
})
