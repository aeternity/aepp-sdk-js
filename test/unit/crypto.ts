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

import '..'
import { describe, it } from 'mocha'
import { assert, expect } from 'chai'
import * as Crypto from '../../src/utils/crypto'
import { buildTxHash, unpackTx } from '../../src/tx/builder'
import { decode } from '../../src/tx/builder/helpers'
import { EncodedData } from '../../src/utils/encoder'

// These keys are fixations for the encryption lifecycle tests and will
// not be used for signing
const privateKeyAsHex = '4d881dd1917036cc231f9881a0db978c8899dd76a817252418606b02bf6ab9d22378f892b7cc82c2d2739e994ec9953aa36461f1eb5a4a49a5b0de17b3d23ae8'
const privateKey = Buffer.from(privateKeyAsHex, 'hex')
const publicKeyWithPrefix: EncodedData<'ak'> = 'ak_Gd6iMVsoonGuTF8LeswwDDN2NF5wYHAoTRtzwdEcfS32LWoxm'
const publicKey = decode(publicKeyWithPrefix)

const txBinaryAsArray = [
  248, 76, 12, 1, 160, 35, 120, 248, 146, 183, 204, 130, 194, 210, 115, 158, 153, 78, 201, 149, 58,
  163, 100, 97, 241, 235, 90, 74, 73, 165, 176, 222, 23, 179, 210, 58, 232, 160, 63, 40, 35, 12,
  40, 65, 38, 215, 218, 236, 136, 133, 42, 120, 160, 179, 18, 191, 241, 162, 198, 203, 209, 173,
  89, 136, 202, 211, 158, 59, 12, 122, 1, 1, 1, 132, 84, 101, 115, 116
]
const txBinary = Buffer.from(txBinaryAsArray)
const signatureAsArray = [
  95, 146, 31, 37, 95, 194, 36, 76, 58, 49, 167, 156, 127, 131, 142, 248, 25, 121, 139, 109, 59,
  243, 203, 205, 16, 172, 115, 143, 254, 236, 33, 4, 43, 46, 16, 190, 46, 46, 140, 166, 76, 39,
  249, 54, 38, 27, 93, 159, 58, 148, 67, 198, 81, 206, 106, 237, 91, 131, 27, 14, 143, 178, 130, 2
]
const signature = Buffer.from(signatureAsArray)

const txRaw = 'tx_+QTlCwH4QrhA4xEWFIGZUVn0NhnYl9TwGX30YJ9/Y6x6LHU6ALfiupJPORvjbiUowrNgLtKnvt7CvtweY0N/THhwn8WUlPJfDrkEnPkEmSoBoQFj/aG9TnbDDSLtstOaR3E1i0Tcexu1UutStbkmXRBdzAG5A/j5A/VGAqAmKh8Xm79E6zTwogrUezzUmpJlC5Cdjc1KXtWLnJIrbvkC+/kBKqBo8mdjOP9QiDmrpHdJ7/qL6H7yhPIH+z2ZmHAc1TiHxYRtYWluuMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoP//////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD5AcuguclW8osxSan1mHqlBfPaGyIJzFc5I0AGK7bBvZ+fmeqEaW5pdLhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////uQFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQD//////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////+4zGIAAGRiAACEkYCAgFF/uclW8osxSan1mHqlBfPaGyIJzFc5I0AGK7bBvZ+fmeoUYgAAwFdQgFF/aPJnYzj/UIg5q6R3Se/6i+h+8oTyB/s9mZhwHNU4h8UUYgAAr1dQYAEZUQBbYAAZWWAgAZCBUmAgkANgA4FSkFlgAFFZUmAAUmAA81tgAIBSYADzW1lZYCABkIFSYCCQA2AAGVlgIAGQgVJgIJADYAOBUoFSkFZbYCABUVFZUICRUFCAkFCQVltQUIKRUFBiAACMVoUzLjIuMIMEAAGGWa0Z+ZAAAAQBgxgX+IQ7msoAuGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAILnJVvKLMUmp9Zh6pQXz2hsiCcxXOSNABiu2wb2fn5nqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB95HF6\''
const expectedHash = 'th_HZMNgTvEiyKeATpauJjjeWwZcyHapKG8bDgy2S1sCUEUQnbwK'

describe('crypto', () => {
  describe('generateKeyPair', () => {
    it('generates an account key pair', () => {
      const keyPair = Crypto.generateKeyPair()
      assert.ok(keyPair)
      expect(keyPair.publicKey).to.satisfy((b: string) => b.startsWith('ak_'))
      assert.isAtLeast(keyPair.publicKey.length, 51)
      assert.isAtMost(keyPair.publicKey.length, 53)
    })
    it('Address from secret', () => {
      const { secretKey, publicKey } = Crypto.generateKeyPair()
      Crypto.getAddressFromPriv(secretKey).should.be.equal(publicKey)
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

  it('isAddressValid', () => {
    expect(Crypto.isAddressValid('test')).to.be.equal(false)
    expect(Crypto.isAddressValid('ak_11111111111111111111111111111111273Yts')).to.be.equal(true)
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

  describe('messages', () => {
    const message = 'test'
    const messageSignatureAsHex = 'c910daedceebb658f49ad862b2032e6b455143ebc1d698e9018ac4cf2d76f65fefda254893b0f56203b4cef1ff549f72ef155d58792fd52d0c1b6e210525e207'
    const messageSignature = Buffer.from(messageSignatureAsHex, 'hex')

    const messageNonASCII = 'tæst'
    const messageNonASCIISignatureAsHex = 'faa1bdb8a88c529be904036382705ed207bbdde00ece3bdb541f5986d57aebe7babe315a4d95f5882165c28bf41f6149430509ded1cc7dcd9b134e0e1d73cd0b'
    const messageNonASCIISignature = Buffer.from(messageNonASCIISignatureAsHex, 'hex')

    const longMessage = 'test'.repeat(256)
    const longMessageHash = Buffer.from('J9bibOHrlicf0tYQxe1lW69LdDAxETwPmrafKjjQwvs=', 'base64')

    it('calculates a hash of a long message', () =>
      expect(Crypto.messageToHash(longMessage)).to.eql(longMessageHash))

    describe('sign', () => {
      it('should produce correct signature of message', () => {
        const s = Crypto.signMessage(message, privateKey)
        expect(s).to.eql(messageSignature)
      })

      it('should produce correct signature of message with non-ASCII chars', () => {
        const s = Crypto.signMessage(messageNonASCII, privateKey)
        expect(s).to.eql(messageNonASCIISignature)
      })
    })

    describe('verify', () => {
      it('should verify message', () => {
        const result = Crypto.verifyMessage(message, messageSignature, publicKey)
        assert.isTrue(result)
      })

      it('should verify message with non-ASCII chars', () => {
        const result = Crypto.verifyMessage(messageNonASCII, messageNonASCIISignature, publicKey)
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
  it('Can produce tx hash', () => {
    const rlpEncodedTx = unpackTx(txRaw).rlpEncoded
    buildTxHash(txRaw).should.be.equal(expectedHash)
    buildTxHash(rlpEncodedTx).should.be.equal(expectedHash)
  })
})
