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

import { describe, it } from 'mocha'
import { assert, expect } from 'chai'
import Crypto from '../src/utils/crypto'

// These keys are fixations for the encryption lifecycle tests and will
// not be used for signing
const privateKeyAsHex = '4d881dd1917036cc231f9881a0db978c8899dd76a817252418606b02bf6ab9d22378f892b7cc82c2d2739e994ec9953aa36461f1eb5a4a49a5b0de17b3d23ae8'
const privateKey = Buffer.from(privateKeyAsHex, 'hex')
const publicKeyWithPrefix = 'ak$Gd6iMVsoonGuTF8LeswwDDN2NF5wYHAoTRtzwdEcfS32LWoxm'
const publicKey = Buffer.from(Crypto.decodeBase58Check(publicKeyWithPrefix.split('$')[1]))

const txBinaryAsArray = [248, 76, 12, 1, 160, 35, 120, 248, 146, 183, 204, 130, 194, 210, 115, 158, 153, 78, 201, 149, 58, 163, 100, 97, 241, 235, 90, 74, 73, 165, 176, 222, 23, 179, 210, 58, 232, 160, 63, 40, 35, 12, 40, 65, 38, 215, 218, 236, 136, 133, 42, 120, 160, 179, 18, 191, 241, 162, 198, 203, 209, 173, 89, 136, 202, 211, 158, 59, 12, 122, 1, 1, 1, 132, 84, 101, 115, 116]
const txBinary = Buffer.from(txBinaryAsArray)
const signatureAsArray = [95, 146, 31, 37, 95, 194, 36, 76, 58, 49, 167, 156, 127, 131, 142, 248, 25, 121, 139, 109, 59, 243, 203, 205, 16, 172, 115, 143, 254, 236, 33, 4, 43, 46, 16, 190, 46, 46, 140, 166, 76, 39, 249, 54, 38, 27, 93, 159, 58, 148, 67, 198, 81, 206, 106, 237, 91, 131, 27, 14, 143, 178, 130, 2]
const signature = Buffer.from(signatureAsArray)

describe('crypto', () => {
  describe('generateKeyPair', () => {
    it('generates an account key pair', () => {
      const keyPair = Crypto.generateKeyPair()
      assert.ok(keyPair)
      assert.isTrue(keyPair.pub.startsWith('ak$'))
      assert.isAtLeast(keyPair.pub.length, 52)
      assert.isAtMost(keyPair.pub.length, 53)
    })
  })

  describe('encryptPassword', () => {
    describe('generate a password encrypted key pair', () => {
      const keyPair = Crypto.generateKeyPair(true)
      const password = 'verysecret'

      it('works for private keys', () => {
        const privateBinary = keyPair.priv

        const encryptedPrivate = Crypto.encryptPrivateKey(password, privateBinary)
        const decryptedPrivate = Crypto.decryptPrivateKey(password, encryptedPrivate)
        assert.deepEqual(decryptedPrivate, privateBinary)
      })
      it('works for public keys', () => {
        const publicBinary = keyPair.pub
        const encryptedPublic = Crypto.encryptPublicKey(password, publicBinary)
        const decryptedPublic = Crypto.decryptPubKey(password, encryptedPublic)
        assert.deepEqual(decryptedPublic, publicBinary)
      })
    })
  })

  describe('encodeBase', () => {
    it('can be encoded and decoded', () => {
      const input = 'helloword010101023'
      const inputBuffer = Buffer.from(input)
      const encoded = Crypto.encodeBase58Check(inputBuffer)
      const decoded = Crypto.decodeBase58Check(encoded)
      assert.equal(input, decoded)
    })
  })

  describe('sign', () => {
    it('should produce correct signature', () => {
      const s = Crypto.sign(txBinary, privateKey)
      expect(s).to.eql(signature)
    })
  })

  describe('verify', () => {
    it('should verify tx with correct signature', () => {
      const result = Crypto.verify(txBinary, signature, publicKey)
      assert.isTrue(result)
    })
  })

  describe('personal messages', () => {
    const message = 'test'
    const messageSignatureAsHex = '0d969f938571d1436106af659bc1893e7efeda685d7f096be39d0f2c68f712e4e9ba7551df31350a4a6d07943fbfc1cbe0acfe8271cd2dcdaac3274168e53901'
    const messageSignature = Buffer.from(messageSignatureAsHex, 'hex')

    const messageNonASCII = 'tæst'
    const messageNonASCIISignatureAsHex = '0aad557b424b33f4a2e415339d7ee143dea1f00c4a7c6c8680e1f70ff21e42b17e0e3729420daaed962999e089a18d099d39dc4a5ab4598d2b062106b59f1d01'
    const messageNonASCIISignature = Buffer.from(messageNonASCIISignatureAsHex, 'hex')

    describe('sign', () => {
      it('should produce correct signature of message', () => {
        const s = Crypto.signPersonalMessage(message, privateKey)
        expect(s).to.eql(messageSignature)
      })

      it('should produce correct signature of message with non-ASCII chars', () => {
        const s = Crypto.signPersonalMessage(messageNonASCII, privateKey)
        expect(s).to.eql(messageNonASCIISignature)
      })
    })

    describe('verify', () => {
      it('should verify message', () => {
        const result = Crypto.verifyPersonalMessage(message, messageSignature, publicKey)
        assert.isTrue(result)
      })

      it('should verify message with non-ASCII chars', () => {
        const result = Crypto.verifyPersonalMessage(messageNonASCII, messageNonASCIISignature, publicKey)
        assert.isTrue(result)
      })
    })
  })

  describe('hd wallet', () => {
    const h = ([hexString]) => Buffer.from(hexString, 'hex')
    const testMnemonic = 'eye quarter chapter suit cruel scrub verify stuff volume control learn dust'
    const testPassword = 'test-password'
    const testSaveHDWallet = {
      chainCode: h`dd5cb572e8bddab36882ebbf87854e3b66f565447f20cfac874a5d3d7dd6d0d5`,
      privateKey: h`731b6d83ff699d992959cd7f728285e07456a3589c4f1aac774158a63d9181fe`
    }
    const testAccounts = [{
      publicKey: h`f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037`,
      secretKey: h`87abcb9c765f3259cf448542cae4c2e9bbff2ad2588693239fd7ca00b17fd463f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037`
    }, {
      publicKey: h`1d7ce9bcf06e93c844c02489862b623c23b14a7364350a36336c87bc76b6650a`,
      secretKey: h`e78fdb3c2600a0684906adfcb5fac33167576dcb099580bde000bc5a363c939c1d7ce9bcf06e93c844c02489862b623c23b14a7364350a36336c87bc76b6650a`
    }]

    describe('generateSaveHDWallet', () =>
      it('generates encrypted extended wallet key', () => {
        const saveHDWallet = Crypto.generateSaveHDWallet(testMnemonic, testPassword)
        expect(saveHDWallet).to.eql(testSaveHDWallet)
      }))

    describe('getSaveHDWalletAccounts', () =>
      it('generates array of accounts', () => {
        const accounts = Crypto.getSaveHDWalletAccounts(testSaveHDWallet, testPassword, 2)
        expect(accounts).to.eql(testAccounts)
      }))
  })
})
