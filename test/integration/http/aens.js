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

describe('Http service aens', function () {
  this.timeout(120000)

  before(async () => {
    await utils.httpProvider.provider.ready
  })

  describe('two-step name claiming', () => {
    it('should result in a claimed name', async function () {
      this.timeout(utils.TIMEOUT * 4)
      let name = utils.randomAeName()
      let salt = 1234
      let commitment = await utils.httpProvider.aens.getCommitmentHash(name, salt)
      const account = utils.wallets[0]
      assert.ok(commitment)
      // charge wallet first
      await utils.charge(account.pub, 10)
      // preclaim the domain
      let preclaimData = await utils.httpProvider.aens.preClaim(commitment, 1, account)
      // wait one block
      await utils.httpProvider.tx.waitForTransaction(preclaimData['tx_hash'])
      // claim the domain
      let claimData = await utils.httpProvider.aens.claim(name, salt, 1, account)

      await utils.httpProvider.tx.waitForTransaction(claimData['tx_hash'])
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

      // charge wallet first
      await utils.charge(utils.wallets[0].pub, 10)

      let claimData = await utils.httpProvider.aens.fullClaim(name, 1, 1, account)

      await utils.httpProvider.tx.waitForTransaction(claimData['tx_hash'])
      let nameData = await utils.httpProvider.aens.getName(name)
      let nameHash = nameData['name_hash']
      let { pub } = utils.wallets[1]
      let updateData = await utils.httpProvider.aens.update(pub, nameHash, account)
      await utils.httpProvider.tx.waitForTransaction(updateData['tx_hash'])
      nameData = await utils.httpProvider.aens.getName(name)
      assert.equal(pub, JSON.parse(nameData.pointers)['account_pubkey'])
    })
  })
  describe('transfer', () => {
    it.skip('should transfer the address', async function () {
      this.timeout(utils.TIMEOUT * 4)
      let name = utils.randomAeName()
      // use the two step aggregation method for convenience
      const account = utils.wallets[0]
      let fullClaimData = await utils.httpProvider.aens.fullClaim(name, 1, 1, account)
      await utils.httpProvider.tx.waitForTransaction(fullClaimData['tx_hash'])
      let nameData = await utils.httpProvider.aens.getName(name)
      let nameHash = nameData['name_hash']

      let account2 = utils.wallets[1].pub

      let updateData = await utils.httpProvider.aens.update(account2, nameHash, account)
      await utils.httpProvider.tx.waitForTransaction(updateData['tx_hash'])

      await assertHasPointer(name, account2)

      let account3 = utils.wallets[2].pub
      let transferData = await utils.httpProvider.aens.transfer(nameHash, account3, account)
      await utils.httpProvider.tx.waitForTransaction(transferData['tx_hash'])

      // Now account3 can point to himself
      try {
        let spendData = await utils.httpProvider.base.spend(account3, 5, 1, account)
        await utils.httpProvider.tx.waitForTransaction(spendData['tx_hash'])
        let updateData = await utils.httpProvider.aens.update(account3, nameHash, account)
        await utils.httpProvider.tx.waitForTransaction(updateData['tx_hash'])

        await assertHasPointer(name, account3)
      } catch (e) {
        console.error(e)
      }
    })
  })
})
