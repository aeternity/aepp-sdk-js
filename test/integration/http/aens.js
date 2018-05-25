/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

const utils = require('../../utils')

const chai = require('chai')
const assert = chai.assert

const assertHasPointer = async (name, address, type = 'account') => {
  let nameData = await utils.httpProvider.aens.getName(name)
  assert.ok(nameData)
  assert.equal(address, JSON.parse(nameData.pointers)[`${type}_pubkey`])
}

utils.plan(20)

describe('Http service aens', function () {
  before(async function () {
    this.timeout(utils.TIMEOUT)
    await utils.waitReady(this)
  })

  describe('two-step name claiming', () => {
    it('should result in a claimed name', async function () {
      this.timeout(utils.TIMEOUT * 4)
      let name = utils.randomAeName()
      let salt = 1234
      let commitment = await utils.httpProvider.aens.getCommitmentHash(name, salt)
      const account = utils.wallets[0]
      assert.ok(commitment)
      // preclaim the domain
      let preclaim = await utils.httpProvider.aens.preClaim(commitment, 1, account)
      await preclaim.wait()
      // claim the domain
      let claimData = await utils.httpProvider.aens.claim(name, salt, 1, account)

      await utils.httpProvider.tx.waitForTransaction(claimData.txHash)
      let nameData = await utils.httpProvider.aens.getName(name)
      assert.ok(nameData)
      assert.equal(name, nameData['name'])
    })
  })
  describe('update', () => {
    it('should update the pointer to a name', async function () {
      this.timeout(utils.TIMEOUT * 4)
      let name = utils.randomAeName()
      const account = utils.wallets[0]
      // use the two step aggregation method for convenience

      let claim = await utils.httpProvider.aens.fullClaim(name, 1, 1, account)
      await claim.wait()

      const { nameHash } = await utils.httpProvider.aens.getName(name)
      let { pub } = utils.wallets[1]
      const update = await utils.httpProvider.aens.update(pub, nameHash, account)
      await update.wait()
      const { pointers } = await utils.httpProvider.aens.getName(name)
      assert.equal(JSON.parse(pointers).accountPubkey, pub)
    })
  })
  describe('transfer', () => {
    it.skip('should transfer the address', async function () {
      this.timeout(utils.TIMEOUT * 4)
      let name = utils.randomAeName()
      // use the two step aggregation method for convenience
      const account = utils.wallets[0]
      let fullClaim = await utils.httpProvider.aens.fullClaim(name, 1, 1, account)
      await fullClaim.wait()

      const { nameHash } = await utils.httpProvider.aens.getName(name)

      let account2 = utils.wallets[1].pub

      let update = await utils.httpProvider.aens.update(account2, nameHash, account)
      await update.wait()

      await assertHasPointer(name, account2)

      let account3 = utils.wallets[2].pub

      const transfer = await utils.httpProvider.aens.transfer(nameHash, account3, account)
      await transfer.wait()

      // Now account3 can point to himself
      try {
        const spend = await utils.httpProvider.base.spend(account3, 5, account)
        await spend.wait()
        const update = await utils.httpProvider.aens.update(account3, nameHash, account)
        await update.wait()

        await assertHasPointer(name, account3)
      } catch (e) {
        console.error(e)
      }
    })
  })
})
