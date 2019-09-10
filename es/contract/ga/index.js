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
 * @example import GeneralizeAccount from '@aeternity/aepp-sdk/es/contract/ga' (Using tree-shaking)
 * @example import { GeneralizeAccount } from '@aeternity/aepp-sdk' (Using bundle)
 */
import * as R from 'ramda'

import { ContractAPI } from '../../ae/contract'
import { ABI_VERSIONS, TX_TYPE } from '../../tx/builder/schema'
import { buildTx } from '../../tx/builder'
import { getContractAuthFan, prepareGaParams, wrapInEmptySignedTx } from './helpers'
import { assertedType, decodeBase64Check } from '../../utils/crypto'

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
 * @param {Array} args - init arguments
 * @param {Object} options - Options
 * @return {Promise<Readonly<{result: *, owner: *, createdAt: Date, address, rawTx: *, transaction: *}>>}
 */
async function createGeneralizeAccount (authFnName, source, args, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const ownerId = await this.address(opt)

  if (await this.isGA(ownerId)) throw new Error(`Account ${ownerId} is already GA`)

  const { authFun, bytecode } = await getContractAuthFan(this)(source, authFnName)
  const callData = await this.contractEncodeCall(source, 'init', args)

  const { tx, contractId } = await this.gaAttachTx(R.merge(opt, { ownerId, code: bytecode, callData, authFun }))

  const { hash, rawTx } = await this.send(tx, opt)

  return Object.freeze({
    owner: ownerId,
    transaction: hash,
    rawTx,
    gaContractId: contractId
  })
}

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
  // Get transaction rlp binary
  const rlpBinaryTx = decodeBase64Check(assertedType(rawTransaction, 'tx'))
  // Wrap in SIGNED tx with empty signatures
  const { rlpEncoded } = wrapInEmptySignedTx(rlpBinaryTx)
  // Prepare params for META tx
  const params = { ...opt, tx: rlpEncoded, gaId: await this.address(opt), abiVersion: ABI_VERSIONS.SOPHIA, authData: authCallData, gas }
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl } = await this.prepareTxParams(TX_TYPE.gaMeta, params)
  // Build META tx
  const { rlpEncoded: metaTxRlp } = buildTx({ ...params, fee: `${fee}`, ttl }, TX_TYPE.gaMeta)
  // Wrap in empty signed tx
  const { tx } = wrapInEmptySignedTx(metaTxRlp)
  // Send tx to the chain
  return tx
}
