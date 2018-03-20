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


const fs = require('fs')

const chai = require ('chai')
const assert = chai.assert

const Crypto = require('../lib/utils/crypto')

const privateKeyAsHex = '56b61283ec0ea87f891347f95895f9e1f339cd8854d649043c9b32b908cda646'
const publicKey = 'ak$3iDEWVFVERNggenRRyREbQWWoE1QiWaqXnEtknkP8noSiAPboe5ikkEtwgYDJ9SsBqjUnxUBpRtj1J9PnTTUji22UGybzW'

const validUnsignedTx = 'tx$2uE4tuGbXmmXCAxBgykHq8JwrHf38xXtBE8NaUhjahLUaAdquBsspqpGmyEC9QE9gv5Zu4oTMcvoxCiKLDzipkUqBWCVB9Liuk73fqANjiAEtjUv2PsRC7hrRG4qjB6m1d4UVyrag815kodXygDUCaNXgfeqjGbffJy7sBwGd6cruDqYRLxpALxaCZEdY14T3DTvxWDnXGM2pR3Z4o9HujQY9PbDrk8XuuG9gKYFMmxvSRPje34ZXRxkeXicmGfn9TF63PYQhM4EjvAZXsfL2ZdAB8zCQpCVGwFWmuTxSL9yDoZmCwK9gP7g7G2AnsrJZjdv2UZKY6rrHwZLEgpdkADfKvHT9cjvuXcQfBfFRW17PP3fmiPpXaG4BpaiTuf4Cj79egcx2Wo6gB9rBqKndSQeCvUb8a25D2XoR7yyVjF6to2hPnw'
const txBinary = [156,129,196,4,116,121,112,101,196,14,97,101,99,116,95,99,114,101,97,116,101,95,116,120,129,196,3,118,115,110,1,129,196,5,111,119,110,101,114,196,65,4,177,168,30,198,176,42,228,118,211,232,158,166,211,212,172,215,6,45,130,220,8,153,5,158,199,177,129,214,56,60,181,186,82,210,139,232,127,11,228,166,244,251,28,117,89,185,165,142,194,161,53,0,48,78,129,252,124,206,44,12,240,247,182,9,129,196,5,110,111,110,99,101,26,129,196,4,99,111,100,101,196,113,54,96,0,128,55,98,0,0,33,96,0,128,128,128,81,128,81,96,4,20,98,0,0,48,87,80,91,80,96,1,25,81,0,91,96,0,82,96,32,96,0,243,91,128,144,80,144,86,91,96,32,1,81,127,109,97,105,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,98,0,0,97,87,98,0,0,26,86,91,96,32,1,81,144,80,128,145,80,80,98,0,0,42,86,129,196,10,118,109,95,118,101,114,115,105,111,110,1,129,196,3,102,101,101,10,129,196,7,100,101,112,111,115,105,116,4,129,196,6,97,109,111,117,110,116,4,129,196,3,103,97,115,4,129,196,9,103,97,115,95,112,114,105,99,101,1,129,196,9,99,97,108,108,95,100,97,116,97,196,0]
const signature = [48,69,2,33,0,238,198,111,188,121,207,4,134,245,53,62,75,65,236,78,48,94,122,0,198,136,201,60,240,88,55,172,95,118,148,168,127,2,32,19,65,168,2,104,134,195,121,28,253,186,139,84,191,0,80,49,121,233,58,20,197,237,2,215,58,40,27,192,99,91,211]


describe('crypto', () => {
  describe('generateKeyPair', () => {
    it('generates an account key pair', () => {
      let keyPair = Crypto.generateKeyPair()
      assert.ok(keyPair)
      assert.isTrue(keyPair.pub.startsWith('ak$'))
      assert.equal(97, keyPair.pub.length)
    })
  })
  describe('encodeBase', () => {
    it('can be encoded and decoded', () => {
      let input = 'helloword010101023'
      let inputBuffer = Buffer.from(input)
      let encoded = Crypto.encodeBase58Check(inputBuffer)
      let decoded = Crypto.decodeBase58Check(encoded)
      assert.equal(input, decoded)
    })
  })
  describe('sign and verify', () => {
    it('should work together', async () => {
      let privateKey = Buffer.from(privateKeyAsHex, 'hex')
      let signature = Crypto.sign(validUnsignedTx, privateKey)
      let pub = Buffer.from(Crypto.decodeBase58Check(publicKey.split('$')[1]))
      let verified = Crypto.verify(Buffer.from(validUnsignedTx), signature, pub)
      assert.isTrue(verified)
    })
  })
  describe('verify', () => {
    it('should verify tx with correct signature', async () => {
      let pub = Buffer.from(Crypto.decodeBase58Check(publicKey.split('$')[1]))
      let result = Crypto.verify(Buffer.from(txBinary), Buffer.from(signature), pub)
      assert.isTrue(result)
    })
  })
})
