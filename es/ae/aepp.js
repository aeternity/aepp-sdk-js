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
 * Aepp module
 * @module @aeternity/aepp-sdk/es/ae/aepp
 * @export Aepp
 * @example import Ae from '@aeternity/aepp-sdk/es/ae/aepp'
 */

import Ae from './'
import Aens from './aens'
import Rpc from '../rpc/client'
import Contract from './contract'
import AeppRpc from '../utils/aepp-wallet-communication/rpc/aepp-rpc'
import Chain from '../chain/node'
import Tx from '../tx/tx'

/**
 * Aepp Stamp
 *
 * Aepp provides Ae base functionality with Contract and Aens.
 * This stamp can be used only with Wallet, all Aepp method's going through RPC to Wallet.
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aepp
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Aepp instance
 */
const Aepp = Ae.compose(Contract, Aens, Rpc)
export const RpcAepp = Ae.compose(Chain, Tx, Contract, Aens, AeppRpc)

export default Aepp
