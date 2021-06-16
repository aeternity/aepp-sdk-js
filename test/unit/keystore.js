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
import { dump, recover, validateKeyObj } from '../../src/utils/keystore'

const invalidKeystore = {
  name: 'test',
  version: 1,
  public_key: 'ak_2wc5GeyFTxYEqusWH8UizUQDj6i53ow7fF9WXEPtYVvSHT45xd',
  id: 'ea6b7079-924e-456c-8100-6305e7235d65',
  crypto: {
    secret_type: 'ed25519',
    cipher_params: {
      nonce: 'fecd060551378963f5d4d1aa264b665225360775fcd5fa5a'
    },
    kdf: 'argon2id',
    kdf_params: {
      memlimit: 1024,
      opslimit: 3,
      salt: 'aa0885ba58e497ea83cd663d1dd4d002'
    }
  }
}

const password = 'test'
const publicKey = 'ak_2qXT3PtNQrfCg1zKd4Qagex1TYn5woks9YsnaoXtbqh9tSyHFM'
const secretKey = Buffer.from('35bdc4b31d75aebea2693760a2c96afe87d99dc571ddc4666db0ac8a2b59b30ef1e0c4e567f3d08eff8330c57d70ad457e9f31fa221e14fcc851273ec9af50ae', 'hex')
const secretKeyHex = secretKey.toString('hex')
const keystoreStatic = {
  name: 'test',
  version: 1,
  public_key: publicKey,
  id: '3459181e-f5ab-4506-acfa-cf7a2d41cdaf',
  crypto: {
    secret_type: 'ed25519',
    symmetric_alg: 'xsalsa20-poly1305',
    ciphertext: '78f77af6d1fe6cc9fad8813cd6309dbe7ac380137314c3b961bfa69fb67ccea259e5ef8b18b9014de79ebdae79b48e6b4564be1ce96e807c1458ea51d511d2d1764599338887e65987a160259eda69fb',
    cipher_params: { nonce: '0155ae65dcafdd1ec8bfd776ac351fe3da52767d3ddd9da8' },
    kdf: 'argon2id',
    kdf_params: {
      memlimit_kib: 65536,
      opslimit: 3,
      parallelism: 1,
      salt: 'ed7866c1f3bb16b077ad835b19eb510c'
    }
  }
}

const omitRandom = keystore => ({
  ...keystore,
  id: '<random>',
  crypto: {
    ...keystore.crypto,
    ciphertext: '<random>',
    cipher_params: {
      ...keystore.crypto.cipher_params,
      nonce: '<random>'
    },
    kdf_params: {
      ...keystore.crypto.kdf_params,
      salt: '<random>'
    }
  }
})

describe('Keystore', function () {
  this.timeout(300000)

  let keystoreBuffer
  let keystoreHex

  it('dump account to keystore object', async () => {
    keystoreBuffer = await dump('test', password, secretKey)
    keystoreHex = await dump('test', password, secretKeyHex)
    omitRandom(keystoreBuffer).should.be.eql(omitRandom(keystoreStatic))
    validateKeyObj(keystoreBuffer).should.be.equal(true)
    keystoreBuffer.public_key.should.be.equal(publicKey)
    omitRandom(keystoreHex).should.be.eql(omitRandom(keystoreStatic))
    validateKeyObj(keystoreHex).should.be.equal(true)
    keystoreHex.public_key.should.be.equal(publicKey)
  })

  it('restore account from keystore object', () => Promise.all(
    [keystoreBuffer, keystoreHex, keystoreStatic].map(async k => {
      const recSecretKey = await recover(password, k)
      recSecretKey.should.be.equal(secretKeyHex)
    })
  ))

  it('use invalid keystore json', async () => {
    try {
      await recover(password, invalidKeystore)
    } catch (e) {
      e.message.should.be.equal('Invalid key file format. Require properties: ciphertext,symmetric_alg')
    }
  })

  it('use invalid keystore password', async () => {
    try {
      await recover(password + 1, keystoreBuffer)
    } catch (e) {
      e.message.should.be.equal('Invalid password or nonce')
    }
  })
})
