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
import MemoryAccount from './account/memory'
import Selector from './account/selector'
import { envKeypair, generateKeyPair } from './utils/crypto'

/**
 * Select specific account
 * @deprecated
 * @alias module:@aeternity/aepp-sdk/es/accounts
 * @function
 * @rtype (keypair: {publicKey: String, secretKey: String}) => Void
 * @param {Object} keypair - Key pair to use
 * @param {String} keypair.publicKey - Public key
 * @param {String} keypair.secretKey - Private key
 * @return {Void}
 * @example setKeypair(keypair)
 */
function setKeypair (keypair) {
  const acc = this.accounts[this.Selector.address] || this._acc
  if (keypair.hasOwnProperty('priv') && keypair.hasOwnProperty('pub')) {
    keypair = { secretKey: keypair.priv, publicKey: keypair.pub }
    console.warn('pub/priv naming for accounts has been deprecated, please use secretKey/publicKey')
  }
  acc.setSecret(keypair)
  this.accounts[keypair.publicKey] = acc
  delete this.accounts[this.Selector.address]
  this.selectAccount(keypair.publicKey)
}

/**
 * Sign data blob with specific key
 * @alias module:@aeternity/aepp-sdk/es/accounts
 * @function
 * @category async
 * @rtype (address: String, data: String) => data: Promise[String], throws: Error
 * @param {String} address - Public key of account to sign with
 * @param {String} data - Data blob to sign
 * @return {String} Signed data blob
 */
async function signWith (address, data) {
  const account = this.accounts[address]

  if (account === undefined) {
    throw Error(`Account for ${address} not available`)
  }

  return account.sign(data)
}

/**
 * Add specific account
 * @alias module:@aeternity/aepp-sdk/es/accounts
 * @function
 * @category async
 * @rtype (account: Account, { select: Boolean }) => Void
 * @param {Object} account - Account instance
 * @param {Object} [options={}] - Options
 * @param {Boolean} [options.select] - Select account
 * @return {Void}
 * @example addAccount(account)
 */
async function addAccount (account, { select } = {}) {
  const address = await account.address()
  this.accounts[address] = account
  if (select) this.selectAccount(address)
}

/**
 * Remove specific account
 * @alias module:@aeternity/aepp-sdk/es/accounts
 * @function
 * @rtype (address: String) => Void
 * @param {String} address - Address of account to remove
 * @return {Void}
 * @example removeAccount(address)
 */
function removeAccount (address) {
  if (this.accounts[address]) delete this.accounts[address]
  if (this.Selector.address === address) this.Selector.address = undefined
}

/**
 * Get accounts addresses
 * @alias module:@aeternity/aepp-sdk/es/accounts
 * @function
 * @rtype () => String[]
 * @return {String[]}
 * @example addresses()
 */
function addresses () {
  return Object.keys(this.accounts)
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
 * @param {Array} [options.accounts] - Accounts array
 * @return {Object} Accounts instance
 * @example
 * const accounts = await Accounts({ accounts: [ MemmoryAccount({ keypair: 'keypair_object' }) ] })
 * await accounts.addAccount(account, { select: true }) // Add account and make it selected
 * accounts.removeAccount(address) // Remove account
 * accounts.selectAccount(address) // Select account
 * accounts.addresses() // Get available accounts
 */
const Accounts = stampit(AsyncInit, {
  async init ({ accounts = [], keypair }) { // Deprecated. TODO Remove `keypair` param
    this.accounts = R.fromPairs(await Promise.all(accounts.map(async a => [await a.address(), a])))
    keypair = keypair || envKeypair(process.env, true)
    if (keypair) {
      await this.addAccount(await MemoryAccount({ keypair }), { select: !this.Selector.address })
    }
    // @Todo Remove after removing depricated `setKeypair` fn.
    //  Prevent BREAKING CHANGES
    //  Pre-init memoryAccount object to prevent async operation in `setKeypair` function
    this._acc = await MemoryAccount({ keypair: generateKeyPair() })
  },
  props: {
    accounts: {}
  },
  methods: { signWith, addAccount, removeAccount, setKeypair, addresses }
}, Selector)

export default Accounts
