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
 * Accounts module
 * @module @aeternity/aepp-sdk/es/accounts
 * @export Accounts
 * @example import Accounts from '@aeternity/aepp-sdk/es/accounts'
 */

import stampit from '@stamp/it'
import AsyncInit from './utils/async-init'
import * as R from 'ramda'
import * as Crypto from './utils/crypto'
import MemoryAccount from './account/memory'
import Selector from './account/selector'

async function signWith (address, data) {
  const account = this.accounts[address]

  if (account === undefined) {
    throw Error(`Account for ${address} not available`)
  }

  return account.sign(data)
}

async function addAccount (account, { select } = {}) {
  const address = await account.address()
  this.accounts[address] = account
  if (select) this.selectAccount(address)
}

/**
 * Select specific account
 * @alias module:@aeternity/aepp-sdk/es/account/memory
 * @function
 * @instance
 * @rtype (keypair: {publicKey: String, secretKey: String}) => Void
 * @param {Object} keypair - Key pair to use
 * @param {String} keypair.publicKey - Public key
 * @param {String} keypair.secretKey - Private key
 * @return {Void}
 * @example setKeypair(keypair)
 */
function setKeypair (keypair) {
  const acc = this.accounts[this.Selector.address]
  if (keypair.hasOwnProperty('priv') && keypair.hasOwnProperty('pub')) {
    keypair = { secretKey: keypair.priv, publicKey: keypair.pub }
    console.warn('pub/priv naming for accounts has been deprecated, please use secretKey/publicKey')
  }
  acc.setSecret(keypair)
  this.accounts[keypair.publicKey] = acc
  this.selectAccount(keypair.publicKey)
  delete this.accounts[this.Selector.address]
}

function removeAccount (address) {
  if (!this.accounts[address]) return false
  delete this.accounts[address]
  return false
}

/**
 * Accounts Stamp
 *
 * The purpose of the Accounts Stamp is to wrap up
 * {@link module:@aeternity/aepp-sdk/es/account--Account} objects and provide a
 * common interface to all of them. Accounts are a substantial part of
 * {@link module:@aeternity/aepp-sdk/es/ae/wallet--Wallet}s.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/accounts
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Accounts instance
 * @example Accounts()
 */
const Accounts = stampit(AsyncInit, Selector, {
  async init ({ accounts = [], keypair }) {
    this.accounts = R.fromPairs(await Promise.all(accounts.map(async a => [await a.address(), a])))
    keypair = keypair || Crypto.envKeypair(process.env, false)
    if (keypair) {
      await this.addAccount(await MemoryAccount({ keypair }), { select: !this.Selector.address })
    }
  },
  props: {
    accounts: {}
  },
  propertyDescriptors: {
    addresses: {
      enumerable: true,
      configurable: false,
      get () {
        return Object.keys(this.accounts)
      }
    }
  },
  methods: { signWith, addAccount, removeAccount, setKeypair }
})

/**
 * Sign data blob with specific key
 * @function signWith
 * @instance
 * @abstract
 * @category async
 * @rtype (address: String, data: String) => data: Promise[String], throws: Error
 * @param {String} address - Public key of account to sign with
 * @param {String} data - Data blob to sign
 * @return {String} Signed data blob
 */

/**
 * Obtain account addresses
 * @function addresses
 * @instance
 * @abstract
 * @category async
 * @rtype () => addresses: Promise[String[]]
 * @return {String[]} Available account addresses
 */

export default Accounts
