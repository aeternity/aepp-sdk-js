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
 * Accounts Selector module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/accounts}.
 * @module @aeternity/aepp-sdk/es/account/selector
 * @export Account
 * @example import Selector from '@aeternity/aepp-sdk/es/account/selector'
 */

import Account from './'
import required from '@stamp/required'
import { assertedType } from '../utils/crypto'
import MemoryAccount from './memory'

export const isMemoryAccount = (acc) => !['sign', 'address'].find(f => typeof acc[f] !== 'function')

async function sign (data, { onAccount } = {}) {
  if (!onAccount) return this.signWith(this.Selector.address, data)
  // onAccount can be account address(should exist in sdk instance) or MemoryAccount
  return this.resolveOnAccount(onAccount, 'sign', data)
}

async function resolveOnAccount (onAccount, operation = 'address', data) {
  switch (typeof onAccount) {
    case 'string':
      if (!assertedType(onAccount, 'ak', true)) throw new Error('Invalid account address, check "onAccount" value')
      if (!this.accounts[onAccount]) throw Error(`Account for ${onAccount} not available`)
      if (operation === 'sign') return this.signWith(onAccount, data)
      if (operation === 'address') return onAccount
      break
    case 'object':
      try {
        const memoryAccount = isMemoryAccount(onAccount)
          ? onAccount
          : MemoryAccount({ keypair: onAccount })
        if (operation === 'sign') return memoryAccount.sign(data)
        if (operation === 'address') return memoryAccount.address()
        break
      } catch (e) {
        e.message = `Invalid 'onAccount' option: ${e.message}`
        throw e
      }
    default:
      throw new Error('Invalid `onAccount` option: should be keyPair object or account address')
  }
}
async function address ({ onAccount } = {}) {
  if (!onAccount) {
    if (this.Selector.address) return Promise.resolve(this.Selector.address)
    throw new Error('You don\'t have selected account')
  }
  return this.resolveOnAccount(onAccount, 'address')
}

/**
 * Select specific account
 * @alias module:@aeternity/aepp-sdk/es/account/selector
 * @instance
 * @rtype (address: String) => Void
 * @param {String} address - Address of account to select
 * @example selectAccount('ak_xxxxxxxx')
 */
function selectAccount (address) {
  if (!address || !assertedType(address, 'ak', true)) throw new Error('Invalid account address')
  if (!this.accounts[address]) throw Error(`Account for ${address} not available`)
  this.Selector.address = address
}

/**
 * Selector Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/account/selector
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Account} Account instance
 * @example Selector()
 */
const Selector = Account.compose({
  async init ({ address }) {
    if (!address) address = Object.keys(this.accounts)[0]
    if (address && !assertedType(address, 'ak', true)) throw new Error('Invalid account address')
    this.Selector.address = address
  },
  methods: { sign, address, selectAccount, resolveOnAccount },
  deepProps: {
    Selector: {}
  }
}, required({
  methods: { signWith: required }
}))

export default Selector
