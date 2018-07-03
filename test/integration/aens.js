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

import {describe, it, before} from 'mocha'
import {configure, plan, ready, accounts, BaseAe} from './'
import * as R from 'ramda'

function randomName () {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) + '.aet'
}

plan(20)

describe('Aens', function () {
  configure(this)

  let aens
  const name = randomName()

  before(async function () {
    aens = await ready(this)
  })

  describe('fails on', () => {
    const name = randomName()

    it('querying non-existent names', async () => {
      return aens.aensQuery(name).should.eventually.be.rejected
    })

    it('updating names not owned by the account', async () => {
      const preclaim = await aens.aensPreclaim(name)
      const claim = await preclaim.claim()

      const aens2 = await BaseAe({keypair: accounts[0]})
      return aens2.aensUpdate(claim.nameHash, accounts[0].pub, {blocks: 1}).should.eventually.be.rejected
    })
  })

  it('claims names', async () => {
    const preclaim = await aens.aensPreclaim(name)
    preclaim.should.be.an('object')
    return preclaim.claim().should.eventually.be.an('object')
  })

  it('queries names', async () => {
    return aens.aensQuery(name).should.eventually.be.an('object')
  })

  it('updates names', async () => {
    const claim = await aens.aensQuery(name)
    const address = await aens.address()
    return claim.update(address).should.eventually.deep.include({
      pointers: R.fromPairs([['accountPubkey', address]])
    })
  })

  // TODO re-enable after release; no idea why it doesn't work
  it.skip('transfers names', async () => {
    const claim = await aens.aensQuery(name)
    const address = await aens.address()
    await claim.transfer(address)
    const aens2 = await BaseAe({keypair: accounts[0]})
    const claim2 = await aens2.aensQuery(name)
    return claim2.update(address).should.eventually.deep.include({
      pointers: R.fromPairs([['accountPubkey', address]])
    })
  })
})
