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

import { Contract } from '../ae/contract'
import { ABI_VERSIONS, MAX_AUTH_FAN_GAS_PRICE, TX_TYPE } from '../tx/builder/schema'
import { buildTx, unpackTx } from '../tx/builder'
import * as Crypto from '../utils/crypto'
import BigNumber from 'bignumber.js'

/**
 * GeneralizeAccount Stamp
 *
 * Provide Generalize Account implementation
 * {@link module:@aeternity/aepp-sdk/es/ae/contract} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} GeneralizeAccount instance
 */
export const GeneralizeAccount = Contract.compose({
  async init () {
    // await this.initAccount()
  },
  methods: {
    createGeneralizeAccount,
    getContractAuthFan,
    sendMetaTx,
    prepareGaParams,
    isGA
  }
})
export default GeneralizeAccount

async function isGA (address) {
  const { contractId } = await this.getAccount(address)
  return !!contractId
}

async function getContractAuthFan (source, fnName) {
  const { bytecode } = await this.contractCompile(source)
  const { tx: { typeInfo } } = await unpackTx(bytecode, false, 'cb')
  if (!typeInfo[fnName]) throw new Error(`Can't find authFan for function "${fnName}"`)
  const { funHash: authFun } = typeInfo[fnName]
  return { bytecode, authFun }
}

/**
 * Create a gaAttach transaction and broadcast it to the chain
 * @param {String} authFnName - Authorization function name
 * @param {String} source - Auth contract source code
 * @param {Array} args - init arguments
 * @param {Object} options - Options
 * @return {Promise<Readonly<{result: *, owner: *, createdAt: Date, address, rawTx: *, transaction: *}>>}
 */
async function createGeneralizeAccount (authFnName, source, args, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const ownerId = await this.address()

  if (await this.isGA(ownerId)) throw new Error(`Account ${ownerId} is already GA.`)

  const { authFun, bytecode } = await this.getContractAuthFan(source, authFnName)
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

function wrapInEmptySignedTx (rlp) {
  return buildTx({ encodedTx: rlp, signatures: [] }, TX_TYPE.signed)
}

async function sendMetaTx (rawTransaction, authData, authFnName, options = {}) {
  if (!authData) throw new Error('authData is required')
  // Check if authData is callData or if it's an object prepare a callData from source and args
  const { authCallData, gas } = await this.prepareGaParams(authData, authFnName)

  const opt = R.merge(this.Ae.defaults, options)
  // Get transaction rlp binary
  const rlpBinaryTx = Crypto.decodeBase64Check(Crypto.assertedType(rawTransaction, 'tx'))
  // Wrap in SIGNED tx with empty signatures
  const { rlpEncoded } = wrapInEmptySignedTx(rlpBinaryTx)
  // Prepare params for META tx
  const params = { ...opt, tx: rlpEncoded, gaId: await this.address(), abiVersion: ABI_VERSIONS.SOPHIA, authData: authCallData, gas }
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl } = await this.prepareTxParams(TX_TYPE.gaMeta, params)
  // Build META tx
  const { rlpEncoded: metaTxRlp } = buildTx({ ...params, fee: `${fee}00`, ttl }, TX_TYPE.gaMeta)
  // Wrap in empty signed tx
  const { tx } = wrapInEmptySignedTx(metaTxRlp)
  // Send tx to the chain
  return this.sendTransaction(tx, opt)
}

async function prepareGaParams (authData, authFnName) {
  if (typeof authData !== 'object') throw new Error('AuthData must be an object')
  if (authData.gas && BigNumber(authData.gas).gt(MAX_AUTH_FAN_GAS_PRICE)) throw new Error(`the maximum gas value for ga authFun is ${MAX_AUTH_FAN_GAS_PRICE}, got ${authData.gas}`)
  const gas = authData.gas || MAX_AUTH_FAN_GAS_PRICE
  if (authData.callData) {
    if (authData.callData.split('_')[0] !== 'cb') throw new Error('Auth data must be a string with "cb" prefix.')
    return { authCallData: authData.callData, gas }
  } else {
    if (!authData.source || !authData.args) throw new Error('Auth data must contain source code and arguments.')
    return { authCallData: await this.contractEncodeCall(authData.source, authFnName, authData.args), gas }
  }
}
