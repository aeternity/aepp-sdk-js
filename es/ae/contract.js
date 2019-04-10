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
 * Contract module - routines to interact with the æternity contract
 *
 * High level documentation of the contracts are available at
 * https://github.com/aeternity/protocol/tree/master/contracts and
 *
 * @module @aeternity/aepp-sdk/es/ae/contract
 * @export Contract
 * @example import Contract from '@aeternity/aepp-sdk/es/ae/contract' (Using tree-shaking)
 * @example import { Contract } from '@aeternity/aepp-sdk' (Using bundle)
 */

import Ae from './'
import * as R from 'ramda'
import { isBase64 } from '../utils/crypto'
import ContractCompilerAPI from '../contract/compiler'
import ContractACI from '../contract/aci'
import ContractBase from '../contract'

/**
 * Handle contract call error
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {Object} result call result object
 * @throws Error Decoded error
 * @return {Promise<void>}
 */
async function handleCallError (result) {
  const error = Buffer.from(result.returnValue).toString()
  if (isBase64(error.slice(3))) {
    const decodedError = Buffer.from(error.slice(3), 'base64').toString()
    throw Object.assign(Error(`Invocation failed: ${error}. Decoded: ${decodedError}`), R.merge(result, { error, decodedError }))
  }

  const decodedError = await this.contractDecodeData('string', error)
  throw Object.assign(Error(`Invocation failed: ${error}. Decoded: ${decodedError}`), R.merge(result, { error, decodedError }))
}

/**
 * Encode call data for contract call
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} source Contract source code
 * @param {String} name Name of function to call
 * @param {Array} args Argument's for call
 * @return {Promise<String>}
 */
async function contractEncodeCall (source, name, args) {
  return this.contractEncodeCallDataAPI(source, name, args)
}

/**
 * Decode contract call result data
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} type Data type (int, string, list,...)
 * @param {String} data call result data (cb_iwer89fjsdf2j93fjews_(ssdffsdfsdf...)
 * @return {Promise<String>} Result object
 * @example
 * const decodedData = await client.contractDecodeData('string' ,'cb_sf;ls43fsdfsdf...')
 */
async function contractDecodeData (type, data) {
  return this.contractDecodeDataAPI(type, data)
}

/**
 * Static contract call(using dry-run)
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} source Contract source code
 * @param {String} address Contract address
 * @param {String} name Name of function to call
 * @param {Array} args  Argument's for call function
 * @param {Object} options [options={}]  Options
 * @param {String} top [options.top] Block hash on which you want to call contract
 * @param {String} options [options.options]  Transaction options (fee, ttl, gas, amount, deposit)
 * @return {Promise<Object>} Result object
 * @example
 * const callResult = await client.contractCallStatic(source, address, fnName, args = [], { top, options = {} })
 * {
 *   result: TX_DATA,
 *   decode: (type) => Decode call result
 * }
 */
async function contractCallStatic (source, address, name, args = [], { top, options = {} } = {}) {
  const opt = R.merge(this.Ae.defaults, options)

  // Prepare `call` transaction
  const tx = await this.contractCallTx(R.merge(opt, {
    callerId: await this.address(),
    contractId: address,
    callData: await this.contractEncodeCall(source, name, args)
  }))

  // Get block hash by height
  if (top && !isNaN(top)) {
    top = (await this.getKeyBlock(top)).hash
  }

  // Dry-run
  const [{ result: status, callObj, reason }] = (await this.txDryRun([tx], [{
    amount: opt.amount,
    pubKey: await this.address()
  }], top)).results

  // check response
  if (status !== 'ok') throw new Error('Dry run error, ' + reason)
  const { returnType, returnValue } = callObj
  if (returnType !== 'ok') {
    await this.handleCallError(callObj)
  }
  return {
    result: callObj,
    decode: (type) => this.contractDecodeData(type, returnValue)
  }
}

/**
 * Call contract function
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} source Contract source code
 * @param {String} address Contract address
 * @param {String} name Name of function to call
 * @param {Array} args Argument's for call function
 * @param {Object} options Transaction options (fee, ttl, gas, amount, deposit)
 * @return {Promise<Object>} Result object
 * @example
 * const callResult = await client.contractCall(source, address, fnName, args = [], options)
 * {
 *   hash: TX_HASH,
 *   result: TX_DATA,
 *   decode: (type) => Decode call result
 * }
 */
async function contractCall (source, address, name, args = [], options = {}) {
  const opt = R.merge(this.Ae.defaults, options)

  const tx = await this.contractCallTx(R.merge(opt, {
    callerId: await this.address(),
    contractId: address,
    callData: await this.contractEncodeCall(source, name, args)
  }))

  const { hash, rawTx } = await this.send(tx, opt)
  const result = await this.getTxInfo(hash)

  if (result.returnType === 'ok') {
    return {
      hash,
      rawTx,
      result,
      decode: (type) => this.contractDecodeData(type, result.returnValue)
    }
  } else {
    await this.handleCallError(result)
  }
}

/**
 * Deploy contract to the node
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} code Compiled contract
 * @param {String} source Contract source code
 * @param {Array} initState Arguments of contract constructor(init) function
 * @param {Object} options Transaction options (fee, ttl, gas, amount, deposit)
 * @return {Promise<Object>} Result object
 * @example
 * const deployed = await client.contractDeploy(bytecode, source, init = [], options)
 * {
 *   owner: OWNER_PUB_KEY,
 *   transaction: TX_HASH,
 *   address: CONTRACT_ADDRESS,
 *   createdAt: Date,
 *   result: DEPLOY_TX_DATA,
 *   call: (fnName, args = [], options) => Call contract function,
 *   callStatic: (fnName, args = [], options) => Static all contract function
 * }
 */
async function contractDeploy (code, source, initState = [], options = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const callData = await this.contractEncodeCall(source, 'init', initState)
  const ownerId = await this.address()

  const { tx, contractId } = await this.contractCreateTx(R.merge(opt, {
    callData,
    code,
    ownerId
  }))

  const { hash, rawTx } = await this.send(tx, opt)
  const result = await this.getTxInfo(hash)

  return Object.freeze({
    result,
    owner: ownerId,
    transaction: hash,
    rawTx,
    address: contractId,
    call: async (name, args = [], options) => this.contractCall(source, contractId, name, args, options),
    callStatic: async (name, args = [], options) => this.contractCallStatic(source, contractId, name, args, options),
    createdAt: new Date()
  })
}

/**
 * Compile contract source code
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} source Contract sourece code
 * @param {Object} options Transaction options (fee, ttl, gas, amount, deposit)
 * @return {Promise<Object>} Result object
 * @example
 * const compiled = await client.contractCompile(SOURCE_CODE)
 * {
 *   bytecode: CONTRACT_BYTE_CODE,
 *   deploy: (init = [], options = {}) => Deploy Contract,
 *   encodeCall: (fnName, args = []) => Prepare callData
 * }
 */
async function contractCompile (source, options = {}) {
  const bytecode = await this.compileContractAPI(source, options)
  return Object.freeze(Object.assign({
    encodeCall: async (name, args) => this.contractEncodeCall(source, name, args),
    deploy: async (init, options = {}) => this.contractDeploy(bytecode, source, init, options)
  }, { bytecode }))
}

/**
 * Contract Stamp
 *
 * Provide contract implementation
 * {@link module:@aeternity/aepp-sdk/es/ae--Ae} clients.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @return {Object} Contract instance
 * @example
 * import Transaction from '@aeternity/aepp-sdk/es/tx/tx
 * import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory
 * import ChainNode from '@aeternity/aepp-sdk/es/chain/node
 * import ContractCompilerAPI from '@aeternity/aepp-sdk/es/contract/compiler
 * // or using bundle
 * import {
 *   Transaction,
 *   MemoryAccount,
 *   ChainNode,
 *   ContractCompilerAPI
 * } from '@aeternity/aepp-sdk
 *
 * const ContractWithAE = await Contract
 *    .compose(Transaction, MemoryAccount, ChainNode) // AE implementation
 *    .compose(ContractCompilerAPI) // ContractBase implementation
 * const client = await ContractWithAe({ url, internalUrl, compilerUrl, keypair, ... })
 *
 */
export const Contract = Ae.compose(ContractBase, ContractACI, {
  methods: {
    contractCompile,
    contractCallStatic,
    contractDeploy,
    contractCall,
    contractEncodeCall,
    contractDecodeData,
    handleCallError
  },
  deepProps: {
    Ae: {
      defaults: {
        deposit: 0,
        vmVersion: 1,
        gasPrice: 1000000000, // min gasPrice 1e9
        amount: 0,
        gas: 1600000 - 21000,
        options: ''
      }
    }
  }
})

export const ContractWithCompiler = Contract.compose(ContractCompilerAPI)

export default ContractWithCompiler
