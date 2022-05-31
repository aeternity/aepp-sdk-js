/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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
 * @example import { RpcAepp } from '@aeternity/aepp-sdk'
 */

import Ae from './'
import Aens from './aens'
import ContractCompilerHttp from '../contract/compiler'
import AeppRpc from '../utils/aepp-wallet-communication/rpc/aepp-rpc'
import Tx from '../tx/tx'
import Oracle from './oracle'

/**
 * Aepp Stamp
 *
 * Aepp provides base functionality.
 * Expected to use this stamp with a Wallet.
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/aepp
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Aepp instance
 */
export default Ae.compose({
  init (options) {
    this.contractCompiler = new ContractCompilerHttp(options)
  }
}, Tx, Oracle, Aens, AeppRpc)
