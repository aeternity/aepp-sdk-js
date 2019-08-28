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
 * Ae module
 * @module @aeternity/aepp-sdk/es/ae
 * @export Ae
 * @example import Ae from '@aeternity/aepp-sdk/es/ae'
 */

import stampit from '@stamp/it'
import Tx from '../tx'
import Chain from '../chain'
import Account from '../account'
import TxBuilder from '../tx/builder'
import * as R from 'ramda'
import { BigNumber } from 'bignumber.js'

/**
 * Sign and post a transaction to the chain
 * @instance
 * @category async
 * @rtype (tx: String, options: Object) => Promise[String]
 * @param {String} tx - Transaction
 * @param {Object} [options={}] options - Options
 * @param {Object} [options.verify] verify - Verify transaction before broadcast, throw error if not valid
 * @return {String|String} Transaction or transaction hash
 */
async function send (tx, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  // Todo Enable GA
  // const { contractId: gaId, authFun } = await this.getAccount(await this.address(opt))
  // const signed = gaId
  //   ? await this.signUsingGA(tx, { ...opt, authFun })
  const signed = await this.signTransaction(tx, opt)
  return this.sendTransaction(signed, opt)
}

// Todo Enable GA
// eslint-disable-next-line no-unused-vars
async function signUsingGA (tx, options = {}) {
  const { authData, authFun } = options
  return this.createMetaTx(tx, authData, authFun, options)
}

/**
 * Send tokens to another account
 * @instance
 * @category async
 * @rtype (amount: Number|String, recipientId: String, options?: Object) => Promise[String]
 * @param {Number|String} amount - Amount to spend
 * @param {String} recipientId - Address of recipient account
 * @param {Object} options - Options
 * @return {String|String} Transaction or transaction hash
 */
async function spend (amount, recipientId, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const spendTx = await this.spendTx(R.merge(opt, { senderId: await this.address(opt), recipientId, amount: amount }))
  return this.send(spendTx, opt)
}

/**
 * Send a percentage of funds to another account
 * @instance
 * @category async
 * @rtype (percentage: Number|String, recipientId: String, options?: Object) => Promise[String]
 * @param {Number|String} percentage - Percentage of amount to spend
 * @param {String} recipientId - Address of recipient account
 * @param {Object} options - Options
 * @return {String|String} Transaction or transaction hash
 */
async function transferFunds (percentage, recipientId, options = { excludeFee: false }) {
  if (percentage < 0 || percentage > 1) throw new Error(`Percentage should be a number between 0 and 1, got ${percentage}`)
  const opt = R.merge(this.Ae.defaults, options)

  const requestTransferAmount = BigNumber(await this.balance(await this.address())).times(percentage)
  let spendTx = await this.spendTx(R.merge(opt, { senderId: await this.address(), recipientId, amount: requestTransferAmount }))

  const { tx: txObject } = TxBuilder.unpackTx(spendTx)
  // If the requestTransferAmount should include the fee keep calculating the fee
  let amount = requestTransferAmount
  if (!options.excludeFee) {
    while (amount.plus(txObject.fee).gt(requestTransferAmount)) {
      amount = requestTransferAmount.minus(txObject.fee)
    }
  }

  // Rebuild tx
  spendTx = await this.spendTx(R.merge(opt, { senderId: await this.address(), recipientId, amount }))

  return this.send(spendTx, opt)
}

/**
 * Remove all listeners for RPC
 * @instance
 * @return {void}
 */
function destroyInstance () {
  const destroyMethods = ['destroyClient', 'destroyServer'] // Array with destroy function's
  destroyMethods.forEach(m => this[m] && typeof this[m] === 'function' && this[m]())
}

/**
 * Basic Ae Stamp
 *
 * Attempting to create instances from the Stamp without overwriting all
 * abstract methods using composition will result in an exception.
 *
 * Ae objects are the composition of three basic building blocks:
 * * {@link module:@aeternity/aepp-sdk/es/tx--Tx}
 * * {@link module:@aeternity/aepp-sdk/es/account--Account}
 * * {@link module:@aeternity/aepp-sdk/es/chain--Chain}
 * Only by providing the joint functionality of those three, most more advanced
 * operations, i.e. the ones with actual use value on the chain, become
 * available.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Ae instance
 */
const Ae = stampit(Tx, Account, Chain, {
  methods: { send, spend, transferFunds, destroyInstance },
  deepProps: { Ae: { defaults: {} } }
  // Todo Enable GA
  // deepConfiguration: { Ae: { methods: ['signUsingGA'] } }
})

export default Ae
