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


require ('@babel/polyfill')

const AeternityClient = require('../../../lib/aepp-sdk')
const WebsocketProvider = require('../../../lib/providers/ws/index')
const {AeSubscription} = require('../../../lib/providers/ws/subscriptions')
const {actions, origins} = require('../../../lib/providers/ws/types')


const chai = require ('chai')
const assert = chai.assert
const utils = require ('../../utils')


describe ('Oracles HTTP endpoint', () => {
  let publicKey
  let oracleId

  describe ('register oracle', () => {
    it ('should register an oracle', async function () {
      this.timeout(utils.TIMEOUT)
      let oracles = await utils.httpProvider.oracles.register (
        'unused query format',
        'unused response format',
        5,
        50,
        5,
        utils.privateKey
      )
      // Let the blockchain digest
      await utils.httpProvider.base.waitNBlocks(1)

      // We know for a fact, what the oracle id will be the same as the public
      // key but with a different prefix
      publicKey = utils.wallets[0].pub
      oracleId = `ok$${publicKey.split('$')[1]}`
      assert.ok(oracles)

      let transactions = await utils.httpProvider.accounts.getTransactions(
        {txTypes: ['aeo_register_tx']}
      )
      assert.isTrue(transactions.length > 0)
    })

  })
  describe('query an oracle', () => {
    it('should query an oracle', async function () {
      this.timeout(utils.TIMEOUT)
      let publicKey2 = utils.wallets[1].pub
      await utils.httpProvider.base.spend(publicKey2, 100, 5)
      await utils.httpProvider.base.waitNBlocks(1)
      let data = await utils.httpProvider.oracles.query(
        oracleId,
        5,
        10,
        10,
        5,
        "whats wrong?",
        utils.privateKey
      )
      assert.ok(data)
      await utils.httpProvider.base.waitNBlocks(1)
      let transactions = await utils.httpProvider.accounts.getTransactions(
        {
          excludeTxTypes: ['aec_coinbase_tx'],
          txTypes: ['aeo_query_tx']
        }
      )
      assert.isTrue(transactions.length > 0)

      queryId = transactions[0]
    })
  })
  describe('respond an oracle', () => {
    it.skip('should respond to a query', async () => {
      // Before we are not able to receive a query this is senseless
    })
  })
})
