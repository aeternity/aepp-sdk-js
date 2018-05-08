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

require('@babel/polyfill')

const chai = require('chai')
const assert = chai.assert
const utils = require('../../utils')

describe('Http service transactions', () => {
  before(async () => {
    await utils.httpProvider.provider.ready
  })

  describe('transaction detail', () => {
    it('should return transaction details', async function () {
      this.timeout(utils.TIMEOUT)
      const { pub: pub1, priv } = utils.wallets[0]
      const { pub: pub2 } = utils.wallets[1]
      // charge wallet first
      await utils.charge(pub1, 20)
      let txData = await utils.httpProvider.base.getSpendTx(pub2, 10, pub1)
      await utils.httpProvider.tx.sendSigned(txData.tx, priv)
      const height = await utils.httpProvider.tx.waitForTransaction(txData['tx_hash'])
      assert.notEqual(-1, height)
    })
  })
})
