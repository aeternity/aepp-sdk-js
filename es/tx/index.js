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
 * Tx module
 * @module @aeternity/aepp-sdk/es/tx
 * @export Tx
 * @example import Tx from '@aeternity/aepp-sdk/es/tx'
 */

import stampit from '@stamp/it'
import { required } from '@stamp/required'

/**
 * Basic Tx Stamp
 *
 * Attempting to create instances from the Stamp without overwriting all
 * abstract methods using composition will result in an exception.
 *
 * Tx is one of the three basic building blocks of an
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} client and provides methods to
 * create aeternity transactions.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Tx instance
 * @example Tx()
 */
const Tx = stampit({
  deepConf: {
    Ae: {
      methods: [
        'spendTx', 'namePreclaimTx', 'nameClaimTx', 'nameTransferTx',
        'nameUpdateTx', 'nameRevokeTx', 'contractCreateTx', 'contractCallTx'
      ]
    }
  }
}, required({
  methods: {
    spendTx: required,
    namePreclaimTx: required,
    nameClaimTx: required,
    nameTransferTx: required,
    nameUpdateTx: required,
    nameRevokeTx: required,
    contractCreateTx: required,
    contractCallTx: required,
    calculateFee: required
  }
}))

/**
 * Select specific account
 * @function calculateFee
 * @instance
 * @category async
 * @rtype (fee, txtype, gas = 0) => String
 * @param {String|Number} fee - fee
 * @param {String} txType - Transaction type
 * @param {String|Number} gas - Gas amount
 * @return {String} fee
 */

/**
 * Create a `spend_tx` transaction
 * @function spendTx
 * @instance
 * @abstract
 * @category async
 * @rtype ({sender?: String, recipientId: String, amount: Number, fee: Number, ttl: Number, nonce?: Number, payload?: String}) => tx: Promise[String]
 * @param {Object} options - The object to extract properties from
 * @return {String} `spend_tx` transaction
 */

/**
 * Create a `name_preclaim_tx` transaction
 * @function namePreclaimTx
 * @instance
 * @abstract
 * @category async
 * @rtype ({account?: String, commitment: String, fee: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]
 * @param {Object} options - The object to extract properties from
 * @return {String} `name_preclaim_tx` transaction
 */

/**
 * Create a `name_claim_tx` transaction
 * @function nameClaimTx
 * @instance
 * @abstract
 * @category async
 * @rtype ({account?: String, name: String, nameSalt: String, fee: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]
 * @param {Object} options - The object to extract properties from
 * @return {String} `name_claim_tx` transaction
 */

/**
 * Create a `name_transfer_tx` transaction
 * @function nameTransferTx
 * @instance
 * @abstract
 * @category async
 * @rtype ({account?: String, nameId: String, recipientId: String, fee: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]
 * @param {Object} options - The object to extract properties from
 * @return {String} `name_transfer_tx` transaction
 */

/**
 * Create a `name_update_tx` transaction
 * @function nameUpdateTx
 * @instance
 * @abstract
 * @category async
 * @rtype ({account?: String, nameId: String, pointers: Object, nameTtl: Number, clientTtl: Number, fee: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]
 * @param {Object} options - The object to extract properties from
 * @return {String} `name_update_tx` transaction
 */

/**
 * Create a `name_revoke_tx` transaction
 * @function nameRevokeTx
 * @instance
 * @abstract
 * @category async
 * @rtype ({account?: String, nameId: String, fee: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]
 * @param {Object} options - The object to extract properties from
 * @return {String} `name_revoke_tx` transaction
 */

/**
 * Create a `contract_create_tx` transaction
 * @function contractCreateTx
 * @instance
 * @abstract
 * @category async
 * @rtype ({owner: String, code: String, callData: String, vmVersion: Number, deposit: Number, amount: Number, gas: Number, gasPrice: Number, fee: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]
 * @param {Object} options - The object to extract properties from
 * @return {String} `contract_create_tx` transaction
 */

/**
 * Create a `contract_call_tx` transaction
 * @function contractCallTx
 * @instance
 * @abstract
 * @category async
 * @rtype ({callerId: String, contract: String, callData: String, vmVersion: Number, amount: Number, gas: Number, gasPrice: Number, fee: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]
 * @param {Object} options - The object to extract properties from
 * @return {String} `contract_call_tx` transaction
 */

export default Tx
