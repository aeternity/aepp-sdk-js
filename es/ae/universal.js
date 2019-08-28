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
 * Universal module
 * @module @aeternity/aepp-sdk/es/ae/universal
 * @export Universal
 * @example import Ae from '@aeternity/aepp-sdk/es/ae/universal'
 */

import Ae from './'
import Chain from '../chain/node'
import Aens from './aens'
import Transaction from '../tx/tx'
import Oracle from './oracle'
// Todo Enable GA
// import GeneralizeAccount from '../contract/ga'
import Accounts from '../accounts'
import Contract from './contract'
import NodePool from '../node-pool'

/**
 * Universal Stamp
 *
 * Universal provides Ae base functionality with Contract and Aens
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/universal
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Universal instance
 */
export const Universal = Ae.compose(Accounts, Chain, NodePool, Transaction, Aens, Contract, Oracle, {
  init () {},
  props: { process: {} }
})
export const UniversalWithAccounts = Universal
export default Universal
