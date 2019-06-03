/* eslint-disable no-unused-vars */
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
import Joi from 'joi-browser'

import AsyncInit from '../utils/async-init'
import { decode } from '../tx/builder/helpers'
import { encodeBase58Check } from '../utils/crypto'
import { toBytes } from '../utils/bytes'
import * as R from 'ramda'
import semverSatisfies from '../utils/semver-satisfies'

const SOPHIA_TYPES = [
  'int',
  'string',
  'tuple',
  'address',
  'bool',
  'list',
  'map',
  'record',
  'option',
  'oracle',
  'oracleQuery'
].reduce((acc, type) => ({ ...acc, [type]: type }), {})

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
function transformDecodedData (aci, result, { skipTransformDecoded = false, addressPrefix = 'ak', bindings } = {}) {
  if (skipTransformDecoded) return result
  const { t, generic } = readType(aci, { bindings })
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
            key = transformDecodedData(keyT, { value: key.value }, { bindings })
            val = transformDecodedData(valueT, { value: val.value }, { bindings })
            acc.push([key, val])
            return acc
          },
          []
        )
    case SOPHIA_TYPES.option:
      const [variantType, value] = result.value
      return variantType === 1 ? transformDecodedData(generic, value, { bindings }) : undefined
    case SOPHIA_TYPES.list:
      return result.value.map(({ value }) => transformDecodedData(generic, { value }, { bindings }))
    case SOPHIA_TYPES.tuple:
      return result.value.map(({ value }, i) => { return transformDecodedData(generic[i], { value }, { bindings }) })
    case SOPHIA_TYPES.record:
      return result.value.reduce(
        (acc, { name, value }, i) =>
          ({
            ...acc,
            [generic[i].name]: transformDecodedData(generic[i].type, { value }, { bindings })
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
 * @param compilerVersion
 * @param bindings
 * @return {string}
 */
async function transform (type, value, { compilerVersion, bindings } = {}) {
  let { t, generic } = readType(type, { bindings })

  // contract TestContract = ...
  // fn(ct: TestContract)
  if (typeof value === 'string' && value.slice(0, 2) === 'ct') t = SOPHIA_TYPES.address // Handle Contract address transformation

  switch (t) {
    case SOPHIA_TYPES.string:
      return `"${value}"`
    case SOPHIA_TYPES.list:
      return `[${await Promise.all(value.map(async el => transform(generic, el, { compilerVersion, bindings })))}]`
    case SOPHIA_TYPES.tuple:
      return `(${await Promise.all(value.map(async (el, i) => transform(generic[i], el, {
        compilerVersion,
        bindings
      })))})`
    case SOPHIA_TYPES.option:
      const optionV = await value.catch(e => undefined)
      return optionV === undefined ? 'None' : `Some(${await transform(generic, optionV, {
        compilerVersion,
        bindings
      })})`
    case SOPHIA_TYPES.address:
      return semverSatisfies(compilerVersion.split('-')[0], '1.0.0', '3.0.0')
        ? parseInt(value) === 0 ? '#0' : `#${decode(value).toString('hex')}`
        : value
    case SOPHIA_TYPES.record:
      return `{${await generic.reduce(
        async (acc, { name, type }, i) => {
          acc = await acc
          acc += `${i !== 0 ? ',' : ''}${name} = ${await transform(type, value[name], {
            compilerVersion,
            bindings
          })}`
          return acc
        },
        ''
      )}}`
    case SOPHIA_TYPES.map:
      return transformMap(value, generic, { compilerVersion, bindings })
  }

  return `${value}`
}

async function transformMap (value, generic, { compilerVersion, bindings }) {
  if (value instanceof Map) {
    value = Array.from(value.entries())
  }
  if (!Array.isArray(value) && value instanceof Object) {
    value = Object.entries(value)
  }

  return `{${await value
    .reduce(
      async (acc, [key, value], i) => {
        acc = await acc
        if (i !== 0) acc += ','
        acc += `[${await transform(generic[0], key, {
          compilerVersion,
          bindings
        })}] = ${await transform(generic[1], value, { compilerVersion, bindings })}`
        return acc
      },
      ``
    )
  }}`
}

function linkTypeDefs (t, bindings) {
  const [_, typeDef] = t.split('.')
  const aciType = [
    ...bindings.typedef,
    { name: 'state', typedef: bindings.state }
  ].find(({ name }) => name === typeDef)
  return aciType.typedef
}
/**
 * Parse sophia type
 * @param type
 * @param returnType
 * @return {*}
 */
function readType (type, { bindings } = {}) {
  let [t] = Array.isArray(type) ? type : [type]

  // Link State and typeDef
  if (typeof t === 'string' && t.indexOf(bindings.contractName) !== -1) {
    t = linkTypeDefs(t, bindings)
  }
  // Map, Tuple, List, Record, Bytes
  if (typeof t === 'object') {
    const [[baseType, generic]] = Object.entries(t)
    return { t: baseType, generic }
  }

  // Base types
  if (typeof t === 'string') return { t }
}

/**
 * Prepare Joi validation schema for sophia types
 * @param type
 * @param bindings
 * @return {Object} JoiSchema
 */
function prepareSchema (type, { bindings } = {}) {
  let { t, generic } = readType(type, { bindings })
  if (!Object.keys(SOPHIA_TYPES).includes(t)) t = SOPHIA_TYPES.address // Handle Contract address transformation
  switch (t) {
    case SOPHIA_TYPES.int:
      return Joi.number().error(getJoiErrorMsg)
    case SOPHIA_TYPES.string:
      return Joi.string().error(getJoiErrorMsg)
    case SOPHIA_TYPES.address:
      return Joi.alternatives([Joi.number().min(0).max(0), Joi.string().regex(/^(ak_|ct_|ok_|oq_)/).error(getJoiErrorMsg)])
    case SOPHIA_TYPES.bool:
      return Joi.boolean().error(getJoiErrorMsg)
    case SOPHIA_TYPES.list:
      return Joi.array().items(prepareSchema(generic, { bindings })).error(getJoiErrorMsg)
    case SOPHIA_TYPES.tuple:
      return Joi.array().ordered(generic.map(type => prepareSchema(type, { bindings }).required())).label('Tuple argument').error(getJoiErrorMsg)
    case SOPHIA_TYPES.record:
      return Joi.object(
        generic.reduce((acc, { name, type }) => ({ ...acc, [name]: prepareSchema(type, { bindings }) }), {})
      ).error(getJoiErrorMsg)
    case SOPHIA_TYPES.option:
      return Joi.object().type(Promise).error(getJoiErrorMsg)
    // @Todo Need to transform Map to Array of arrays before validating it
    // case SOPHIA_TYPES.map:
    //   return Joi.array().items(Joi.array().ordered(generic.map(type => prepareSchema(type))))
    default:
      return Joi.any()
  }
}

function getJoiErrorMsg (errors) {
  return errors.map(err => {
    const { path, type, context } = err
    let value = context.hasOwnProperty('value') ? context.value : context.label
    value = typeof value === 'object' ? JSON.stringify(value).slice(1).slice(0, -1) : value
    switch (type) {
      case 'string.base':
        return ({ ...err, message: `Value "${value}" at path: [${path}] not a string` })
      case 'number.base':
        return ({ ...err, message: `Value "${value}" at path: [${path}] not a number` })
      case 'boolean.base':
        return ({ ...err, message: `Value "${value}" at path: [${path}] not a boolean` })
      case 'array.base':
        return ({ ...err, message: `Value "${value}" at path: [${path}] not a array` })
      case 'object.base':
        return ({ ...err, message: `Value '${value}' at path: [${path}] not a object` })
      case 'object.type':
        return ({ ...err, message: `Value '${value}' at path: [${path}] not a ${context.type}` })
      default:
        return err
    }
  })
}

function validateArguments (aci, params) {
  const validationSchema = Joi.array().ordered(
    aci.arguments
      .map(({ type }, i) => prepareSchema(type, { bindings: aci.bindings }).label(`[${params[i]}]`))
  ).label('Argument')
  const { error } = Joi.validate(params, validationSchema, { abortEarly: false })
  if (error) {
    throw error
  }
}

/**
 * Validated contract call arguments using contract ACI
 * @function validateCallParams
 * @rtype (aci: Object, params: Array) => Object
 * @param {Object} aci Contract ACI
 * @param {Array} params Contract call arguments
 * @param compilerVersion
 * @return Promise{Array} Object with validation errors
 */
async function prepareArgsForEncode (aci, params, { compilerVersion } = {}) {
  if (!aci) return params
  // Validation
  validateArguments(aci, params)
  const bindings = aci.bindings
  // Cast argument from JS to Sophia type
  return Promise.all(aci.arguments.map(async ({ type }, i) => transform(type, params[i], {
    compilerVersion,
    bindings
  })))
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

  return {
    ...fn,
    bindings: {
      state: aci.state,
      typedef: aci.type_defs,
      contractName: aci.name
    }
  }
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
async function getContractInstance (source, { aci, contractAddress, opt } = {}) {
  aci = aci || await this.contractGetACI(source)
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
    interface: aci.interface,
    aci: aci.encoded_aci.contract,
    source,
    compiled: null,
    deployInfo: { address: contractAddress },
    options: R.merge(defaultOptions, opt),
    compilerVersion: this.compilerVersion,
    setOptions (opt) {
      this.options = R.merge(this.options, opt)
    }
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

  instance.methods = instance
    .aci
    .functions
    .reduce(
      (acc, { name }) => ({
        ...acc,
        [name]: function () {
          return name !== 'init'
            ? instance.call(name, Object.values(arguments))
            : instance.deploy(Object.values(arguments))
        }
      }),
      {}
    )

  return instance
}

// @TODO Remove after compiler can decode using type from ACI
function transformReturnType (returns, { bindings } = {}) {
  if (typeof returns === 'string' && returns.indexOf(bindings.contractName) !== -1) {
    returns = linkTypeDefs(returns, bindings)
  }
  try {
    if (typeof returns === 'string') return returns
    if (typeof returns === 'object') {
      const [[key, value]] = Object.entries(returns)
      return `${key !== 'tuple' && key !== 'record' ? key : ''}(${value
        .reduce(
          (acc, el, i) => {
            if (i !== 0) acc += ','
            acc += transformReturnType(key !== 'record' ? el : el.type, { bindings })
            return acc
          },
          '')})`
    }
  } catch (e) {
    return null
  }
}

function call (self) {
  return async function (fn, params = [], options = {}) {
    const opt = R.merge(this.options, options)
    const fnACI = getFunctionACI(this.aci, fn)
    if (!fn) throw new Error('Function name is required')
    if (!this.deployInfo.address) throw new Error('You need to deploy contract before calling!')

    params = !opt.skipArgsConvert ? await prepareArgsForEncode(fnACI, params, { compilerVersion: this.compilerVersion }) : params
    const result = opt.callStatic
      ? await self.contractCallStatic(opt.source || this.source, this.deployInfo.address, fn, params, {
        top: opt.top,
        opt
      })
      : await self.contractCall(opt.source || this.source, this.deployInfo.address, fn, params, opt)
    return {
      ...result,
      decode: async (type, decodeOptions = {}) =>
        transformDecodedData(
          fnACI.returns,
          await self.contractDecodeData(type || transformReturnType(fnACI.returns, fnACI), result.result.returnValue),
          { ...opt, ...decodeOptions, compilerVersion: this.compilerVersion, bindings: fnACI.bindings }
        )
    }
  }
}

function deploy (self) {
  return async function (init = [], options = {}) {
    const opt = R.merge(this.options, options)
    const fnACI = getFunctionACI(this.aci, 'init')
    if (!this.compiled) await this.compile()
    init = !opt.skipArgsConvert ? await prepareArgsForEncode(fnACI, init, { compilerVersion: this.compilerVersion }) : init

    const { owner, transaction, address, createdAt, result, rawTx } = await self.contractDeploy(this.compiled, opt.source || this.source, init, opt)
    this.deployInfo = { owner, transaction, address, createdAt, result, rawTx }
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
