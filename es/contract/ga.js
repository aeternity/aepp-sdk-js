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
import { unpackTx } from '../tx/builder'
import * as R from 'ramda'
import { Contract } from '../ae/contract'

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
  },
  methods: {
    createGeneralizeAccount,
    getContractAuthFan,
    sendMetaTx,
    prepareAuthData
  }
})
export default GeneralizeAccount

async function getContractAuthFan (source, fnName) {
  const { bytecode } = await this.contractCompile(source)
  const { tx: { typeInfo } } = await unpackTx(bytecode, false, 'cb')
  if (!typeInfo[fnName]) throw new Error(`Can't find authFan for function "${fnName}"`)
  const { funHash: authFan } = typeInfo[fnName]

  return { bytecode, authFan }
}

/**
 * Create a gaAttach transaction and broadcast it to the chain
 * @param {String} authFnName - Authorization function name
 * @param {String} source - Auth contract source code
 * @param {Array} args - init arguments
 * @param {Object} options - Options
 * @return {Promise<Readonly<{result: *, owner: *, createdAt: Date, address, rawTx: *, transaction: *}>>}
 */
async function createGeneralizeAccount (authFnName, source, args, options) {
  const ownerId = await this.address()
  const opt = R.merge(this.Ae.defaults, options)
  const { authFan, bytecode } = await this.getContractAuthFan(source, authFnName)
  const callData = await this.contractEncodeCall(source, 'init', args)

  const { tx, contractId } = await this.gaAttachTx(R.merge(opt, { ownerId, code: bytecode, callData, authFan }))

  const { hash, rawTx } = await this.send(tx, opt)
  const result = await this.getTxInfo(hash)

  if (result.returnType === 'ok') {
    return Object.freeze({
      result,
      owner: ownerId,
      transaction: hash,
      rawTx,
      address: contractId,
      createdAt: new Date()
    })
  } else {
    await this.handleCallError(result)
  }
}

async function sendMetaTx (gaId, rawTransaction) { /* @TODO Not yet implemented */ }
async function prepareAuthData (txHash, nonce) { /* @TODO Not yet implemented */ }
