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

const utils = require('../utils')


describe ('Http service base', () => {
  let prevHash
  describe ('getHeight', () => {
    it ('should return an integer', async () => {
      let height = await utils.httpProvider1.base.getHeight ()
      assert (Number.isInteger (height))
    })
  })
  describe ('getBlockByHeight', () => {
    it ('should return a block', async () => {
      let data = await utils.httpProvider1.base.getBlockByHeight (2)
      prevHash = data['prev_hash']
      utils.assertIsBlock (data)
    })
  })
  describe ('getBlockByHash', () => {
    it ('should return a block', async () => {
      let data = await utils.httpProvider1.base.getBlockByHash (prevHash)
      utils.assertIsBlock (data)
    })
  })
  describe ('waitForNBlocks', () => {
    it ('should at least wait for N blocks', async function () {
      this.timeout (utils.TIMEOUT)
      let start = await utils.httpProvider1.base.getHeight ()
      let period = 2
      let finish = await utils.httpProvider1.base.waitNBlocks (period)
      assert.ok (finish >= start + period)
    })
  })
  describe ('waitForBlock', () => {
    it ('should wait at least for that block', async function () {
      this.timeout (utils.TIMEOUT)
      let start = await utils.httpProvider1.base.getHeight ()
      let period = 2
      let finish = await utils.httpProvider1.base.waitForBlock (start + period)
      assert.ok (finish >= start + period)
    })
  })
  describe ('spend', () => {
    it ('should increase the balance', async function () {
      this.timeout (utils.TIMEOUT)
      let balanceBefore
      try {
        balanceBefore = await utils.httpProvider2.accounts.getBalance ()
      } catch (e) {
        balanceBefore = 0
      }

      let pubKey2 = await utils.httpProvider2.accounts.getPublicKey ()
      let spent = await utils.httpProvider1.base.spend (pubKey2, 5, 1, {privateKey: utils.privateKey})
      assert.equal(5, spent)
      await utils.httpProvider1.base.waitNBlocks (1)
      let balance = await utils.httpProvider2.accounts.getBalance ()
      assert.equal(balanceBefore + 5, balance)
    })
  })
  describe ('getInfo', () => {
    it ('should return some info', async function () {
      let info = await utils.httpProvider1.base.getInfo ()
      assert.ok (info)
    })
  })
  describe ('getVersion', () => {
    it ('should return some info', async function () {
      let version = await utils.httpProvider1.base.getVersion ()
      assert.ok (version)
    })
  })
  describe ('getPendingBlock', () => {
    it ('should return a block or 404', async () => {
      try {
        let data = await utils.httpProvider1.base.getPendingBlock ()
        utils.assertIsBlock (data)
      } catch (e) {
        assert(404, e.response.status)
      }
    })
  })
  describe ('getGenesisBlock', () => {
    it ('should return a block', async () => {
      let data = await utils.httpProvider1.base.getGenesisBlock ()
      utils.assertIsBlock (data)
    })
  })
  describe ('getBlockByHash', () => {
    it ('should return a block', async () => {
      let data = await utils.httpProvider1.base.getBlockByHash (prevHash)
      utils.assertIsBlock (data)
    })
  })
  describe ('getBlockByHeight', () => {
    it ('should return a block', async () => {
      let data = await utils.httpProvider1.base.getBlockByHeight (1)
      utils.assertIsBlock (data)
    })
  })
  describe ('getBalances', () => {
    it ('should return something', async () => {
      let data = await utils.httpProvider1.base.getBalances ()
      assert.ok(data)
    })
  })
})
