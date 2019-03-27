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
import { addressFromDecimal } from '../utils/crypto'
import { decode } from '../tx/builder/helpers'

const SOPHIA_TYPES = [
  'int',
  'string',
  'address',
  'bool',
  'list',
  'map'
].reduce((acc, type, i) => {
  acc[type] = type
  return acc
}, {})

function transform (type, value) {
  const { t, generic } = readType(type)

  switch (t) {
    case SOPHIA_TYPES.string:
      return `"${value}"`
    case SOPHIA_TYPES.list:
      return `[${value.map(el => transform(generic, el))}]`
    case SOPHIA_TYPES.address:
      return `0x${decode(value, 'ak').toString('hex')}`
  }
  return `${value}`
}

function readType (type) {
  const i = type.indexOf('(')

  if (i === -1) return { t: type }

  const baseType = type.split('(')[0]
  const generic = type.slice(i + 1, type.length - 1)

  // Corner case for tuples and list -> '()' and '[1, 2]'
  // if (!Object.keys(SOPHIA_TYPES).includes(generic)) {
  //
  // }

  return { t: baseType, generic }
}

function validate (type, value) {
  const { t, generic } = readType(type)
  if (value === undefined || value === null) return { require: true }

  switch (t) {
    case SOPHIA_TYPES.int:
      return isNaN(value)
    case SOPHIA_TYPES.bool:
      return typeof value !== 'boolean'
    case SOPHIA_TYPES.list:
      // if (!Array.isArray(value)) return 'Not and Array'
      // return value.map(el => {
      //   const res = validate(generic, el)
      //   if (Array.isArray(res)) return res.includes(true)
      //   return res
      // })
      return false
    case SOPHIA_TYPES.address:
      return !(value[2] === '_' && ['ak', 'ct'].includes(value.slice(0, 2)))
    default:
      return false
  }
}

function transformDecodedData (aci, result) {
  const { t, generic } = readType(aci.type)
  console.log(t + '   |    ' + generic)

  switch (t) {
    case SOPHIA_TYPES.bool:
      return !!result.value
    case SOPHIA_TYPES.list:
      return result.value.map(({ value }) => transformDecodedData({ type: generic }, { value }))
    case SOPHIA_TYPES.address:
      return addressFromDecimal(result.value)
  }
  return result.value
}

/**
 * Validated contract call arguments using contract ACI
 * @function validateCallParams
 * @rtype (aci: Object, params: Array) => Object
 * @param {Object} aci Contract ACI
 * @param {Array} params Contract call arguments
 * @return {Array} Object with validation errors
 */
function prepareArgsForEncode (aci, params) {
  // Validation
  const validation = aci.arguments.map(({ type }, i) => validate(type, params[i])).filter(e => e)
  if (validation.length) throw new Error('Validation error: ' + validation)

  return aci.arguments.map(({ type }, i) => transform(type, params[i]))
}

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
    const fnACI = getFunctionACI(this.aci, fn)
    if (!fn) throw new Error('Function name is required')
    if (!this.deployInfo.address) throw new Error('You need to deploy contract before calling!')

    params = prepareArgsForEncode(fnACI, params)
    // console.log(params)
    const result = options.callStatic
      ? await self.contractCallStatic(this.interface, this.deployInfo.address, fn, params, {
        top: options.top,
        options
      })
      : await self.contractCall(this.interface, this.deployInfo.address, fn, params, options)

    return {
      ...result,
      decode: async () => transformDecodedData(fnACI, await self.contractDecodeData(fnACI.type, result.result.returnValue))
    }
  }
}

/**
 * Deploy Contract
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @return {Object} function ACI
 */
function deploy (self) {
  return async function (init = [], options = {}) {
    const fnACI = getFunctionACI(this.aci, 'init')
    if (!this.compiled) await self.compile()

    init = prepareArgsForEncode(fnACI, init)

    const { owner, transaction, address, createdAt, result } = await self.contractDeploy(this.compiled, this.source, init, options)
    this.deployInfo = { owner, transaction, address, createdAt, result }
  }
}

/**
 * Compile contract
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
 * @alias module:@aeternity/aepp-sdk/es/contract/aci
 * @param {String} source Contract source code
 * @param {Object} [options] Options object
 * @param {Object} [options.aci] Contract ACI
 * @return {Object} JS Contract API
 */
async function getInstance (source, { aci, contractAddress } = {}) {
  aci = aci || await this.contractGetACI(source)
  const instance = {
    interface: aci.interface,
    aci: aci.encoded_aci.contract,
    source,
    compiled: null,
    deployInfo: { address: contractAddress }
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
