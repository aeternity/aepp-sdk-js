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

import { assert } from 'chai'
import Crypto from '../src/utils/crypto'

// These keys are fixations for the encryption lifecycle tests and will
// not be used for signing
const privateKeyAsHex = '4d881dd1917036cc231f9881a0db978c8899dd76a817252418606b02bf6ab9d22378f892b7cc82c2d2739e994ec9953aa36461f1eb5a4a49a5b0de17b3d23ae8'
const publicKey = 'ak$Gd6iMVsoonGuTF8LeswwDDN2NF5wYHAoTRtzwdEcfS32LWoxm'

const validUnsignedTx = 'tx$2uE4tuGbXmmXCAxBgykHq8JwrHf38xXtBE8NaUhjahLUaAdquBsspqpGmyEC9QE9gv5Zu4oTMcvoxCiKLDzipkUqBWCVB9Liuk73fqANjiAEtjUv2PsRC7hrRG4qjB6m1d4UVyrag815kodXygDUCaNXgfeqjGbffJy7sBwGd6cruDqYRLxpALxaCZEdY14T3DTvxWDnXGM2pR3Z4o9HujQY9PbDrk8XuuG9gKYFMmxvSRPje34ZXRxkeXicmGfn9TF63PYQhM4EjvAZXsfL2ZdAB8zCQpCVGwFWmuTxSL9yDoZmCwK9gP7g7G2AnsrJZjdv2UZKY6rrHwZLEgpdkADfKvHT9cjvuXcQfBfFRW17PP3fmiPpXaG4BpaiTuf4Cj79egcx2Wo6gB9rBqKndSQeCvUb8a25D2XoR7yyVjF6to2hPnw'
const txBinary = [248, 76, 12, 1, 160, 35, 120, 248, 146, 183, 204, 130, 194, 210, 115, 158, 153, 78, 201, 149, 58, 163, 100, 97, 241, 235, 90, 74, 73, 165, 176, 222, 23, 179, 210, 58, 232, 160, 63, 40, 35, 12, 40, 65, 38, 215, 218, 236, 136, 133, 42, 120, 160, 179, 18, 191, 241, 162, 198, 203, 209, 173, 89, 136, 202, 211, 158, 59, 12, 122, 1, 1, 1, 132, 84, 101, 115, 116]
const signature = [95, 146, 31, 37, 95, 194, 36, 76, 58, 49, 167, 156, 127, 131, 142, 248, 25, 121, 139, 109, 59, 243, 203, 205, 16, 172, 115, 143, 254, 236, 33, 4, 43, 46, 16, 190, 46, 46, 140, 166, 76, 39, 249, 54, 38, 27, 93, 159, 58, 148, 67, 198, 81, 206, 106, 237, 91, 131, 27, 14, 143, 178, 130, 2]

describe('crypto', () => {
  describe('generateKeyPair', () => {
    it('generates an account key pair', () => {
      let keyPair = Crypto.generateKeyPair()
      assert.ok(keyPair)
      assert.isTrue(keyPair.pub.startsWith('ak$'))
      assert.isAtLeast(keyPair.pub.length, 52)
      assert.isAtMost(keyPair.pub.length, 53)
    })
  })
  describe('encryptPassword', () => {
    describe('generate a password encrypted key pair', () => {
      let keyPair = Crypto.generateKeyPair(true)
      let password = 'verysecret'

      it('works for private keys', () => {
        let privateBinary = keyPair.priv

        let encryptedPrivate = Crypto.encryptPrivateKey(password, privateBinary)
        let decryptedPrivate = Crypto.decryptPrivateKey(password, encryptedPrivate)
        assert.equal(
          Buffer.from(decryptedPrivate).toString('hex'),
          Buffer.from(privateBinary).toString('hex')
        )
      })
      it('works for public keys', () => {
        let publicBinary = keyPair.pub
        let encryptedPublic = Crypto.encryptPublicKey(password, publicBinary)
        let decryptedPublic = Crypto.decryptPubKey(password, encryptedPublic)
        assert.equal(
          Buffer.from(decryptedPublic).toString('hex'),
          Buffer.from(publicBinary).toString('hex')
        )
      })
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
      let verified = Crypto.verify(validUnsignedTx, signature, pub)
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
