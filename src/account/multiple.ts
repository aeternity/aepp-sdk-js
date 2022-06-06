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
import { decode, EncodedData } from '../utils/encoder'
import { _AccountBase } from './base'
import AccountResolver, { _AccountResolver, Account } from './resolver'
import { UnavailableAccountError } from '../utils/errors'
import type stampit from '@stamp/it' // eslint-disable-line @typescript-eslint/no-unused-vars

class _AccountMultiple extends _AccountResolver {
  accounts: { [key: EncodedData<'ak'>]: _AccountBase }
  selectedAddress?: EncodedData<'ak'>

  async init (
    { accounts = [], address }: { accounts: _AccountBase[], address: EncodedData<'ak'> } & Parameters<_AccountBase['init']>[0]
  ): Promise<void> {
    this.accounts = Object.fromEntries(await Promise.all(
      accounts.map(async a => [await a.address(), a])
    ))
    address = address ?? Object.keys(this.accounts)[0]
    if (address != null) this.selectAccount(address)
  }

  _resolveAccount (account: Account | EncodedData<'ak'> = this.selectedAddress): _AccountBase {
    if (typeof account === 'string') {
      const address = account as EncodedData<'ak'>
      decode(address)
      if (this.accounts[address] == null) throw new UnavailableAccountError(account)
      account = this.accounts[address]
    }
    return super._resolveAccount(account)
  }

  /**
   * Get accounts addresses
   * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
   * @function
   * @rtype () => String[]
   * @return {String[]}
   * @example addresses()
   */
  addresses (): string[] {
    return Object.keys(this.accounts)
  }

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
  async addAccount (account: _AccountBase, { select }: { select?: boolean } = {}): Promise<void> {
    const address = await account.address()
    this.accounts[address] = account
    if (select === true) this.selectAccount(address)
  }

  /**
   * Remove specific account
   * @alias module:@aeternity/aepp-sdk/es/accounts/multiple
   * @function
   * @rtype (address: String) => void
   * @param {String} address - Address of account to remove
   * @return {void}
   * @example removeAccount(address)
   */
  removeAccount (address: EncodedData<'ak'>): void {
    if (this.accounts[address] == null) {
      console.warn(`removeAccount: Account for ${address} not available`)
      return
    }
    delete this.accounts[address] // eslint-disable-line @typescript-eslint/no-dynamic-delete
    if (this.selectedAddress === address) delete this.selectedAddress
  }

  /**
   * Select specific account
   * @alias module:@aeternity/aepp-sdk/es/account/selector
   * @instance
   * @rtype (address: String) => void
   * @param {String} address - Address of account to select
   * @example selectAccount('ak_xxxxxxxx')
   */
  selectAccount (address: EncodedData<'ak'>): void {
    decode(address)
    if (this.accounts[address] == null) throw new UnavailableAccountError(address)
    this.selectedAddress = address
  }
}

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
export default AccountResolver.compose<_AccountMultiple>(AsyncInit, {
  init: _AccountMultiple.prototype.init,
  methods: {
    _resolveAccount: _AccountMultiple.prototype._resolveAccount,
    addresses: _AccountMultiple.prototype.addresses,
    addAccount: _AccountMultiple.prototype.addAccount,
    removeAccount: _AccountMultiple.prototype.removeAccount,
    selectAccount: _AccountMultiple.prototype.selectAccount
  }
})
