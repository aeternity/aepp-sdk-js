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
import { addressFromDecimal } from '../utils/crypto'

/**
 * Encode call data for contract call
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} code Contract source code or Contract address
 * @param {String} abi ABI('sophia', 'sophia-address')
 * @param {String} name Name of function to call
 * @param {String} args Argument's for call ('()')
 * @param {String} call Code of `call` contract(Pseudo code with __call => {name}({args}) function)
 * @return {Promise<Object>}
 */
async function encodeCall (code, abi, name, args, call) {
  return this.contractNodeEncodeCallData(code, abi, name, args, call)
}

/**
 * Static contract call(using dry-run)
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} address Contract address
 * @param {String} abi ABI('sophia', 'sophia-address')
 * @param {String} name Name of function to call
 * @param {Object} options [options={}]  Options
 * @param {String} top [options.top] Block hash ob which you want to call contract
 * @param {String} args [options.args] Argument's for call function
 * @param {String} call [options.call] Code of `call` contract(Pseudo code with __call => {name}({args}) function)
 * @param {String} options [options.options]  Transaction options (fee, ttl, gas, amount, deposit)
 * @return {Promise<Object>} Result object
 */
async function callStatic (address, abi = 'sophia-address', name, { top, args = '()', call, options = {} } = {}) {
  const opt = R.merge(this.Ae.defaults, options)

  // Prepare `call` transaction
  const tx = await this.contractCallTx(R.merge(opt, {
    callerId: await this.address(),
    contractId: address,
    callData: await this.contractEncodeCall(address, abi, name, args, call)
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
  if (returnType !== 'ok') throw new Error('Dry run error, ' + Buffer.from(returnValue.slice(2)).toString())

  return {
    result: callObj,
    decode: (type) => this.contractDecodeData(type, returnValue)
  }
}

/**
 * Decode contract call result data
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} type Data type (int, string, list,...)
 * @param {String} data call result data (cb_iwer89fjsdf2j93fjews_(ssdffsdfsdf...)
 * @return {Promise<String>} Result object
 */
async function decode (type, data) {
  const result = await this.contractNodeDecodeData(type, data)
  if (type === 'address') result.value = addressFromDecimal(result.value)
  return result
}

/**
 * Call contract function
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} code Contract source code
 * @param {String} abi ABI('sophia', 'sophia-address')
 * @param {String} address Contract address
 * @param {String} name Name of function to call
 * @param {Object} [options={}] options Options
 * @param {String} [options.args] args Argument's for call function
 * @param {String} [options.call] call Code of `call` contract(Pseudo code with __call => {name}({args}) function)
 * @param {String} [options.options] options Transaction options (fee, ttl, gas, amount, deposit)
 * @return {Promise<Object>} Result object
 */
async function call (code, abi, address, name, { args = '()', options = {}, call } = {}) {
  const opt = R.merge(this.Ae.defaults, options)

  const tx = await this.contractCallTx(R.merge(opt, {
    callerId: await this.address(),
    contractId: address,
    callData: await this.contractEncodeCall(code, abi, name, args, call)
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
    const error = Buffer.from(result.returnValue.slice(2)).toString()
    throw Object.assign(Error(`Invocation failed: ${error}`), R.merge(result, { error }))
  }
}

/**
 * Deploy contract to the node
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} code Contract source code
 * @param {String} abi ABI('sophia', 'sophia-address')
 * @param {Object} [options={}] options Options
 * @param {String} [options.initState] initState Argument's for contract init function
 * @param {String} [options.options] options Transaction options (fee, ttl, gas, amount, deposit)
 * @return {Promise<Object>} Result object
 */
async function deploy (code, abi, { initState = '()', options = {} } = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const callData = await this.contractEncodeCall(code, abi, 'init', initState)
  const ownerId = await this.address()

  const { tx, contractId } = await this.contractCreateTx(R.merge(opt, {
    callData,
    code,
    ownerId
  }))

  const { hash, rawTx } = await this.send(tx, opt)

  return Object.freeze({
    owner: ownerId,
    transaction: hash,
    rawTx,
    address: contractId,
    call: async (name, options) => this.contractCall(code, abi, contractId, name, options),
    callStatic: async (name, options) => this.contractCallStatic(contractId, 'sophia-address', name, options),
    createdAt: new Date()
  })
}

/**
 * Compile contract source code
 * @function
 * @alias module:@aeternity/aepp-sdk/es/ae/contract
 * @category async
 * @param {String} code Contract code
 * @param {Object} options Transaction options (fee, ttl, gas, amount, deposit)
 * @return {Promise<Object>} Result object
 */
async function compile (code, options = {}) {
  const o = await this.compileNodeContract(code, options)

  return Object.freeze(Object.assign({
    encodeCall: async (name, args, { call, abi }) => this.contractEncodeCall(o.bytecode, R.defaultTo('sophia', abi), name, args, call),
    // call: async (name, options = {}) => this.contractCallStatic(o.bytecode, R.defaultTo('sophia', options.abi), name, options),
    deploy: async (options = {}) => this.contractDeploy(o.bytecode, R.defaultTo('sophia', options.abi), options)
  }, o))
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
 */
const Contract = Ae.compose({
  methods: {
    contractCompile: compile,
    contractCallStatic: callStatic,
    contractDeploy: deploy,
    contractCall: call,
    contractEncodeCall: encodeCall,
    contractDecodeData: decode
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

export default Contract
