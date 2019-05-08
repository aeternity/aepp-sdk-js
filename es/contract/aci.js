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
import { decode } from '../tx/builder/helpers'
import { encodeBase58Check } from '../utils/crypto'
import { toBytes } from '../utils/bytes'
import Joi from '@hapi/joi'

const SOPHIA_TYPES = [
  'int',
  'string',
  'tuple',
  'address',
  'bool',
  'list',
  'map',
  'record'
].reduce((acc, type, i) => {
  acc[type] = type
  return acc
}, {})

function encodeAddress (address, prefix = 'ak') {
  const addressBuffer = Buffer.from(address, 'hex')
  const encodedAddress = encodeBase58Check(addressBuffer)
  return `${prefix}_${encodedAddress}`
}
/**
 * Transform decoded data to JS type
 * @param aci
 * @param result
 * @param transformDecodedData
 * @return {*}
 */
function transformDecodedData (aci, result, { skipTransformDecoded = false, addressPrefix = 'ak' } = {}) {
  if (skipTransformDecoded) return result
  const { t, generic } = readType(aci, true)

  switch (t) {
    case SOPHIA_TYPES.bool:
      return !!result.value
    case SOPHIA_TYPES.address:
      return result.value === 0
        ? 0
        : encodeAddress(toBytes(result.value, true), addressPrefix)
    case SOPHIA_TYPES.map:
      const [keyT, valueT] = generic
      return result.value
        .reduce(
          (acc, { key, val }, i) => {
            key = transformDecodedData(keyT, { value: key.value })
            val = transformDecodedData(valueT, { value: val.value })
            acc[i] = [key, val]
            return acc
          },
          {}
        )
    case SOPHIA_TYPES.list:
      return result.value.map(({ value }) => transformDecodedData(generic, { value }))
    case SOPHIA_TYPES.tuple:
      return result.value.map(({ value }, i) => { return transformDecodedData(generic[i], { value }) })
    case SOPHIA_TYPES.record:
      return result.value.reduce(
        (acc, { name, value }, i) =>
          ({
            ...acc,
            [generic[i].name]: transformDecodedData(generic[i].type, { value })
          }),
        {}
      )
  }
  return result.value
}

/**
 * Transform JS type to Sophia-type
 * @param type
 * @param value
 * @return {string}
 */
function transform (type, value) {
  let { t, generic } = readType(type)

  // contract TestContract = ...
  // fn(ct: TestContract)
  if (typeof value === 'string' && value.slice(0, 2) === 'ct') t = SOPHIA_TYPES.address // Handle Contract address transformation

  switch (t) {
    case SOPHIA_TYPES.string:
      return `"${value}"`
    case SOPHIA_TYPES.list:
      return `[${value.map(el => transform(generic, el))}]`
    case SOPHIA_TYPES.tuple:
      return `(${value.map((el, i) => transform(generic[i], el))})`
    case SOPHIA_TYPES.address:
      return `#${decode(value).toString('hex')}`
    case SOPHIA_TYPES.record:
      return `{${generic.reduce(
        (acc, { name, type }, i) => {
          if (i !== 0) acc += ','
          acc += `${name} = ${transform(type[0], value[name])}`
          return acc
        },
        ''
      )}}`
    case SOPHIA_TYPES.map:
      return transformMap(value, generic)
  }

  return `${value}`
}

function transformMap (value, generic) {
  if (value instanceof Map) {
    value = Array.from(value.entries())
  }
  if (!Array.isArray(value) && value instanceof Object) {
    value = Object.entries(value)
  }
  return `{${value
    .reduce(
      (acc, [key, value], i) => {
        if (i !== 0) acc += ','
        acc += `[${transform(generic[0], key)}] = ${transform(generic[1], value)}`
        return acc
      },
      ``
    )
  }}`
}

/**
 * Parse sophia type
 * @param type
 * @param returnType
 * @return {*}
 */
function readType (type, returnType = false) {
  const [t] = Array.isArray(type) ? type : [type]
  // Base types
  if (typeof t === 'string') return { t }

  // Map, Tuple, List
  if (typeof t === 'object') {
    const [[baseType, generic]] = Object.entries(t)
    return { t: baseType, generic }
  }
}

/**
 * Prepare Joi validation schema for sophia types
 * @param type
 * @return {Object} JoiSchema
 */
function prepareSchema (type) {
  let { t, generic } = readType(type)
  if (!Object.keys(SOPHIA_TYPES).includes(t)) t = SOPHIA_TYPES.address // Handle Contract address transformation
  switch (t) {
    case SOPHIA_TYPES.int:
      return Joi.number().error(getJoiErrorMsg)
    case SOPHIA_TYPES.string:
      return Joi.string().error(getJoiErrorMsg)
    case SOPHIA_TYPES.address:
      return Joi.string().regex(/^(ak_|ct_)/).error(getJoiErrorMsg)
    case SOPHIA_TYPES.bool:
      return Joi.boolean().error(getJoiErrorMsg)
    case SOPHIA_TYPES.list:
      return Joi.array().items(prepareSchema(generic)).error(getJoiErrorMsg)
    case SOPHIA_TYPES.tuple:
      return Joi.array().ordered(generic.map(type => prepareSchema(type))).error(getJoiErrorMsg)
    case SOPHIA_TYPES.record:
      return Joi.object(
        generic.reduce((acc, { name, type }) => ({ ...acc, [name]: prepareSchema(type) }), {})
      ).error(getJoiErrorMsg)
    // @Todo Need to transform Map to Array of arrays before validating it
    // case SOPHIA_TYPES.map:
    //   return Joi.array().items(Joi.array().ordered(generic.map(type => prepareSchema(type))))
    default:
      return Joi.any()
  }
}

function getJoiErrorMsg (errors) {
  // console.log('eerere')
  // console.log(errors)
  return errors
  // const [err] = errors
  // switch (err.type) {
  //   case 'array.base':
  //     return `${err.context.value} must be of type array, Path to argument: [${err.path}]`
  // }
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
  if (!aci) return params
  // Validation
  const validationSchema = Joi.array().ordered(
    aci.arguments
      .map(({ type }, i) => prepareSchema(type).required())
  )
  const { error } = Joi.validate(params, validationSchema, { abortEarly: false })
  if (error) {
    throw error
  }

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
  if (!fn && name !== 'init') throw new Error(`Function ${name} doesn't exist in contract`)

  return fn
}

/**
 * Generate contract ACI object with predefined js methods for contract usage
 * @alias module:@aeternity/aepp-sdk/es/contract/aci
 * @param {String} source Contract source code
 * @param {Object} [options] Options object
 * @param {Object} [options.aci] Contract ACI
 * @return {ContractInstance} JS Contract API
 * @example
 * const contractIns = await client.getContractInstance(sourceCode)
 * await contractIns.compile()
 * await contractIns.deploy([321])
 * const callResult = await contractIns.call('setState', [123])
 * const staticCallResult = await contractIns.call('setState', [123], { callStatic: true })
 */
async function getContractInstance (source, { aci, contractAddress } = {}) {
  aci = aci || await this.contractGetACI(source)
  const instance = {
    interface: aci.interface,
    aci: aci.encoded_aci.contract,
    source,
    compiled: null,
    deployInfo: { address: contractAddress }
  }
  /**
   * Compile contract
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype () => ContractInstance: Object
   * @return {ContractInstance} Contract ACI object with predefined js methods for contract usage
   */
  instance.compile = compile(this).bind(instance)
  /**
   * Deploy contract
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype (init: Array, options: Object = { skipArgsConvert: false }) => ContractInstance: Object
   * @param {Array} init Contract init function arguments array
   * @param {Object} [options={}] options Options object
   * @param {Boolean} [options.skipArgsConvert=false] Skip Validation and Transforming arguments before prepare call-data
   * @return {ContractInstance} Contract ACI object with predefined js methods for contract usage
   */
  instance.deploy = deploy(this).bind(instance)
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
  instance.call = call(this).bind(instance)

  return instance
}

// @TODO Remove after compiler can decode using type from ACI
function transformReturnType (returns) {
  try {
    if (typeof returns === 'string') return returns
    if (typeof returns === 'object') {
      const [[key, value]] = Object.entries(returns)
      return `${key !== 'tuple' && key !== 'record' ? key : ''}(${value
        .reduce(
          (acc, el, i) => {
            if (i !== 0) acc += ','
            acc += transformReturnType(key !== 'record' ? el : el.type[0])
            return acc
          },
          '')})`
    }
  } catch (e) {
    return null
  }
}

function call (self) {
  return async function (fn, params = [], options = {
    skipArgsConvert: false,
    skipTransformDecoded: false,
    callStatic: false
  }) {
    const fnACI = getFunctionACI(this.aci, fn)
    if (!fn) throw new Error('Function name is required')
    if (!this.deployInfo.address) throw new Error('You need to deploy contract before calling!')

    params = !options.skipArgsConvert ? prepareArgsForEncode(fnACI, params) : params
    const result = options.callStatic
      ? await self.contractCallStatic(this.source, this.deployInfo.address, fn, params, {
        top: options.top,
        options
      })
      : await self.contractCall(this.source, this.deployInfo.address, fn, params, options)
    return {
      ...result,
      decode: async (type, opt = {}) =>
        transformDecodedData(
          fnACI.returns,
          await self.contractDecodeData(type || transformReturnType(fnACI.returns), result.result.returnValue),
          { ...options, ...opt }
        )
    }
  }
}

function deploy (self) {
  return async function (init = [], options = { skipArgsConvert: false }) {
    const fnACI = getFunctionACI(this.aci, 'init')
    if (!this.compiled) await this.compile()
    init = !options.skipArgsConvert ? prepareArgsForEncode(fnACI, init) : init

    const { owner, transaction, address, createdAt, result } = await self.contractDeploy(this.compiled, this.source, init, options)
    this.deployInfo = { owner, transaction, address, createdAt, result }
    return this
  }
}

function compile (self) {
  return async function () {
    const { bytecode } = await self.contractCompile(this.source)
    this.compiled = bytecode
    return this
  }
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
    getContractInstance
  }
})

export default ContractACI
