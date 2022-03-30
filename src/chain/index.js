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
 * Chain module
 * @module @aeternity/aepp-sdk/es/chain
 * @export Chain
 * @example import { Chain } from '@aeternity/aepp-sdk'
 */

import stampit from '@stamp/it'
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
const Chain = stampit({
  deepProps: {
    Ae: {
      defaults: {
        waitMined: true,
        verify: true,
        _expectedMineRate: 180000,
        _microBlockCycle: 3000,
        _maxPollInterval: 5000
      }
    }
  },
  methods: {
    _getPollInterval (type) {
      const base = {
        block: this.Ae.defaults._expectedMineRate,
        microblock: this.Ae.defaults._microBlockCycle
      }[type]
      if (!base) throw new Error(`Unknown poll type: ${type}`)
      return Math.min(base / 3, this.Ae.defaults._maxPollInterval)
    }
  }
}, required({
  methods: {
    sendTransaction: required,
    height: required,
    awaitHeight: required,
    poll: required,
    balance: required,
    getBalance: required,
    tx: required,
    getTxInfo: required,
    txDryRun: required,
    getAccount: required
  }
}))

/**
 * Submit a signed transaction for mining
 * @function sendTransaction
 * @instance
 * @abstract
 * @category async
 * @rtype (tx: String, options?: Object) => tx: Promise[Object]|txHash: Promise[String]
 * @param {String} tx - Transaction to submit
 * @param {String} [options={}] - Options to pass to the implementation
 * @param {String} [options.verify=true] - Verify transaction before broadcast.
 * @return {Object} Transaction
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
 * @param {Number} options.height - The chain height at which to obtain the balance for (default:
 * top of chain)
 * @param {String} options.hash - The block hash on which to obtain the balance for (default: top
 * of chain)
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
 * @param {Boolean} info - Retrieve additional transaction date. Works only for (ContractCreate and
 * ContractCall transaction's)
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
 * Wait for transaction confirmation
 * @function waitForTxConfirm
 * @instance
 * @abstract
 * @category async
 * @rtype (txHash: String, { confirm: Number | Boolean } = { confirm: 3 }) => Promise<Number>
 * @param {String} txHash - Transaction hash
 * @param {Object} [options] - options
 * @param {Number} [options.confirm=3] - Number of blocks to wait for transaction confirmation
 * @return {Promise<Number>} Current Height
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
 * @rtype (tx, accountAddress, options) => result: Object
 * @param {String} tx - transaction to execute
 * @param {String} accountAddress - address that will be used to execute transaction
 * @param {String|Number} [options.top] - hash of block on which to make dry-run
 * @param {Boolean} [options.txEvents] - collect and return on-chain tx events that would result
 * from the call
 * @return {Object} Result
 */

export default Chain
