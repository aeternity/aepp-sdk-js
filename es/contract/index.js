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
 * Contract module
 * @module @aeternity/aepp-sdk/es/contract
 * @export Contract
 * @example import Contract from '@aeternity/aepp-sdk/es/contract'
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
const ContractBase = stampit({
  deepConf: {
    Contract: {
      methods: [
        'contractEpochEncodeCallData',
        'contractEpochCall',
        'contractEpochDecodeData',
        'compileEpochContract'
      ]
    }
  }
}, required({
  methods: {
    contractEpochEncodeCallData: required,
    contractEpochCall: required,
    contractEpochDecodeData: required,
    compileEpochContract: required
  }
}))

/**
 * Encode contract data
 * @function contractEpochEncodeCallData
 * @instance
 * @abstract
 * @category async
 * @rtype (code: String, abi: String, name: String, args: Object) => callData: Promise[String]
 * @param {String} code - Contract code
 * @param {String} abu - Contract compiler name
 * @param {String} name - Function name
 * @param {String} args - Function argument's
 * @return {String} - Contract encoded data
 */

/**
 * Call the contract
 * @function contractEpochCall
 * @instance
 * @abstract
 * @category async
 * @rtype (code: String, abi: String, name: String, args: Object) => callData: Promise[String]
 * @param {String} code - Contract code
 * @param {String} abu - Contract compiler name
 * @param {String} name - Function name
 * @param {String} args - Function argument's
 * @return {Object} - Contract call result
 */

/**
 * Decode data
 * @function contractEpochDecodeData
 * @instance
 * @abstract
 * @category async
 * @rtype (type: String, data: String) => decodedResult: Promise[String]
 * @param {String} type - Contract call result type
 * @param {String} data - Encoded contract call result
 * @return {String} - Decoded contract call result
 */

/**
 * Compile epoch contract
 * @function compileEpochContract
 * @instance
 * @abstract
 * @category async
 * @rtype (code: String, options?: Object) => compiledContract: Object
 * @param {String} code - Contract source code
 * @param {Object} [options={}] - Options
 * @return {Object} Object which contain bytecode of contract
 */

export default ContractBase
