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
import { configure, plan, ready, BaseAe } from './'
import * as R from 'ramda'
import { generateKeyPair } from '../../es/utils/crypto'

function randomName () {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36) + '.test'
}

plan('10000000000000000')

describe('Aens', function () {
  configure(this)

  let aens
  const account = generateKeyPair()
  const name = randomName()
  const name2 = randomName()

  before(async function () {
    aens = await ready(this)
    await aens.spend('1000000000000000', account.publicKey)
  })

  describe('fails on', () => {
    const name = randomName()

    it('querying non-existent names', async () => {
      return aens.aensQuery(name).should.eventually.be.rejected
    })

    it('updating names not owned by the account', async () => {
      const preclaim = await aens.aensPreclaim(name)
      const claim = await preclaim.claim()
      const newAccount = generateKeyPair()

      const aens2 = await BaseAe()
      aens2.setKeypair(newAccount)
      return aens2.aensUpdate(claim.id, newAccount.publicKey, { blocks: 1 }).should.eventually.be.rejected
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
      pointers: [R.fromPairs([['key', 'account_pubkey'], ['id', address]])]
    })
  })

  it('transfers names', async () => {
    const claim = await aens.aensQuery(name)

    await claim.transfer(account.publicKey)

    const aens2 = await BaseAe()
    aens2.setKeypair(account)
    const claim2 = await aens2.aensQuery(name)

    return claim2.update(account.publicKey).should.eventually.deep.include({
      pointers: [R.fromPairs([['key', 'account_pubkey'], ['id', account.publicKey]])]
    })
  })

  it('revoke names', async () => {
    const aens2 = await BaseAe()
    aens2.setKeypair(account)

    const aensName = await aens2.aensQuery(name)

    await aensName.revoke()

    return aens2.aensQuery(name).should.be.rejectedWith(Error)
  })

  it('PreClaim name using specific account', async () => {
    const current = await aens.address()
    const onAccount = aens.addresses().find(acc => acc !== current)

    const preclaim = await aens.aensPreclaim(name, { onAccount })
    preclaim.should.be.an('object')
    preclaim.tx.accountId.should.be.equal(onAccount)
  })
})
