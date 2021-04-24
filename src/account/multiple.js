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
 * AccountMultiple module
 * @module @aeternity/aepp-sdk/es/accounts/multiple
 * @export AccountMultiple
 */

import * as R from 'ramda'
import AsyncInit from '../utils/async-init'
import MemoryAccount from './memory'
import { assertedType } from '../utils/crypto'
import AccountBase, { isAccountBase } from './base'

/**
 * AccountMultiple stamp
 *
 * The purpose of this stamp is to wrap up implementations of
 * {@link module:@aeternity/aepp-sdk/es/account/base--AccountBase} objects and provide a
 * common interface to all of them. List are a substantial part of
 * {@link module:@aeternity/aepp-sdk/es/ae/wallet--Wallet}s.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Array} [options.accounts] - Accounts array
 * @param {String} [options.address] - Address of account to select
 * @return {Object} AccountMultiple instance
 * @example
 * const accounts = await AccountMultiple({ accounts: [ MemmoryAccount({ keypair: 'keypair_object' }) ] })
 * await accounts.addAccount(account, { select: true }) // Add account and make it selected
 * accounts.removeAccount(address) // Remove account
 * accounts.selectAccount(address) // Select account
 * accounts.addresses() // Get available accounts
 */
export default AccountBase.compose(AsyncInit, {
  async init ({ accounts = [], address }) {
    const { WALLET_PUB, WALLET_PRIV } = process?.env || {}
    if (WALLET_PUB && WALLET_PRIV) {
      accounts.push(MemoryAccount({
        keypair: { publicKey: WALLET_PUB, secretKey: WALLET_PRIV }
      }))
    }
    this.accounts = R.fromPairs(await Promise.all(accounts.map(async a => [await a.address(), a])))

    if (!address) address = Object.keys(this.accounts)[0]
    assertedType(address, 'ak')
    this.selectedAddress = address
  },
  props: {
    accounts: {}
  },
  deepProps: {
    selectedAddress: null
  },
  methods: {
    async address ({ onAccount = this.selectedAddress } = {}) {
      return this._resolveAccount(onAccount).address()
    },
    async sign (data, { onAccount = this.selectedAddress } = {}) {
      return this._resolveAccount(onAccount).sign(data)
    },
    /**
     * Get accounts addresses
     * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
     * @function
     * @rtype () => String[]
     * @return {String[]}
     * @example addresses()
     */
    addresses () {
      return Object.keys(this.accounts)
    },
    /**
     * Add specific account
     * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
     * @function
     * @category async
     * @rtype (account: Account, { select: Boolean }) => void
     * @param {Object} account - Account instance
     * @param {Object} [options={}] - Options
     * @param {Boolean} [options.select] - Select account
     * @return {void}
     * @example addAccount(account)
     */
    async addAccount (account, { select } = {}) {
      const address = await account.address()
      this.accounts[address] = account
      if (select) this.selectAccount(address)
    },
    /**
     * Remove specific account
     * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
     * @function
     * @rtype (address: String) => void
     * @param {String} address - Address of account to remove
     * @return {void}
     * @example removeAccount(address)
     */
    removeAccount (address) {
      if (!this.accounts[address]) {
        console.warn(`removeAccount: Account for ${address} not available`)
        return
      }
      delete this.accounts[address]
      if (this.selectedAddress === address) this.selectedAddress = null
    },
    /**
     * Select specific account
     * @alias module:@aeternity/aepp-sdk/es/account/selector
     * @instance
     * @rtype (address: String) => void
     * @param {String} address - Address of account to select
     * @example selectAccount('ak_xxxxxxxx')
     */
    selectAccount (address) {
      assertedType(address, 'ak')
      if (!this.accounts[address]) throw new Error(`Account for ${address} not available`)
      this.selectedAddress = address
    },
    /**
     * Resolves an account
     * @param account can be account address (should exist in sdk instance), MemoryAccount or keypair
     * @returns {AccountBase}
     * @private
     */
    _resolveAccount (account) {
      switch (typeof account) {
        case 'string':
          assertedType(account, 'ak')
          if (!this.accounts[account]) throw new Error(`Account for ${account} not available`)
          return this.accounts[account]
        case 'object':
          return isAccountBase(account) ? account : MemoryAccount({ keypair: account })
        default:
          throw new Error(`Unknown account type: ${typeof account} (account: ${account})`)
      }
    }
  }
})
