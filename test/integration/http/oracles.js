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

const chai = require('chai')
const assert = chai.assert
const utils = require('../../utils')

import Crypto from '../../../src/utils/crypto'
const { generateKeyPair } = Crypto

utils.plan(20)

describe('Oracles HTTP endpoint', () => {
  before(async function () {
    this.timeout(utils.TIMEOUT)
    await utils.waitReady()
  })

  const account = utils.wallets[0]
  const { pub } = account

  // We know for a fact, what the oracle id will be the same as the public
  // key but with a different prefix
  const oracleId = `ok$${pub.split('$')[1]}`

  describe('register oracle', () => {
    it('should register an oracle', async function () {
      this.timeout(utils.TIMEOUT * 2)

      const { tx_hash } = await utils.httpProvider.oracles.register(
        'unused query format',
        'unused response format',
        5,
        50,
        5,
        account
      )

      // Let the blockchain digest
      await utils.httpProvider.tx.waitForTransaction(tx_hash)

      let transactions = await utils.httpProvider.accounts.getTransactions(pub, {
        txTypes: ['oracle_register_tx'] // epoch/apps/aetx/src/aetx.erl:200
      })
      assert.isTrue(transactions.length > 0)
    })
  })

  describe('query an oracle', () => {
    it.skip('should query an oracle', async function () {
      this.timeout(utils.TIMEOUT * 2)

      let data = await utils.httpProvider.oracles.query(
        oracleId,
        5,
        10,
        10,
        5,
        'whats wrong?',
        account
      )

      assert.ok(data)
      await utils.httpProvider.tx.waitForTransaction(data['tx_hash'])
      let transactions = await utils.httpProvider.accounts.getTransactions(oracleId, {
        excludeTxTypes: ['coinbase_tx'],
        txTypes: ['oracle_query_tx'] // epoch/apps/aetx/src/aetx.erl:200
      })
      assert.isTrue(transactions.length > 0)

      // queryId = transactions[0]
    })
  })

  describe('respond an oracle', () => {
    it.skip('should respond to a query', async () => {
      // Before we are not able to receive a query this is senseless
    })
  })
})
