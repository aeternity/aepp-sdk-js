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

import Oracle from '../oracle'
import { required } from '@stamp/required'

/**
 * Basic Chain Stamp
 *
 * Attempting to create instances from the Stamp without overwriting all
 * abstract methods using composition will result in an exception.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/chain
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Chain instance
 */
const Chain = Oracle.compose({
  deepProps: { Chain: { defaults: { waitMined: true } } },
  statics: { waitMined (bool) { return this.deepProps({ Chain: { defaults: { waitMined: bool } } }) } },
  deepConf: {
    Ae: {
      methods: [
        'sendTransaction', 'height', 'awaitHeight', 'poll', 'balance', 'tx',
        'mempool', 'topBlock', 'getTxInfo', 'txDryRun', 'getName', 'getNodeInfo', 'getAccount'
      ]
    }
  }
}, required({
  methods: {
    sendTransaction: required,
    height: required,
    awaitHeight: required,
    topBlock: required,
    poll: required,
    balance: required,
    tx: required,
    getTxInfo: required,
    mempool: required,
    txDryRun: required,
    getAccount: required
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
 * @rtype (tx: String, options?: Object) => tx: Promise[Object]|txHash: Promise[String]
 * @param {String} tx - Transaction to submit
 * @param {String} [options={}] - Options to pass to the implementation
 * @param {String} [options.verify = false] - Verify transaction before broadcast.
 * @return {Object|String} Transaction or transaction hash
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
 * @rtype (th: String, options?: Object) => tx: Object
 * @param {Object} [options={}] - Options
 * @param {Number} options.interval - Interval (in ms) at which to poll the chain
 * @param {Number} options.blocks - Number of blocks mined after which to fail
 * @return {Object} The transaction as it was mined
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
 * @param {String} options.hash - The block hash on which to obtain the balance for (default: top of chain)
 * @return {Object} The transaction as it was mined
 */

/**
 * Obtain a transaction based on its hash
 * @function tx
 * @instance
 * @abstract
 * @category async
 * @rtype (hash: String, info = false) => tx: Object
 * @param {String} hash - Transaction hash
 * @param {Boolean} info - Retrieve additional transaction date. Works only for (ContractCreate and ContractCall transaction's)
 * @return {Object} Transaction
 */

/**
 * Obtain a transaction info based on its hash
 * @function getTxInfo
 * @instance
 * @abstract
 * @category async
 * @rtype (hash: String) => tx: Object
 * @param {String} hash - Transaction hash
 * @return {Object} Transaction
 */

/**
 * Obtain transaction's from mempool
 * @function mempool
 * @instance
 * @abstract
 * @category async
 * @rtype () => txs: [...Object]
 * @return {Object[]} Transactions
 */

/**
 * Obtain current generation
 * @function getCurrentGeneration
 * @instance
 * @abstract
 * @category async
 * @rtype () => generation: Object
 * @return {Object} Current Generation
 */

/**
 * Get generation by hash or height
 * @function getGeneration
 * @instance
 * @abstract
 * @category async
 * @rtype (hashOrHeight) => generation: Object
 * @param {String|Number} hashOrHeight - Generation hash or height
 * @return {Object} Generation
 */

/**
 * Get micro block transactions
 * @function getMicroBlockTransactions
 * @instance
 * @abstract
 * @category async
 * @rtype (hash) => txs: [...Object]
 * @return {Object[]} Transactions
 */

/**
 * Get key block
 * @function getKeyBlock
 * @instance
 * @abstract
 * @category async
 * @rtype (hashOrHeight) => keyBlock: Object
 * @return {Object} Key Block
 */

/**
 * Get micro block header
 * @function getMicroBlockHeader
 * @instance
 * @abstract
 * @category async
 * @rtype (hash) => header: Object
 * @return {Object} Micro block header
 */

/**
 * Get account by account public key
 * @function getAccount
 * @instance
 * @abstract
 * @category async
 * @rtype (address, { hash, height }) => account: Object
 * @param {String} address - Account public key
 * @param {Object} [options={}] - Options
 * @param {Number} [options.height] - Get account on specific block by block height
 * @param {String} [options.hash] - Get account on specific block by block hash
 * @return {Object} Account
 */

/**
 * Transaction dry-run
 * @function txDryRun
 * @instance
 * @abstract
 * @category async
 * @rtype (txs, accounts, hashOrHeight) => result: Object
 * @param {Array} txs - Array of transaction's
 * @param {Array} accounts - Array of account's
 * @param {String|Number} hashOrHeight - hash or height of block on which to make dry-run
 * @return {Object} Result
 */

/**
 * Get Node Info
 * @function getInfo
 * @instance
 * @abstract
 * @category async
 * @rtype () => result: Object
 * @return {Object} Result
 */

export default Chain
