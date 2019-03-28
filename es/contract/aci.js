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
  'tuple',
  'address',
  'bool',
  'list',
  'map'
].reduce((acc, type, i) => {
  acc[type] = type
  return acc
}, {})

/**
 * Transform JS type to Sophia-type
 * @param type
 * @param value
 * @return {string}
 */
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

/**
 * Parse sophia type
 * @param type
 * @return {*}
 */
function readType (type) {
  const i = type.indexOf('(')

  if (i === -1) return { t: type }

  // Tuple
  if (type[0] === '(') {
    return { t: SOPHIA_TYPES.tuple, generic: type.slice(1).slice(0, -1).split(',').map(e => e.trim()) }
  }

  const baseType = type.split('(')[0]
  const generic = type.slice(i + 1, type.length - 1)

  return { t: baseType, generic }
}

/**
 * Validate argument sophia-type
 * @param type
 * @param value
 * @return {*}
 */
function validate (type, value) {
  const { t } = readType(type)
  if (value === undefined || value === null) return { require: true }

  switch (t) {
    case SOPHIA_TYPES.int:
      return isNaN(value) || ['boolean'].includes(typeof value)
    case SOPHIA_TYPES.bool:
      return typeof value !== 'boolean'
    case SOPHIA_TYPES.address:
      return !(value[2] === '_' && ['ak', 'ct'].includes(value.slice(0, 2)))
    default:
      return false
  }
}

/**
 * Transform decoded data to JS type
 * @param aci
 * @param result
 * @param transformDecodedData
 * @return {*}
 */
function transformDecodedData (aci, result, { transformDecoded = true } = {}) {
  if (!transformDecoded) return result
  const { t, generic } = readType(aci.type)

  switch (t) {
    case SOPHIA_TYPES.bool:
      return !!result.value
    case SOPHIA_TYPES.map:
      const [keyT, ...valueT] = generic.split(',')
      return result.value
        .reduce(
          (acc, { key, val }, i) => {
            key = transformDecodedData({ type: keyT.toString() }, { value: key.value })
            val = transformDecodedData({ type: valueT.toString() }, { value: val.value })
            acc[i] = { key, val }
            return acc
          },
          {}
        )
    case SOPHIA_TYPES.list:
      return result.value.map(({ value }) => transformDecodedData({ type: generic }, { value }))
    case SOPHIA_TYPES.tuple:
      return result.value.map(({ value }, i) => { return transformDecodedData({ type: generic[i] }, { value }) })
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
  const validation = aci.arguments
    .map(
      ({ type }, i) => {
        return validate(type, params[i]) ? `Argument index: ${i}, value: [${params[i]}] must be of type [${type}]` : false
      }
    ).filter(e => e)
  if (validation.length) throw new Error('Validation error: ' + JSON.stringify(validation))

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
  return async function (fn, params = [], options = { skipTransformAndValidateParams: false, transformDecoded: true }) {
    const fnACI = getFunctionACI(this.aci, fn)
    if (!fn) throw new Error('Function name is required')
    if (!this.deployInfo.address) throw new Error('You need to deploy contract before calling!')

    params = !options.skipTransformAndValidateParams ? prepareArgsForEncode(fnACI, params) : params
    const result = options.callStatic
      ? await self.contractCallStatic(this.interface, this.deployInfo.address, fn, params, {
        top: options.top,
        options
      })
      : await self.contractCall(this.interface, this.deployInfo.address, fn, params, options)

    return {
      ...result,
      decode: async () => transformDecodedData(fnACI, await self.contractDecodeData(fnACI.type, result.result.returnValue), options)
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
  return async function (init = [], options = { transformAndValidate: true }) {
    const fnACI = getFunctionACI(this.aci, 'init')
    if (!this.compiled) await this.compile()

    init = options.transformAndValidate ? prepareArgsForEncode(fnACI, init) : init

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
