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
const ContractBase = stampit({
  deepConf: {
    Contract: {
      methods: [
        'contractEncodeCallDataAPI',
        'contractDecodeDataAPI',
        'compileContractAPI',
        'contractDecodeCallDataBySourceAPI',
        'contractDecodeCallDataByCodeAPI',
        'contractGetACI',
        'setCompilerUrl',
        'getCompilerVersion',
        'contractDecodeCallResultAPI'
      ]
    }
  }
}, required({
  methods: {
    contractEncodeCallDataAPI: required,
    contractDecodeDataAPI: required,
    compileContractAPI: required,
    contractGetACI: required,
    setCompilerUrl: required,
    getCompilerVersion: required,
    contractDecodeCallResultAPI: required
  }
}))

/**
 * Encode contract data
 * @function contractEncodeCallDataAPI
 * @instance
 * @abstract
 * @category async
 * @rtype (source: String, name: String, args: Array) => callData: Promise[String]
 * @param {String} source - Contract source code
 * @param {String} name - Function name
 * @param {Array} args - Function argument's
 * @return {String} - Contract encoded data
 */

/**
 * Decode data
 * @function contractDecodeDataAPI
 * @instance
 * @abstract
 * @category async
 * @rtype (type: String, data: String) => decodedResult: Promise[String]
 * @param {String} type - Contract call result type
 * @param {String} data - Encoded contract call result
 * @return {String} - Decoded contract call result
 */

/**
 * Decode contract call result data
 * @function contractDecodeCallResultAPI
 * @instance
 * @abstract
 * @category async
 * @rtype (source: String, fn: String, callValue: String, callResult: String) => decodedResult: Promise[String]
 * @param {String} source - Contract source
 * @param {String} fn - Fn name
 * @param {String} callValue - result data (cb_das...)
 * @param {String} callResult - contract call result status('ok', 'revert', ...)
 * @return {String} - Decoded contract call result
 */

/**
 * Decode call data by source
 * @function contractDecodeCallDataBySourceAPI
 * @instance
 * @abstract
 * @category async
 * @rtype (source: String, function: String, callData: String) => decodedResult: Promise[String]
 * @param {String} source - contract source
 * @param {String} function - function name
 * @param {String} callData - Encoded contract call data
 * @return {String} - Decoded contract call data
 */

/**
 * Decode call data by bytecode
 * @function contractDecodeCallDataByCodeAPI
 * @instance
 * @abstract
 * @category async
 * @rtype (code: String, callData: String) => decodedResult: Promise[String]
 * @param {String} code - contract byte code
 * @param {String} callData - Encoded contract call data
 * @return {String} - Decoded contract call data
 */

/**
 * Compile contract
 * @function compileContractAPI
 * @instance
 * @abstract
 * @category async
 * @rtype (code: String, options?: Object) => compiledContract: Object
 * @param {String} code - Contract source code
 * @param {Object} [options={}] - Options
 * @return {Object} Object which contain bytecode of contract
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

/**
 * Get Compiler Version
 * @function getCompilerVersion
 * @instance
 * @abstract
 * @category async
 * @rtype () => String
 * @return {String} Compiler version
 */

export default ContractBase
