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
 * Generalize Account module - routines to use generalize account
 *
 * @module @aeternity/aepp-sdk/es/contract/ga
 * @export GeneralizeAccount
 * @example import { GeneralizeAccount } from '@aeternity/aepp-sdk'
 */
import * as R from 'ramda'

import { ContractAPI } from '../../ae/contract'
import { TX_TYPE } from '../../tx/builder/schema'
import { buildTx, unpackTx } from '../../tx/builder'
import { prepareGaParams } from './helpers'
import { hash } from '../../utils/crypto'

/**
 * GeneralizeAccount Stamp
 *
 * Provide Generalize Account implementation
 * {@link module:@aeternity/aepp-sdk/es/contract/ga} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} GeneralizeAccount instance
 * @example
 * const authContract = ``
 * await client.createGeneralizeAccount(authFnName, authContract, [...authFnArguments]
 * // Make spend using GA
 * const callData = 'cb_...' // encoded call data for auth contract
 * await client.spend(10000, receiverPub, { authData: { callData } })
 * // or
 * await client.spend(10000, receiverPub, { authData: { source: authContract, args: [...authContractArgs] } }) // sdk will prepare callData itself
 */
export const GeneralizeAccount = ContractAPI.compose({
  methods: {
    createGeneralizeAccount,
    createMetaTx,
    isGA
  }
})
export default GeneralizeAccount

/**
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * @function
 * Check if account is GA account
 * @param {String} address - Account address
 * @return {Boolean}
 */
async function isGA (address) {
  const { contractId } = await this.getAccount(address)
  return !!contractId
}

/**
 * Convert current account to GA account
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * @function
 * @param {String} authFnName - Authorization function name
 * @param {String} source - Auth contract source code
 * @param {Array} [args] - init arguments
 * @param {Object} [options] - Options
 * @return {Promise<Readonly<{result: *, owner: *, createdAt: Date, address, rawTx: *, transaction: *}>>}
 */
async function createGeneralizeAccount (authFnName, source, args = [], options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const ownerId = await this.address(opt)

  if (await this.isGA(ownerId)) throw new Error(`Account ${ownerId} is already GA`)

  const { tx, contractId } = await this.gaAttachTx({
    ...opt,
    ownerId,
    code: (await this.contractCompile(source)).bytecode,
    callData: await this.contractEncodeCall(source, 'init', args),
    authFun: hash(authFnName)
  })

  const { hash: transaction, rawTx } = await this.send(tx, opt)

  return Object.freeze({
    owner: ownerId,
    transaction,
    rawTx,
    gaContractId: contractId
  })
}

const wrapInEmptySignedTx = (tx) => buildTx({ encodedTx: tx, signatures: [] }, TX_TYPE.signed)

/**
 * Create a metaTx transaction
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * @function
 * @param {String} rawTransaction Inner transaction
 * @param {Object} authData Object with gaMeta params
 * @param {String} authFnName - Authorization function name
 * @param {Object} options - Options
 * @return {String}
 */
async function createMetaTx (rawTransaction, authData, authFnName, options = {}) {
  if (!authData) throw new Error('authData is required')
  // Check if authData is callData or if it's an object prepare a callData from source and args
  const { authCallData, gas } = await prepareGaParams(this)(authData, authFnName)
  const opt = R.merge(this.Ae.defaults, options)
  const { abiVersion } = await this.getVmVersion(TX_TYPE.contractCall)
  const wrappedTx = wrapInEmptySignedTx(unpackTx(rawTransaction))
  const params = {
    ...opt,
    tx: {
      ...wrappedTx,
      tx: wrappedTx.txObject
    },
    gaId: await this.address(opt),
    abiVersion: abiVersion,
    authData: authCallData,
    gas,
    vsn: 2
  }
  const { fee } = await this.prepareTxParams(TX_TYPE.gaMeta, params)
  const { rlpEncoded: metaTxRlp } = buildTx(
    { ...params, fee: `${fee}` },
    TX_TYPE.gaMeta,
    { vsn: 2 }
  )
  return wrapInEmptySignedTx(metaTxRlp).tx
}
