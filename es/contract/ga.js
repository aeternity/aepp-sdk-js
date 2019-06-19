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
import { ABI_VERSIONS, TX_TYPE } from '../tx/builder/schema'
import { buildTx, unpackTx } from '../tx/builder'
import * as Crypto from '../utils/crypto'

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
    await this.initAccount()
  },
  methods: {
    initAccount,
    createGeneralizeAccount,
    getContractAuthFan,
    sendMetaTx,
    prepareAuthData,
    isGA
  }
})
export default GeneralizeAccount

function isGA () {
  return !!this.gaId
}

async function initAccount () {
  this.gaId = null
  // Get Account and check if it's a GA account
  const { contractId: gaId, authFun } = await this.getAccount(await this.address())
  if (gaId) {
    this.gaId = gaId
    this.authFnName = authFun
  }
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

  if (this.isGA()) throw new Error(`Account ${ownerId} is already GA.`)

  const { authFun, bytecode } = await this.getContractAuthFan(source, authFnName)
  const callData = await this.contractEncodeCall(source, 'init', args)

  const { tx, contractId } = await this.gaAttachTx(R.merge(opt, { ownerId, code: bytecode, callData, authFun }))

  const { hash, rawTx } = await this.send(tx, opt)

  await this.initAccount()

  return Object.freeze({
    owner: ownerId,
    transaction: hash,
    rawTx,
    address: contractId
  })
}

function wrapInEmptySignedTx (rlp) {
  return buildTx({ encodedTx: rlp, signatures: [] }, TX_TYPE.signed)
}

async function sendMetaTx (rawTransaction, authData, options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  // Check if authData is callData or if it's an object prepare a callData from source and args
  const authCallData = await this.prepareAuthData(authData)
  // Get transaction rlp binary
  const rlpBinaryTx = Crypto.decodeBase64Check(Crypto.assertedType(rawTransaction, 'tx'))
  // Wrap in SIGNED tx with empty signatures
  const { rlpEncoded } = wrapInEmptySignedTx(rlpBinaryTx)
  // Prepare params for META tx
  const params = { tx: rlpEncoded, ...opt, gaId: await this.address(), abiVersion: ABI_VERSIONS.SOPHIA, authData: authCallData }
  // Calculate fee, get absolute ttl (ttl + height), get account nonce
  const { fee, ttl } = await this.prepareTxParams(TX_TYPE.gaMeta, params)
  // Build META tx
  const { rlpEncoded: metaTxRlp } = buildTx({ ...params, fee, ttl }, TX_TYPE.gaMeta)
  // Wrap in empty signed tx
  const { tx } = wrapInEmptySignedTx(metaTxRlp)
  // console.log((await unpackTx(tx)).tx.encodedTx.tx.tx.tx.encodedTx.tx)
  // Send tx to the chain
  return this.sendTransaction(tx, opt)
}

async function prepareAuthData (authData) {
  if (typeof authData === 'object') {
    if (!authData.source || !authData.args) throw new Error('Auth data must contain source code and arguments.')
    return this.contractEncodeCall(authData.source, this.authFnName, authData.args)
  }
  if (typeof authData === 'string') {
    if (authData.split('_')[0] !== 'cb') throw new Error('Auth data must be a string with "cb" prefix.')
    return authData
  }
}
