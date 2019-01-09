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
import { expect } from 'chai'
import { dump, recover, getAddressFromPriv, validateKeyObj } from '../../es/utils/keystore'
import { generateKeyPair } from '../../es/utils/crypto'

const invalidKeystore = {
  'name': 'test',
  'version': 1,
  'public_key': 'ak_2wc5GeyFTxYEqusWH8UizUQDj6i53ow7fF9WXEPtYVvSHT45xd',
  'id': 'ea6b7079-924e-456c-8100-6305e7235d65',
  'crypto': {
    'secret_type': 'ed25519',
    'cipher_params': {
      'nonce': 'fecd060551378963f5d4d1aa264b665225360775fcd5fa5a'
    },
    'kdf': 'argon2id',
    'kdf_params': {
      'memlimit': 1024,
      'opslimit': 3,
      'salt': 'aa0885ba58e497ea83cd663d1dd4d002'
    }
  }
}

const password = 'test'
describe('Keystore', function () {
  this.timeout(18000000)

  const { secretKey } = generateKeyPair(true)
  const publicKey = getAddressFromPriv(secretKey)
  let keystore

  it('dump account to keystore object', async () => {
    keystore = await dump('test', password, secretKey)
    validateKeyObj(keystore).should.be.equal(true)
  })

  it('restore account from keystore object', async () => {
    const priv = await recover(password, keystore)
    const accAddress = getAddressFromPriv(priv)

    secretKey.toString('hex').should.be.equal(priv)
    publicKey.should.be.equal(accAddress)
  })

  it('use invalid keystore json', async () => {
    try {
      await await recover(password, invalidKeystore)
    } catch (e) {
      e.message.should.be.equal('Invalid key file format. Require properties: ciphertext,symmetric_alg')
    }
  })

  it('use invalid keystore password', async () => {
    try {
      await await recover(password + 1, keystore)
    } catch (e) {
      e.message.should.be.equal('Invalid password or nonce')
    }
  })
})
