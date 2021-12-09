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
 * Contract Base module
 * @module @aeternity/aepp-sdk/es/contract
 * @export Contract
 * @example import ContractBase from '@aeternity/aepp-sdk/es/contract'
 */

import stampit from '@stamp/it'
import { required } from '@stamp/required'

/**
 * Basic Contract Stamp
 *
 * This stamp include api call's related to contract functionality.
 * Attempting to create instances from the Stamp without overwriting all
 * abstract methods using composition will result in an exception.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/contract
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Contract instance
 */
const ContractBase = stampit(required({
  methods: {
    contractEncodeCallDataAPI: required,
    setCompilerUrl: required
  }
}))

/**
 * Encode contract data
 * @function contractEncodeCallDataAPI
 * @instance
 * @abstract
 * @category async
 * @rtype (source: String, name: String, args: Array, options: Array) => callData: Promise[String]
 * @param {String} source - Contract source code
 * @param {String} name - Function name
 * @param {Array} args - Function argument's
 * @param {Object} [options={}]  Options
 * @param {Object} [options.filesystem]  Contract external namespaces map
 * @return {String} - Contract encoded data
 */

/**
 * Set compiler url
 * @function setCompilerUrl
 * @instance
 * @abstract
 * @category async
 * @rtype (url: String) => void
 * @param {String} url - Compiler url
 * @return {void}
 */

export default ContractBase
