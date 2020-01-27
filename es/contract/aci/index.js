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
import { isAddressValid } from '../../utils/crypto'
import AsyncInit from '../../utils/async-init'
import { BigNumber } from 'bignumber.js'
import { COMPILER_LT_VERSION } from '../compiler'
import semverSatisfies from '../../utils/semver-satisfies'
import { AMOUNT, DEPOSIT, GAS, MIN_GAS_PRICE } from '../../tx/builder/schema'

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
  if (aci.arguments.length > params.length) {
    throw new Error(`Function "${aci.name}" require ${aci.arguments.length} arguments of types [${aci.arguments.map(a => JSON.stringify(a.type))}] but get [${params.map(JSON.stringify)}]`)
  }

  validateArguments(aci, params)
  const bindings = aci.bindings
  // Cast argument from JS to Sophia type
  return Promise.all(aci.arguments.map(async ({ type }, i) => transform(type, params[i], {
    bindings
  })))
}

/**
 * Generate contract ACI object with predefined js methods for contract usage - can be used for creating a reference to already deployed contracts
 * @alias module:@aeternity/aepp-sdk/es/contract/aci
 * @param {String} source Contract source code
 * @param {Object} [options={}] Options object
 * @param {String} [options.aci] Contract ACI
 * @param {String} [options.contractAddress] Contract address
 * @param {Object} [options.filesystem] Contact source external namespaces map
 * @param {Object} [options.forceCodeCheck] Don't check contract code
 * @param {Object} [options.opt] Contract options
 * @return {ContractInstance} JS Contract API
 * @example
 * const contractIns = await client.getContractInstance(sourceCode)
 * await contractIns.deploy([321]) or await contractIns.methods.init(321)
 * const callResult = await contractIns.call('setState', [123]) or await contractIns.methods.setState.send(123, options)
 * const staticCallResult = await contractIns.call('setState', [123], { callStatic: true }) or await contractIns.methods.setState.get(123, options)
 * Also you can call contract like: await contractIns.methods.setState(123, options)
 * Then sdk decide to make on-chain or static call(dry-run API) transaction based on function is stateful or not
 */
async function getContractInstance (source, { aci, contractAddress, filesystem = {}, forceCodeCheck = true, opt } = {}) {
  aci = aci || await this.contractGetACI(source, { filesystem })
  const defaultOptions = {
    skipArgsConvert: false,
    skipTransformDecoded: false,
    callStatic: false,
    deposit: DEPOSIT,
    gasPrice: MIN_GAS_PRICE, // min gasPrice 1e9
    amount: AMOUNT,
    gas: GAS,
    top: null, // using for contract call static
    waitMined: true,
    verify: false,
    filesystem
  }
  const instance = {
    interface: R.defaultTo(null, R.prop('interface', aci)),
    aci: R.defaultTo(null, R.path(['encoded_aci', 'contract'], aci)),
    source,
    compiled: null,
    deployInfo: { address: contractAddress },
    options: R.merge(defaultOptions, opt),
    compilerVersion: this.compilerVersion,
    setOptions (opt) {
      this.options = R.merge(this.options, opt)
    }
  }

  // Check for valid contract address and contract code
  if (contractAddress) {
    if (!isAddressValid(contractAddress, 'ct')) throw new Error('Invalid contract address')
    const contract = await this.getContract(contractAddress).catch(e => null)
    if (!contract || !contract.active) throw new Error(`Contract with address ${contractAddress} not found on-chain or not active`)
    // Check if we are using compiler version gte then 4.1.0(has comparing bytecode API)
    if (!forceCodeCheck && semverSatisfies(this.compilerVersion, '4.1.0', COMPILER_LT_VERSION)) {
      const onChanByteCode = (await this.getContractByteCode(contractAddress)).bytecode
      const isCorrespondingBytecode = await this.validateByteCodeAPI(onChanByteCode, instance.source, instance.options).catch(e => false)
      if (!isCorrespondingBytecode) throw new Error('Contract source do not correspond to the contract bytecode deployed on the chain')
    }
  }

  /**
   * Compile contract
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype () => ContractInstance: Object
   * @return {ContractInstance} Contract ACI object with predefined js methods for contract usage
   */
  instance.compile = compile({ client: this, instance })
  /**
   * Deploy contract
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype (init: Array, options: Object = { skipArgsConvert: false }) => ContractInstance: Object
   * @param {Array} init Contract init function arguments array
   * @param {Object} [options={}] options Options object
   * @param {Boolean} [options.skipArgsConvert=false] Skip Validation and Transforming arguments before prepare call-data
   * @return {ContractInstance} Contract ACI object with predefined js methods for contract usage
   */
  instance.deploy = deploy({ client: this, instance })
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
  instance.call = call({ client: this, instance })

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

const call = ({ client, instance }) => async (fn, params = [], options = {}) => {
  const opt = R.merge(instance.options, options)
  const fnACI = getFunctionACI(instance.aci, fn)
  const source = opt.source || instance.source

  if (!fn) throw new Error('Function name is required')
  if (!instance.deployInfo.address) throw new Error('You need to deploy contract before calling!')
  if (
    BigNumber(opt.amount).gt(0) &&
    (Object.prototype.hasOwnProperty.call(fnACI, 'payable') && !fnACI.payable)
  ) throw new Error(`You try to pay "${opt.amount}" to function "${fn}" which is not payable. Only payable function can accept tokens`)
  params = !opt.skipArgsConvert ? await prepareArgsForEncode(fnACI, params) : params
  const result = opt.callStatic
    ? await client.contractCallStatic(source, instance.deployInfo.address, fn, params, {
      top: opt.top,
      options: opt
    })
    : await client.contractCall(source, instance.deployInfo.address, fn, params, opt)
  return {
    ...result,
    decodedResult: opt.waitMined ? await transformDecodedData(
      fnACI.returns,
      await result.decode(),
      { ...opt, bindings: fnACI.bindings }
    ) : null
  }
}

const deploy = ({ client, instance }) => async (init = [], options = {}) => {
  const opt = R.merge(instance.options, options)
  const fnACI = getFunctionACI(instance.aci, 'init')
  const source = opt.source || instance.source

  if (!instance.compiled) await instance.compile(opt)
  init = !opt.skipArgsConvert ? await prepareArgsForEncode(fnACI, init) : init

  if (opt.callStatic) {
    return client.contractCallStatic(source, null, 'init', init, {
      top: opt.top,
      options: opt,
      bytecode: instance.compiled
    })
  } else {
    const { owner, transaction, address, createdAt, result, rawTx } = await client.contractDeploy(instance.compiled, opt.source || instance.source, init, opt)
    instance.deployInfo = { owner, transaction, address, createdAt, result, rawTx }
    return instance.deployInfo
  }
}

const compile = ({ client, instance }) => async (options = {}) => {
  const { bytecode } = await client.contractCompile(instance.source, { ...instance.options, ...options })
  instance.compiled = bytecode
  return instance.compiled
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
export default AsyncInit.compose({
  methods: {
    getContractInstance
  }
})
