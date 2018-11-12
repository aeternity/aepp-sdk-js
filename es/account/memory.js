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

const secrets = new WeakMap()

async function sign (data) {
  return Promise.resolve(Crypto.sign(data, secrets.get(this).secretKey))
}

async function address () {
  return Promise.resolve(secrets.get(this).publicKey)
}

/**
 * Select specific account
 * @instance
 * @rtype (keypair: {publicKey: String, secretKey: String}) => Void
 * @param {Object} keypair - Key pair to use
 * @param {String} keypair.publicKey - Public key
 * @param {String} keypair.secretKey - Private key
 * @return {Void}
 * @example setKeypair(keypair)
 */
function setKeypair (keypair) {
  if (keypair.hasOwnProperty('priv') && keypair.hasOwnProperty('pub')) {
    keypair = { secretKey: keypair.priv, publicKey: keypair.pub }
    console.warn('pub/priv naming for accounts has been deprecated, please use secretKey/publicKey')
  }
  secrets.set(this, {
    secretKey: Buffer.from(keypair.secretKey, 'hex'),
    publicKey: keypair.publicKey
  })
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
    try {
      this.setKeypair(keypair || Crypto.envKeypair(process.env))
    } catch (e) {
      // Instead of throw error and crash show warning that you do not set `KEYPAIR`
      // and can not sign transaction
      console.log('Please provide KEY_PAIR for sign transaction')
    }
  },
  methods: { sign, address, setKeypair }
})

export default MemoryAccount
