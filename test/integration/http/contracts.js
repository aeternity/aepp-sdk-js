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

const exampleContract = `
contract Identity =
  function main (x:int) = x
 `

describe ('Http service contracts', () => {
  let byteCode
  let createTx
  describe ('compile', () => {
    it ('should compile a ring contract', async () => {
      byteCode = await utils.httpProvider.contracts.compile(
        exampleContract,
        ''
      )
      assert.ok(byteCode)
      assert.isTrue(byteCode.startsWith('0x'))
    })
  })
  describe('call ring', () => {
    it('should return a value', async () => {
      let result = await utils.httpProvider.contracts.callStatic('ring', byteCode, 'main', '1')
      assert.equal(1, result)
    })
  })
  describe('encodeCallData ring', () => {
    it('should return an encoded string', async () => {
      let calldata = await utils.httpProvider.contracts.encodeCallData('ring', byteCode, 'main', ['1'])
      assert.isTrue(calldata.startsWith('0x'))
    })
  })
  describe('getCreateTx', () => {
    it('should create a tx', async function () {
      this.timeout(utils.TIMEOUT)

      // charge wallet first
      await utils.charge(utils.wallets[0].pub, 10)

      createTx = await utils.httpProvider.contracts.getCreateTx(byteCode, utils.wallets[0].pub)
      assert.ok(createTx)
      assert.isTrue(createTx.tx.startsWith('tx$'))
    })
  })
  describe('deployContract', () => {
    it('should deploy a contract', async function () {
      this.timeout(utils.TIMEOUT * 4)
      let params = {txTypes: 'aect_create_tx'}

      // charge wallet first
      await utils.charge(utils.wallets[0].pub, 10)

      const ret = await utils.httpProvider.contracts.deployContract(byteCode, utils.wallets[0])
      await utils.httpProvider.tx.waitForTransaction(ret['tx_hash'])
    })
  })
})
