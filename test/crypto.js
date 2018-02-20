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



const chai = require ('chai')
const assert = chai.assert

const {
  generateKeyPair,
  encodeBase58,
  decodeBase58
} = require('../lib/utils/crypto')

describe('crypto', () => {
  describe('generateKeyPair', () => {
    it('generates an account key pair', () => {
      let keyPair = generateKeyPair()
      assert.ok(keyPair)
      assert.isTrue(keyPair.pub.startsWith('ak$'))
      assert.equal(97, keyPair.pub.length)
    })
  })
  describe('encodeBase', () => {
    it('can be encoded and decoded', () => {
      let encoded = encodeBase58('helloword010101023')
      let decoded = decodeBase58(encoded)
      assert.ok('helloworld', decoded)
    })
  })
})
