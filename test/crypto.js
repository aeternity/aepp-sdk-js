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
import { hex } from './utils'

// These keys are fixations for the encryption lifecycle tests and will
// not be used for signing
const privateKey = hex`4d881dd1917036cc231f9881a0db978c8899dd76a817252418606b02bf6ab9d22378f892b7cc82c2d2739e994ec9953aa36461f1eb5a4a49a5b0de17b3d23ae8`
const publicKeyWithPrefix = 'ak$Gd6iMVsoonGuTF8LeswwDDN2NF5wYHAoTRtzwdEcfS32LWoxm'
const publicKey = Buffer.from(Crypto.decodeBase58Check(publicKeyWithPrefix.split('$')[1]))

const txBinary = hex`f84c0c01a02378f892b7cc82c2d2739e994ec9953aa36461f1eb5a4a49a5b0de17b3d23ae8a03f28230c284126d7daec88852a78a0b312bff1a2c6cbd1ad5988cad39e3b0c7a0101018454657374`
const signature = hex`5f921f255fc2244c3a31a79c7f838ef819798b6d3bf3cbcd10ac738ffeec21042b2e10be2e2e8ca64c27f936261b5d9f3a9443c651ce6aed5b831b0e8fb28202`

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
    const messageSignature = hex`0d969f938571d1436106af659bc1893e7efeda685d7f096be39d0f2c68f712e4e9ba7551df31350a4a6d07943fbfc1cbe0acfe8271cd2dcdaac3274168e53901`

    const messageNonASCII = 'tæst'
    const messageNonASCIISignature = hex`0aad557b424b33f4a2e415339d7ee143dea1f00c4a7c6c8680e1f70ff21e42b17e0e3729420daaed962999e089a18d099d39dc4a5ab4598d2b062106b59f1d01`

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
    const testMnemonic = 'eye quarter chapter suit cruel scrub verify stuff volume control learn dust'
    const testPassword = 'test-password'
    const testSaveHDWallet = {
      chainCode: hex`dd5cb572e8bddab36882ebbf87854e3b66f565447f20cfac874a5d3d7dd6d0d5`,
      privateKey: hex`731b6d83ff699d992959cd7f728285e07456a3589c4f1aac774158a63d9181fe`
    }
    const testAccounts = [{
      publicKey: hex`f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037`,
      secretKey: hex`87abcb9c765f3259cf448542cae4c2e9bbff2ad2588693239fd7ca00b17fd463f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037`
    }, {
      publicKey: hex`1d7ce9bcf06e93c844c02489862b623c23b14a7364350a36336c87bc76b6650a`,
      secretKey: hex`e78fdb3c2600a0684906adfcb5fac33167576dcb099580bde000bc5a363c939c1d7ce9bcf06e93c844c02489862b623c23b14a7364350a36336c87bc76b6650a`
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
