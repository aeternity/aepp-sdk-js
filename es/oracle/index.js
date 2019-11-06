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
 * Oracle Base module
 * @module @aeternity/aepp-sdk/es/oracle
 * @export Contract
 * @example import ContractBase from '@aeternity/aepp-sdk/es/oracle'
 */

import { required } from '@stamp/required'
import stampit from '@stamp/it'

/**
 * Basic Oracle Stamp
 *
 * This stamp include api call's related to oracle functionality.
 * Attempting to create instances from the Stamp without overwriting all
 * abstract methods using composition will result in an exception.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/oracle
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Oracle instance
 */
const OracleBase = stampit({
  deepConf: {
    Contract: {
      methods: [
        'getOracle',
        'getOracleQueries',
        'getOracleQuery'
      ]
    }
  }
}, required({
  methods: {
    getOracle: required,
    getOracleQueries: required,
    getOracleQuery: required
  }
}))

/**
 * Get oracle by oracle public key
 * @function getOracle
 * @instance
 * @abstract
 * @category async
 * @rtype (oracleId: String) => oracle: Promise[Object]
 * @param {String} oracleId - Oracle public key
 * @return {Object} - Oracle object
 */

/**
 * Get oracle queries
 * @function getOracleQueries
 * @instance
 * @abstract
 * @category async
 * @rtype (oracleId: String) => oracleQueries: Promise[Object]
 * @param {String} oracleId- Oracle public key
 * @return {Object} - Oracle queries
 */

/**
 * Get oracle query
 * @function getOracleQuery
 * @instance
 * @abstract
 * @category async
 * @rtype (oracleId: String, queryId: String) => oracleQuery: Promise[Object]
 * @param {String} oracleId - Oracle public key
 * @param {String} queryId - Query id
 * @return {Object} - Oracle query object
 */

export default OracleBase
