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
 * ContractACI module
 *
 * @module @aeternity/aepp-sdk/es/contract/aci
 * @export ContractACI
 * @example import ContractACI from '@aeternity/aepp-sdk/es/contract/aci'
 */
import AsyncInit from '../utils/async-init'

/**
 * Validated contract call arguments using contract ACI
 * @function validateCallParams
 * @rtype (aci: Object, params: Array) => Object
 * @param {Object} aci Contract ACI
 * @param {Array} params Contract call arguments
 * @return {Object} Object with validation errors
 */
function validateCallParams (aci, params) {
  return true
}

/**
 * Transform contract call arguments
 * @function prepareCallParams
 * @rtype (aci: Object, params: Array) => Array
 * @param {Object} aci Contract ACI
 * @param {Array} params Contract call arguments
 * @return {Array} Object with call arguments
 */
function prepareCallParams (aci, params) {
  return params
}

// /**
//  * Genrate JS contract call functions using ACI
//  * @function generateContractJS
//  * @rtype (aci: Object) => Object
//  * @param {Object} aci Contract ACI
//  * @return {Array} Object with contract call functions
//  */
// function generateContractJS (aci) {
//   // return aci.functions
//   //   .reduce(
//   //     (acc, el) => {
//   //       const { fn } = el
//   //       acc[fn] = async (args = [], options = {}) => {
//   //         return call.bind(this)(this.source, this.deployInfo.address, fn, args, options)
//   //       }
//   //     },
//   //     {}
//   //   )
//   return {}
// }

/**
 * Get function schema from contract ACI object
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @return {Object} function ACI
 */
function getFunctionACI (aci, name) {
  const fn = aci.functions.find(f => f.name === name)
  if (!fn) throw new Error(`Function ${name} doesn't exist in contract`)

  return fn
}

/**
 * Get function schema from contract ACI object
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @return {Object} function ACI
 */
function call (self) {
  return async function (fn, params = [], options = {}) {
    const fnACI = getFunctionACI(this.aci, 'init')
    if (!fn) throw new Error('Function name is required')
    if (!this.deployInfo.address) throw new Error('You need to deploy contract before calling!')

    validateCallParams(fnACI, params)

    const result = options.callStatic
      ? self.contractCallStatic(this.interface, this.deployInfo.address, fn, prepareCallParams(params), { top: options.top, options })
      : self.contractCall(this.interface, this.deployInfo.address, fn, prepareCallParams(params), options)

    return {
      ...result,
      decode: () => self.contractDecodeData(fnACI.returnType, result.result.returnValue)
    }
  }
}

/**
 * Get function schema from contract ACI object
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @return {Object} function ACI
 */
function deploy (self) {
  return async function (init = [], options = {}) {
    const fnACI = getFunctionACI(this.aci, 'init')
    if (!this.compiled) await this.compiled

    validateCallParams(fnACI, init)

    const { owner, transaction, address, createdAt, result } = await self.contractDeploy(this.compiled, this.source, init, options)
    this.deployInfo = { owner, transaction, address, createdAt, result }
  }
}

/**
 * Get function schema from contract ACI object
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @return {Object} function ACI
 */
function compile (self) {
  return async function () {
    const { bytecode } = await self.contractCompile(this.source)
    this.compiled = bytecode
    return this
  }
}

/**
 * Generate contract ACI object with predefined js methods for contract usage
 * @param {Object} aci Contract ACI
 * @param {String} source Contract source code
 * @param {Object} options Options object
 * @return {Object} JS Contract API
 */
async function getInstance (source, { aci } = {}) {
  aci = aci || await this.contractGetACI(source)
  const instance = {
    interface: aci.interface,
    aci: aci.encoded_aci.contract,
    source,
    compiled: null,
    deployInfo: {}
  }
  instance.compile = compile(this).bind(instance)
  instance.deploy = deploy(this).bind(instance)
  instance.call = call(this).bind(instance)

  return instance
}

/**
 * Contract ACI Stamp
 *
 * @function
 * @alias module:@aeternity/aepp-sdk/es/contract/aci
 * @rtype Stamp
 * @return {Object} Contract compiler instance
 * @example ContractACI()
 */
const ContractACI = AsyncInit.compose({
  methods: {
    getInstance
  }
})

export default ContractACI
