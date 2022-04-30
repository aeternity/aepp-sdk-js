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
 * @example import { Ae } from '@aeternity/aepp-sdk'
 */

import stampit from '@stamp/it'
import Tx from '../tx'
import * as chainMethods from '../chain'
import NodePool from '../node-pool'
import AccountResolver from '../account/resolver'
import { buildTxHash, unpackTx } from '../tx/builder'
import BigNumber from 'bignumber.js'
import { AE_AMOUNT_FORMATS } from '../utils/amount-formatter'
import { ArgumentError } from '../utils/errors'
import { mapObject } from '../utils/other'

/**
 * Sign and post a transaction to the chain
 * @instance
 * @category async
 * @rtype (tx: String, options: Object) => Promise[String]
 * @param {String} tx - Transaction
 * @param {Object} [options={}] options - Options
 * @param {Object} [options.verify=true] - Verify transaction before broadcast, throw error if not
 * valid
 * @return {Object} Transaction
 */
async function send (tx, options = {}) {
  const opt = { ...this.Ae.defaults, ...options }
  const { contractId, authFun } = options.innerTx
    ? { contractId: false }
    : await this.getAccount(await this.address(opt))
  const signed = contractId
    ? await this.signUsingGA(tx, { ...opt, authFun })
    : await this.signTransaction(tx, opt)
  return opt.innerTx
    ? { hash: buildTxHash(signed), rawTx: signed }
    : this.sendTransaction(signed, opt)
}

async function signUsingGA (tx, { authData, authFun, ...options } = {}) {
  return this.createMetaTx(tx, authData, authFun, options)
}

/**
 * Send tokens to another account
 * @instance
 * @category async
 * @rtype (amount: Number|String, recipientIdOrName: String, options?: Object) => Promise[String]
 * @param {Number|String} amount - Amount to spend
 * @param {String} recipientIdOrName - Address or name of recipient account
 * @param {Object} [options] - Options
 * @return {Object} Transaction
 */
async function spend (amount, recipientIdOrName, options) {
  const opt = { ...this.Ae.defaults, ...options }
  return this.send(
    await this.spendTx({
      ...opt,
      senderId: await this.address(opt),
      recipientId: await this.resolveName(recipientIdOrName, 'account_pubkey', opt),
      amount
    }),
    opt
  )
}

// TODO: Rename to spendFraction
/**
 * Send a fraction of token balance to another account
 * @instance
 * @category async
 * @rtype (fraction: Number|String, recipientIdOrName: String, options?: Object) => Promise[String]
 * @param {Number|String} fraction - Fraction of balance to spend (between 0 and 1)
 * @param {String} recipientIdOrName - Address or name of recipient account
 * @param {Object} [options] - Options
 * @return {Object} Transaction
 */
async function transferFunds (fraction, recipientIdOrName, options) {
  if (fraction < 0 || fraction > 1) {
    throw new ArgumentError('fraction', 'a number between 0 and 1', fraction)
  }
  const opt = { ...this.Ae.defaults, ...options }
  const recipientId = await this.resolveName(recipientIdOrName, 'account_pubkey', opt)
  const senderId = await this.address(opt)
  const balance = new BigNumber(await this.getBalance(senderId))
  const desiredAmount = balance.times(fraction).integerValue(BigNumber.ROUND_HALF_UP)
  const { tx: { fee } } = unpackTx(
    await this.spendTx({ ...opt, senderId, recipientId, amount: desiredAmount })
  )
  // Reducing of the amount may reduce transaction fee, so this is not completely accurate
  const amount = desiredAmount.plus(fee).gt(balance) ? balance.minus(fee) : desiredAmount
  return this.send(await this.spendTx({ ...opt, senderId, recipientId, amount }), opt)
}

/**
 * Submit transaction of another account paying for it (fee and gas)
 * @instance
 * @category async
 * @rtype (transaction: String, options?: Object) => Promise[String]
 * @param {String} transaction - tx_<base64>-encoded transaction
 * @param {Object} [options]
 * @return {Object} Transaction
 */
async function payForTransaction (transaction, options) {
  const opt = { ...this.Ae.defaults, ...options }
  return this.send(
    await this.payingForTx({
      ...opt,
      payerId: await this.address(opt),
      tx: transaction
    }),
    opt
  )
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
const Ae = stampit(NodePool, Tx, AccountResolver, {
  methods: {
    send,
    spend,
    transferFunds,
    payForTransaction,
    destroyInstance,
    signUsingGA,
    ...mapObject(
      chainMethods,
      ([name, handler]) => [
        name,
        function (...args) {
          const instanceOptions = {
            ...this.Ae.defaults,
            onNode: this.selectedNode.instance,
            onAccount: this
          }
          const lastArg = args[args.length - 1]
          if (
            lastArg && typeof lastArg === 'object' && lastArg.constructor === Object
          ) {
            Object.assign(lastArg, {
              ...instanceOptions,
              ...lastArg,
              ...lastArg.onAccount && { onAccount: this._resolveAccount(lastArg.onAccount) }
            })
          } else args.push(instanceOptions)
          return handler(...args)
        }
      ]
    )
  },
  deepProps: { Ae: { defaults: { denomination: AE_AMOUNT_FORMATS.AETTOS } } }
})

export default Ae
