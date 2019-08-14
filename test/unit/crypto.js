/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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

import '../'
import { describe, it } from 'mocha'
import { assert, expect } from 'chai'
import * as Crypto from '../../es/utils/crypto'

import { addressToHex, encodeBase58Check } from '../../es/utils/crypto'
import { buildTxHash, unpackTx } from '../../es/tx/builder'

// These keys are fixations for the encryption lifecycle tests and will
// not be used for signing
const privateKeyAsHex = '4d881dd1917036cc231f9881a0db978c8899dd76a817252418606b02bf6ab9d22378f892b7cc82c2d2739e994ec9953aa36461f1eb5a4a49a5b0de17b3d23ae8'
const privateKey = Buffer.from(privateKeyAsHex, 'hex')
const publicKeyWithPrefix = 'ak_Gd6iMVsoonGuTF8LeswwDDN2NF5wYHAoTRtzwdEcfS32LWoxm'
const publicKey = Buffer.from(Crypto.decodeBase58Check(publicKeyWithPrefix.split('_')[1]))

const txBinaryAsArray = [248, 76, 12, 1, 160, 35, 120, 248, 146, 183, 204, 130, 194, 210, 115, 158, 153, 78, 201, 149, 58, 163, 100, 97, 241, 235, 90, 74, 73, 165, 176, 222, 23, 179, 210, 58, 232, 160, 63, 40, 35, 12, 40, 65, 38, 215, 218, 236, 136, 133, 42, 120, 160, 179, 18, 191, 241, 162, 198, 203, 209, 173, 89, 136, 202, 211, 158, 59, 12, 122, 1, 1, 1, 132, 84, 101, 115, 116]
const txBinary = Buffer.from(txBinaryAsArray)
const signatureAsArray = [95, 146, 31, 37, 95, 194, 36, 76, 58, 49, 167, 156, 127, 131, 142, 248, 25, 121, 139, 109, 59, 243, 203, 205, 16, 172, 115, 143, 254, 236, 33, 4, 43, 46, 16, 190, 46, 46, 140, 166, 76, 39, 249, 54, 38, 27, 93, 159, 58, 148, 67, 198, 81, 206, 106, 237, 91, 131, 27, 14, 143, 178, 130, 2]
const signature = Buffer.from(signatureAsArray)

const txRaw = `tx_+QTlCwH4QrhA4xEWFIGZUVn0NhnYl9TwGX30YJ9/Y6x6LHU6ALfiupJPORvjbiUowrNgLtKnvt7CvtweY0N/THhwn8WUlPJfDrkEnPkEmSoBoQFj/aG9TnbDDSLtstOaR3E1i0Tcexu1UutStbkmXRBdzAG5A/j5A/VGAqAmKh8Xm79E6zTwogrUezzUmpJlC5Cdjc1KXtWLnJIrbvkC+/kBKqBo8mdjOP9QiDmrpHdJ7/qL6H7yhPIH+z2ZmHAc1TiHxYRtYWluuMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoP//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD5AcuguclW8osxSan1mHqlBfPaGyIJzFc5I0AGK7bBvZ+fmeqEaW5pdLhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////uQFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD//////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////+4zGIAAGRiAACEkYCAgFF/uclW8osxSan1mHqlBfPaGyIJzFc5I0AGK7bBvZ+fmeoUYgAAwFdQgFF/aPJnYzj/UIg5q6R3Se/6i+h+8oTyB/s9mZhwHNU4h8UUYgAAr1dQYAEZUQBbYAAZWWAgAZCBUmAgkANgA4FSkFlgAFFZUmAAUmAA81tgAIBSYADzW1lZYCABkIFSYCCQA2AAGVlgIAGQgVJgIJADYAOBUoFSkFZbYCABUVFZUICRUFCAkFCQVltQUIKRUFBiAACMVoUzLjIuMIMEAAGGWa0Z+ZAAAAQBgxgX+IQ7msoAuGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAILnJVvKLMUmp9Zh6pQXz2hsiCcxXOSNABiu2wb2fn5nqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB95HF6'`
const expectedHash = 'th_HZMNgTvEiyKeATpauJjjeWwZcyHapKG8bDgy2S1sCUEUQnbwK'

describe('crypto', () => {
  describe('generateKeyPair', () => {
    it('generates an account key pair', () => {
      const keyPair = Crypto.generateKeyPair()
      assert.ok(keyPair)
      assert.isTrue(keyPair.publicKey.startsWith('ak_'))
      assert.isAtLeast(keyPair.publicKey.length, 51)
      assert.isAtMost(keyPair.publicKey.length, 53)
    })
  })
  
  describe('isValidKeypair', () => {
    it('verify the generated key pair', () => {
      const keyPair = Crypto.generateKeyPair(true)
      assert.ok(keyPair)
      const verifyResult = Crypto.isValidKeypair(keyPair.secretKey, keyPair.publicKey)
      assert.isTrue(verifyResult)
    })
  })
  
  describe('encryptPassword', () => {
    describe('generate a password encrypted key pair', () => {
      const keyPair = Crypto.generateKeyPair(true)
      const password = 'verysecret'

      it('works for private keys', () => {
        const privateBinary = keyPair.secretKey
        const encryptedPrivate = Crypto.encryptPrivateKey(password, privateBinary)
        const decryptedPrivate = Crypto.decryptPrivateKey(password, encryptedPrivate)
        assert.deepEqual(decryptedPrivate, privateBinary)
      })
      it('works for public keys', () => {
        const publicBinary = keyPair.publicKey
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
    const messageSignatureAsHex = '20f779383f3ce0ab7781b7c8ff848e6d80f7f22d5cdc266763cd74d89c5ee0716758e75f56391711957f506d4993ae7dea62bec0f2806e6de66227f52836160a'
    const messageSignature = Buffer.from(messageSignatureAsHex, 'hex')

    const messageNonASCII = 'tæst'
    const messageNonASCIISignatureAsHex = '68d1344c46d9b2ef642490ffade3155c714471dd6d097fc393edc1004031a5492270de77ef8918df7857ea348d8ba4444ed1ff8e84f19e8e685e31174356fa06'
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

  it('hashing produces 256 bit blake2b byte buffers', () => {
    const hash = Crypto.hash('foobar')
    hash.should.be.a('Uint8Array')
    Buffer.from(hash).toString('hex').should.be.equal('93a0e84a8cdd4166267dbe1263e937f08087723ac24e7dcc35b3d5941775ef47')
  })

  it('salt produces random sequences every time', () => {
    const salt1 = Crypto.salt()
    const salt2 = Crypto.salt()
    salt1.should.be.a('Number')
    salt2.should.be.a('Number')
    salt1.should.not.be.equal(salt2)
  })
  it('Convert base58Check address to hex', () => {
    const address = 'ak_Gd6iMVsoonGuTF8LeswwDDN2NF5wYHAoTRtzwdEcfS32LWoxm'
    const hex = addressToHex(address)
    const fromHexAddress = 'ak_' + encodeBase58Check(Buffer.from(hex.slice(2), 'hex'))
    fromHexAddress.should.be.equal(address)
  })
  it('Can produce tx hash', () => {
    const rlpEncodedTx = unpackTx(txRaw).rlpEncoded
    buildTxHash(txRaw).should.be.equal(expectedHash)
    buildTxHash(rlpEncodedTx).should.be.equal(expectedHash)
  })
})
