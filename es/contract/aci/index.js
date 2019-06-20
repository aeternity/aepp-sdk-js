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

import * as R from 'ramda'

import { validateArguments, transform, transformDecodedData } from './transformation'
import { buildContractMethods, getFunctionACI } from './helpers'

/**
 * Validated contract call arguments using contract ACI
 * @function validateCallParams
 * @rtype (aci: Object, params: Array) => Object
 * @param {Object} aci Contract ACI
 * @param {Array} params Contract call arguments
 * @return Promise{Array} Object with validation errors
 */
async function prepareArgsForEncode (aci, params) {
  if (!aci || !aci.arguments) return params
  // Validation
  validateArguments(aci, params)
  const bindings = aci.bindings
  // Cast argument from JS to Sophia type
  return Promise.all(aci.arguments.map(async ({ type }, i) => transform(type, params[i], {
    bindings
  })))
}

/**
 * Generate contract ACI object with predefined js methods for contract usage
 * @alias module:@aeternity/aepp-sdk/es/contract/aci
 * @param {String} source Contract source code
 * @param {Object} [options] Options object
 * @param {Object} [options.aci] Contract ACI
 * @param {Object} [options.contractAddress] Contract address
 * @param {Object} [options.opt] Contract options
 * @return {ContractInstance} JS Contract API
 * @example
 * const contractIns = await client.getContractInstance(sourceCode)
 * await contractIns.compile()
 * await contractIns.deploy([321])
 * const callResult = await contractIns.call('setState', [123])
 * const staticCallResult = await contractIns.call('setState', [123], { callStatic: true })
 */
export async function getContractInstance (source, { client, aci, contractAddress, opt } = {}) {
  const clients = []

  const defaultOptions = {
    skipArgsConvert: false,
    skipTransformDecoded: false,
    callStatic: false,
    deposit: 0,
    gasPrice: 1000000000, // min gasPrice 1e9
    amount: 0,
    gas: 1600000 - 21000,
    top: null, // using for contract call static
    waitMined: true,
    verify: false
  }
  const instance = {
    interface: R.defaultTo(null, R.prop('interface', aci)),
    aci: R.defaultTo(null, R.path('encoded_aci.contract', aci)),
    source,
    compiled: null,
    deployInfo: { address: contractAddress },
    options: R.merge(defaultOptions, opt),
    compilerVersion: this.compilerVersion,
    setOptions (opt) {
      this.options = R.merge(this.options, opt)
    },
    async setClient (client, { forceMethods = false } = {}) {
      if (!client) throw new Error('ACI: Client required')
      // @Todo Verify if client have valid interface
      clients[0] = client
      if (!this.aci) {
        const aci = await client.contractGetACI(source)
        // Prepend aci and interface to contract instance
        Object.assign(this, {
          aci: aci.encoded_aci.contract,
          interface: aci.interface
        })
        // Generate methods
        !forceMethods && Object.assign(this, { methods: buildContractMethods(this)() })
      }
    },
    async addAccount (account, { select } = {}) {
      await this.getClient().addAccount(account, { select })
    },
    getClient () {
      if (!clients[0]) throw new Error('ACI: Client is required')
      if (typeof clients[0] !== 'object') throw new Error('ACI: Invalid Client')
      return clients[0]
    }
  }

  /**
   * Set client if exist
   */
  client && await instance.setClient(client, { forceMethods: true })

  /**
   * Compile contract
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype () => ContractInstance: Object
   * @return {ContractInstance} Contract ACI object with predefined js methods for contract usage
   */
  instance.compile = compile.bind(instance)
  /**
   * Deploy contract
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype (init: Array, options: Object = { skipArgsConvert: false }) => ContractInstance: Object
   * @param {Array} init Contract init function arguments array
   * @param {Object} [options={}] options Options object
   * @param {Boolean} [options.skipArgsConvert=false] Skip Validation and Transforming arguments before prepare call-data
   * @return {ContractInstance} Contract ACI object with predefined js methods for contract usage
   */
  instance.deploy = deploy.bind(instance)
  /**
   * Call contract function
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype (init: Array, options: Object = { skipArgsConvert: false, skipTransformDecoded: false, callStatic: false }) => CallResult: Object
   * @param {String} fn Function name
   * @param {Array} params Array of function arguments
   * @param {Object} [options={}] Array of function arguments
   * @param {Boolean} [options.skipArgsConvert=false] Skip Validation and Transforming arguments before prepare call-data
   * @param {Boolean} [options.skipTransformDecoded=false] Skip Transform decoded data to JS type
   * @param {Boolean} [options.callStatic=false] Static function call
   * @return {Object} CallResult
   */
  instance.call = call.bind(instance)

  /**
   * Generate proto function based on contract function using Contract ACI schema
   * All function can be called like:
   * 'await contract.methods.testFunction()' -> then sdk will decide to use dry-run or send tx on-chain base on if function stateful or not.
   * Also you can manually do that:
   * `await contract.methods.testFunction.get()` -> use call-static(dry-run)
   * `await contract.methods.testFunction.send()` -> send tx on-chain
   */
  instance.methods = buildContractMethods(instance)()
  return instance
}

async function call (fn, params = [], options = {}) {
  const opt = R.merge(this.options, options)
  const fnACI = getFunctionACI(this.aci, fn)
  const source = opt.source || this.source

  if (!fn) throw new Error('Function name is required')
  if (!this.deployInfo.address) throw new Error('You need to deploy contract before calling!')

  params = !opt.skipArgsConvert ? await prepareArgsForEncode(fnACI, params) : params
  const result = opt.callStatic
    ? await this.getClient().contractCallStatic(source, this.deployInfo.address, fn, params, {
      top: opt.top,
      options: opt
    })
    : await this.getClient().contractCall(source, this.deployInfo.address, fn, params, opt)
  return {
    ...result,
    decodedResult: await transformDecodedData(
      fnACI.returns,
      await result.decode(),
      { ...opt, compilerVersion: this.compilerVersion, bindings: fnACI.bindings }
    )
  }
}

async function deploy (init = [], options = {}) {
  const opt = R.merge(this.options, options)
  const fnACI = getFunctionACI(this.aci, 'init')

  if (!this.compiled) await this.compile()
  init = !opt.skipArgsConvert ? await prepareArgsForEncode(fnACI, init) : init

  const { owner, transaction, address, createdAt, result, rawTx } = await this.getClient().contractDeploy(this.compiled, opt.source || this.source, init, opt)
  this.deployInfo = { owner, transaction, address, createdAt, result, rawTx }
  return this.deployInfo
}

async function compile () {
  const { bytecode } = await this.getClient().contractCompile(this.source)
  this.compiled = bytecode
  return this.compiled
}

export default { getContractInstance }
