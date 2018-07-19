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
 * Chain module
 * @module @aeternity/aepp-sdk/es/chain
 * @export Chain
 * @example import Chain from '@aeternity/aepp-sdk/es/chain'
 */

import stampit from '@stamp/it'
import {required} from '@stamp/required'

/**
 * Basic Chain Stamp
 *
 * Attempting to create instances from the Stamp without overwriting all abstract methods using composition will result in an exception.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/chain
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Chain instance
 * @example Chain()
 */
const Chain = stampit({
  deepProps: {Chain: {defaults: {waitMined: true}}},
  statics: {waitMined (bool) { return this.deepProps({Chain: {defaults: {waitMined: bool}}}) }},
  deepConf: {
    Ae: {
      methods: [
        'sendTransaction', 'height', 'awaitHeight', 'poll', 'balance', 'tx',
        'mempool'
      ]
    }
  }
}, required({
  methods: {
    sendTransaction: required,
    height: required,
    awaitHeight: required,
    poll: required,
    balance: required,
    tx: required,
    mempool: required
  }
}))

/**
 * Reconfigure Stamp to (not) wait until transactions are mined
 * @function waitMined
 * @static
 * @rtype (bool: Boolean) => Stamp
 * @param {boolean} bool - Whether to wait for transactions
 * @return {Stamp} Reconfigured Chain Stamp
 */

/**
 * Submit a signed transaction for mining
 * @function sendTransaction
 * @instance
 * @abstract
 * @category async
 * @rtype (tx: String, options?: Object) => tx: Promise[String]|txHash: Promise[String]
 * @param {String} tx - Transaction to submit
 * @param {String} [options={}] - Options to pass to the implementation
 * @return {String|String} Transaction or transaction hash
 */

/**
 * Obtain current height of the chain
 * @function height
 * @instance
 * @abstract
 * @category async
 * @rtype () => height: Number
 * @return {Number} Current chain height
 */

/**
 * Wait for the chain to reach a specific height
 * @function awaitHeight
 * @instance
 * @abstract
 * @category async
 * @rtype (height: Number, options?: Object) => height: Number
 * @param {Object} [options={}] - Options
 * @param {Number} options.interval - Interval (in ms) at which to poll the chain
 * @param {Number} options.attempts - Number of polling attempts after which to fail
 * @return {Number} Current chain height
 */

/**
 * Wait for a transaction to be mined
 * @function poll
 * @instance
 * @abstract
 * @category async
 * @rtype (th: String, options?: Object) => tx: String
 * @param {Object} [options={}] - Options
 * @param {Number} options.interval - Interval (in ms) at which to poll the chain
 * @param {Number} options.blocks - Number of blocks mined after which to fail
 * @return {String} The transaction as it was mined
 */

/**
 * Request the balance of specified account
 * @function balance
 * @instance
 * @abstract
 * @category async
 * @rtype (address: String, options?: Object) => balance: Number
 * @param {String} address - The public account address to obtain the balance for
 * @param {Object} [options={}] - Options
 * @param {Number} options.height - The chain height at which to obtain the balance for (default: top of chain)
 * @param {String} options.hash - TODO
 * @return {String} The transaction as it was mined
 */

/**
 * Obtain a transaction based on its hash
 * @function tx
 * @instance
 * @abstract
 * @category async
 * @rtype (hash: String) => tx: String
 * @param {String} hash - Transaction hash
 * @return {String} Transaction
 */

/**
 * Obtain transactions currently in the mempool
 * @function mempool
 * @instance
 * @abstract
 * @category async
 * @rtype () => txs: [...String]
 * @return {String[]} Transactions
 */

export default Chain
