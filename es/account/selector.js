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

async function sign (data, { onAccount } = {}) {
  if (onAccount && !assertedType(onAccount, 'ak', true)) throw new Error('Invalid account address, check "onAccount" value')
  return this.signWith(onAccount || this.Selector.address, data)
}

async function address ({ onAccount } = {}) {
  if (onAccount) {
    if (!assertedType(onAccount, 'ak', true)) throw new Error('Invalid account address, check "onAccount" value')
    if (!this.accounts[onAccount]) throw Error(`Account for ${onAccount} not available`)
    return Promise.resolve(onAccount)
  }
  if (this.Selector.address) return Promise.resolve(this.Selector.address)
  throw new Error('You don\'t have selected account')
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
  if (!address || !assertedType(address, 'ak', true)) throw new Error(`Invalid account address`)
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
    if (address && !assertedType(address, 'ak', true)) throw new Error(`Invalid account address`)
    this.Selector.address = address
  },
  methods: { sign, address, selectAccount },
  deepProps: {
    Selector: {}
  }
}, required({
  methods: { signWith: required }
}))

export default Selector
