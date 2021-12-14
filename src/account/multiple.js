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

import AsyncInit from '../utils/async-init'
import MemoryAccount from './memory'
import { decode } from '../tx/builder/helpers'
import AccountBase, { isAccountBase } from './base'
import {
  UnavailableAccountError,
  TypeError
} from '../utils/errors'

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
 * const accounts = await AccountMultiple({
 *   accounts: [MemoryAccount({ keypair: 'keypair_object' })]
 * })
 * await accounts.addAccount(account, { select: true }) // Add account and make it selected
 * accounts.removeAccount(address) // Remove account
 * accounts.selectAccount(address) // Select account
 * accounts.addresses() // Get available accounts
 */
export default AccountBase.compose(AsyncInit, {
  async init ({ accounts = [], address }) {
    this.accounts = Object.fromEntries(await Promise.all(
      accounts.map(async a => [await a.address(), a])
    ))
    address = address || Object.keys(this.accounts)[0]
    if (address) this.selectAccount(address)
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
      decode(address, 'ak')
      if (!this.accounts[address]) throw new UnavailableAccountError(address)
      this.selectedAddress = address
    },
    /**
     * Resolves an account
     * @param account account address (should exist in sdk instance), MemoryAccount or keypair
     * @returns {AccountBase}
     * @private
     */
    _resolveAccount (account) {
      if (account === null) {
        throw new TypeError(
          'Account should be an address (ak-prefixed string), ' +
          'keypair, or instance of account base, got null instead')
      } else {
        switch (typeof account) {
          case 'string':
            decode(account, 'ak')
            if (!this.accounts[account]) throw new UnavailableAccountError(account)
            return this.accounts[account]
          case 'object':
            return isAccountBase(account) ? account : MemoryAccount({ keypair: account })
          default:
            throw new TypeError(
              'Account should be an address (ak-prefixed string), ' +
              `keypair, or instance of account base, got ${account} instead`)
        }
      }
    }
  }
})
