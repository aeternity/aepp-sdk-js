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

utils.plan(10)

describe('Http service base', () => {
  before(async function () {
    this.timeout(utils.TIMEOUT)
    await utils.waitReady(this)
  })

  let prevHash
  describe('getHeight', () => {
    it('should return an integer', async () => {
      let height = await utils.httpProvider.base.getHeight()
      assert(Number.isInteger(height))
    })
  })
  describe('getBlockByHeight', () => {
    it('should return a block', async function () {
      this.timeout(utils.TIMEOUT)
      let data = await utils.httpProvider.base.getBlockByHeight(2)
      prevHash = data.prevHash
      utils.assertIsBlock(data)
    })
  })
  describe('getBlockByHash', () => {
    it('should return a block', async () => {
      let data = await utils.httpProvider.base.getBlockByHash(prevHash)
      utils.assertIsBlock(data)
    })
  })
  describe('waitForNBlocks', () => {
    it('should at least wait for N blocks', async function () {
      this.timeout(utils.TIMEOUT * 4)
      let start = await utils.httpProvider.base.getHeight()
      let period = 2
      let finish = await utils.httpProvider.base.waitNBlocks(period)
      assert.ok(finish >= start + period)
    })
  })
  describe('waitForBlock', () => {
    it('should wait at least for that block', async function () {
      this.timeout(utils.TIMEOUT)
      let start = await utils.httpProvider.base.getHeight()
      let period = 2
      let finish = await utils.httpProvider.base.waitForBlock(start + period)
      assert.ok(finish >= start + period)
    })
  })
  describe('spend', () => {
    it('should increase the balance', async function () {
      this.timeout(utils.TIMEOUT * 2)

      const { pub: pub1 } = utils.wallets[0]
      const { pub: pub2 } = utils.wallets[1]

      // charge wallet first
      await utils.charge(pub2, 10)

      const balanceBefore = await utils.httpProvider.accounts.getBalance(pub2)

      const { txHash } = await utils.httpProvider.base.spend(pub2, 5, utils.wallets[0])
      await utils.httpProvider.tx.waitForTransaction(txHash)
      const balance = await utils.httpProvider.accounts.getBalance(pub2)
      assert.equal(balanceBefore + 5, balance)
    })
  })
  describe('getInfo', () => {
    // TODO re-enable once node with debug support exists, again
    it.skip('should return some info', async function () {
      let info = await utils.httpProvider.base.getInfo()
      assert.ok(info)
    })
  })
  describe('getVersion', () => {
    it('should return some info', async function () {
      let version = await utils.httpProvider.base.getVersion()
      assert.ok(version)
    })
  })
  describe('getPendingBlock', () => {
    it('should return a block or 404', async () => {
      try {
        let data = await utils.httpProvider.base.getPendingBlock()
        utils.assertIsBlock(data)
      } catch (e) {
        assert(404, e.response.status)
      }
    })
  })
  describe('getBalances', () => {
    // TODO re-enable once node with debug support exists, again
    it.skip('should return something', async () => {
      let data = await utils.httpProvider.base.getBalances()
      assert.ok(data)
    })
  })
})
