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

const chai = require ('chai')
const assert = chai.assert

const utils = require('../../utils')


describe('Http accounts service', () => {
  describe('getTransactions', () => {
    // TODO Should work after porting the endpoint to the external route
    it.skip('should return something', async () => {
      let transactions = await utils.httpProvider.accounts.getTransactions(utils.wallets[0].pub)
      assert.ok(transactions)
      assert.isTrue(Array.isArray(transactions))
      assert.ok(transactions.length)
    })
  })
})
