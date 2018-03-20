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

const utils = require ('../utils')

const chai = require ('chai')
const assert = chai.assert

const assertHasPointer = async (name, address, type = 'account') => {
  let nameData = await utils.httpProvider1.aens.getName(name)
  assert.ok(nameData)
  assert.equal(address, JSON.parse(nameData.pointers)[`${type}_pubkey`])
}

describe ('Http service aens', () => {
  describe ('two-step name claiming', () => {
    it ('should result in a claimed name', async function () {
      this.timeout(utils.TIMEOUT)
      let name = utils.randomAeName()
      let salt = 1234
      let commitment = await utils.httpProvider1.aens.getCommitmentHash (name, salt)
      assert.ok (commitment)
      // preclaim the domain
      let pleclaimHash = await utils.httpProvider1.aens.preClaim(commitment, 1, {privateKey: utils.privateKey})
      // wait one block
      await utils.httpProvider1.base.waitNBlocks(1)
      // claim the domain
      let nameHash = await utils.httpProvider1.aens.claim(name, salt, 1, {privateKey: utils.privateKey})

      await utils.httpProvider1.base.waitNBlocks(1)
      let nameData = await utils.httpProvider1.aens.getName(name)
      assert.ok(nameData)
      assert.equal(name, nameData['name'])
    })
  })
  describe('update', () => {
      it ('should update the pointer to a name', async function () {
        this.timeout (utils.TIMEOUT)
        let name = utils.randomAeName ()
        // use the two step aggregation method for convenience

        await utils.httpProvider1.aens.fullClaim (name, 1, 1, {privateKey: utils.privateKey})

        await utils.httpProvider1.base.waitNBlocks(1)
        let nameData = await utils.httpProvider1.aens.getName(name)
        let nameHash = nameData['name_hash']
        let account2 = await utils.httpProvider2.accounts.getPublicKey ()
        await utils.httpProvider1.aens.update (account2, nameHash, {privateKey: utils.privateKey})
        await utils.httpProvider1.base.waitNBlocks (1)
        nameData = await utils.httpProvider1.aens.getName (name)
        assert.equal (account2, JSON.parse (nameData.pointers)['account_pubkey'])
      })
    })
  describe('transfer', () => {
    it('should transfer the address', async function () {
      this.timeout(utils.TIMEOUT * 2)
      let name = utils.randomAeName()
      // use the two step aggregation method for convenience
      await utils.httpProvider1.aens.fullClaim(name, 1, 1, {privateKey: utils.privateKey})
      await utils.httpProvider1.base.waitNBlocks(1)
      let nameData = await utils.httpProvider1.aens.getName(name)
      let nameHash = nameData['name_hash']

      let account2 = await utils.httpProvider2.accounts.getPublicKey()

      await utils.httpProvider1.aens.update(account2, nameHash, {privateKey: utils.privateKey})
      await utils.httpProvider1.base.waitNBlocks(1)

      await assertHasPointer(name, account2)

      let account3 = await utils.httpProvider3.accounts.getPublicKey()
      await utils.httpProvider1.aens.transfer(nameHash, account3, 1, {privateKey: utils.privateKey})
      await utils.httpProvider1.base.waitNBlocks(1)

      // Now account3 can point to himself
      try {
        await utils.httpProvider1.base.spend(account3, 5, 1, {privateKey: utils.privateKey})
        await utils.httpProvider3.base.waitNBlocks(1)
        await utils.httpProvider3.aens.update(account3, nameHash, {privateKey: utils.privateKey})
        await utils.httpProvider3.base.waitNBlocks(1)

        await assertHasPointer(name, account3)

      } catch (e) {
        console.error(e)
      }
    })
  })
})
