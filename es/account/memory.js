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

/**
 * Memory Account module
 * @module @aeternity/aepp-sdk/es/account/memory
 * @export MemoryAccount
 * @example import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
 */

import Account from './'
import * as Crypto from '../utils/crypto'
import { isHex } from '../utils/string'
import { decode } from '../tx/builder/helpers'

const secrets = new WeakMap()

async function sign (data) {
  return Promise.resolve(Crypto.sign(data, secrets.get(this).secretKey))
}

async function address (format = Crypto.ADDRESS_FORMAT.api) {
  return Promise.resolve(Crypto.formatAddress(format, secrets.get(this).publicKey))
}

function setSecret (keyPair) {
  secrets.set(this, {
    secretKey: Buffer.isBuffer(keyPair.secretKey) ? keyPair.secretKey : Buffer.from(keyPair.secretKey, 'hex'),
    publicKey: keyPair.publicKey
  })
}

function validateKeyPair (keyPair) {
  if (!keyPair || typeof keyPair !== 'object') throw new Error('KeyPair must be an object')
  if (keyPair.pub && keyPair.priv) {
    keyPair = { publicKey: keyPair.pub, secretKey: keyPair.priv }
  }
  if (!keyPair.secretKey || !keyPair.publicKey) throw new Error('KeyPair must must have "secretKey", "publicKey" properties')
  if (typeof keyPair.publicKey !== 'string' || keyPair.publicKey.indexOf('ak_') === -1) throw new Error('Public Key must be a base58c string with "ak_" prefix')
  if (
    !Buffer.isBuffer(keyPair.secretKey) &&
    (typeof keyPair.secretKey === 'string' && !isHex(keyPair.secretKey))
  ) throw new Error('Secret key must be hex string or Buffer')

  const pubBuffer = Buffer.from(decode(keyPair.publicKey, 'ak'))
  if (!Crypto.isValidKeypair(Buffer.from(keyPair.secretKey, 'hex'), pubBuffer)) throw new Error('Invalid Key Pair')
}

/**
 * In-memory `Account` factory
 * @function
 * @alias module:@aeternity/aepp-sdk/es/account/memory
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} options.keypair - Key pair to use
 * @param {String} options.keypair.publicKey - Public key
 * @param {String} options.keypair.secretKey - Private key
 * @return {Account}
 */
const MemoryAccount = Account.compose({
  init ({ keypair }) {
    validateKeyPair(keypair)
    if (keypair.hasOwnProperty('priv') && keypair.hasOwnProperty('pub')) {
      keypair = { secretKey: keypair.priv, publicKey: keypair.pub }
      console.warn('pub/priv naming for accounts has been deprecated, please use secretKey/publicKey')
    }

    this.setSecret(keypair)
  },
  methods: { sign, address, setSecret }
})

export default MemoryAccount
