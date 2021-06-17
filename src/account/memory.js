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
 * @example import { MemoryAccount } from '@aeternity/aepp-sdk'
 */

import AccountBase from './base'
import { sign, isAddressValid, isValidKeypair } from '../utils/crypto'
import { isHex } from '../utils/string'
import { decode } from '../tx/builder/helpers'

const secrets = new WeakMap()

/**
 * In-memory account stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/account/memory
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} options.keypair - Key pair to use
 * @param {String} options.keypair.publicKey - Public key
 * @param {String} options.keypair.secretKey - Private key
 * @return {Account}
 */
export default AccountBase.compose({
  init ({ keypair, gaId }) {
    this.isGa = !!gaId
    if (gaId) {
      if (!isAddressValid(gaId)) throw new Error('Invalid GA address')
      secrets.set(this, { publicKey: gaId })
      return
    }

    if (!keypair || typeof keypair !== 'object') throw new Error('KeyPair must be an object')
    if (!keypair.secretKey || !keypair.publicKey) throw new Error('KeyPair must must have "secretKey", "publicKey" properties')
    if (typeof keypair.publicKey !== 'string' || keypair.publicKey.indexOf('ak_') === -1) throw new Error('Public Key must be a base58c string with "ak_" prefix')
    if (
      !Buffer.isBuffer(keypair.secretKey) &&
      (typeof keypair.secretKey === 'string' && !isHex(keypair.secretKey))
    ) throw new Error('Secret key must be hex string or Buffer')

    const pubBuffer = Buffer.from(decode(keypair.publicKey, 'ak'))
    if (!isValidKeypair(Buffer.from(keypair.secretKey, 'hex'), pubBuffer)) throw new Error('Invalid Key Pair')

    secrets.set(this, {
      secretKey: Buffer.isBuffer(keypair.secretKey) ? keypair.secretKey : Buffer.from(keypair.secretKey, 'hex'),
      publicKey: keypair.publicKey
    })
  },
  props: { isGa: false },
  methods: {
    sign (data) {
      if (this.isGa) throw new Error('You are trying to sign data using GA account without keypair')
      return Promise.resolve(sign(data, secrets.get(this).secretKey))
    },
    address () {
      return Promise.resolve(secrets.get(this).publicKey)
    }
  }
})
