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
import * as R from 'ramda'

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
  'oracleQuery',
  'hash',
  'signature',
  'bytes'
].reduce((acc, type) => ({ ...acc, [type]: type }), {})

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
      return !!result
    case SOPHIA_TYPES.address:
      return result === 0
        ? 0
        : result
    case SOPHIA_TYPES.hash:
    case SOPHIA_TYPES.bytes:
    case SOPHIA_TYPES.signature:
      return result.split('#')[1]
    case SOPHIA_TYPES.map:
      const [keyT, valueT] = generic
      return result
        .reduce(
          (acc, [key, val]) => {
            key = transformDecodedData(keyT, key, { bindings })
            val = transformDecodedData(valueT, val, { bindings })
            acc.push([key, val])
            return acc
          },
          []
        )
    case SOPHIA_TYPES.option:
      if (result === 'None') return undefined
      const [[variantType, [value]]] = Object.entries(result)
      return variantType === 'Some' ? transformDecodedData(generic, value, { bindings }) : undefined
    case SOPHIA_TYPES.list:
      return result.map((value) => transformDecodedData(generic, value, { bindings }))
    case SOPHIA_TYPES.tuple:
      return result.map((value, i) => { return transformDecodedData(generic[i], value, { bindings }) })
    case SOPHIA_TYPES.record:
      const genericMap = generic.reduce((acc, val) => ({ ...acc, [val.name]: { type: val.type } }), {})
      return Object.entries(result).reduce(
        (acc, [name, value]) =>
          ({
            ...acc,
            [name]: transformDecodedData(genericMap[name].type, value, { bindings })
          }),
        {}
      )
  }
  return result
}

/**
 * Transform JS type to Sophia-type
 * @param type
 * @param value
 * @param bindings
 * @return {string}
 */
async function transform (type, value, { bindings } = {}) {
  let { t, generic } = readType(type, { bindings })

  // contract TestContract = ...
  // fn(ct: TestContract)
  if (typeof value === 'string' && value.slice(0, 2) === 'ct') t = SOPHIA_TYPES.address // Handle Contract address transformation

  switch (t) {
    case SOPHIA_TYPES.string:
      return `"${value}"`
    case SOPHIA_TYPES.list:
      return `[${await Promise.all(value.map(async el => transform(generic, el, { bindings })))}]`
    case SOPHIA_TYPES.tuple:
      return `(${await Promise.all(value.map(async (el, i) => transform(generic[i], el, {
        bindings
      })))})`
    case SOPHIA_TYPES.option:
      const optionV = await value.catch(e => undefined)
      return optionV === undefined ? 'None' : `Some(${await transform(generic, optionV, {
        bindings
      })})`
    case SOPHIA_TYPES.hash:
    case SOPHIA_TYPES.bytes:
    case SOPHIA_TYPES.signature:
      return `#${typeof value === 'string' ? value : Buffer.from(value).toString('hex')}`
    case SOPHIA_TYPES.record:
      return `{${await generic.reduce(
        async (acc, { name, type }, i) => {
          acc = await acc
          acc += `${i !== 0 ? ',' : ''}${name} = ${await transform(type, value[name], {
            bindings
          })}`
          return acc
        },
        ''
      )}}`
    case SOPHIA_TYPES.map:
      return transformMap(value, generic, { bindings })
  }

  return `${value}`
}

async function transformMap (value, generic, { bindings }) {
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
          bindings
        })}] = ${await transform(generic[1], value, { bindings })}`
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

const customJoi = Joi.extend((joi) => ({
  name: 'binary',
  base: joi.any(),
  pre (value, state, options) {
    if (options.convert && typeof value === 'string') {
      try {
        return Buffer.from(value, 'hex')
      } catch (e) { return undefined }
    }

    return Buffer.from(value)
  },
  rules: [
    {
      name: 'bufferCheck',
      params: {
        size: joi.number().required()
      },
      validate (params, value, state, options) {
        value = value === 'string' ? Buffer.from(value, 'hex') : Buffer.from(value)
        if (!Buffer.isBuffer(value)) {
          return this.createError('binary.base', { value }, state, options)
        }
        if (value.length !== params.size) {
          return this.createError('binary.bufferCheck', { value, size: params.size }, state, options)
        }

        return value
      }
    }
  ]
}))

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
      return Joi.string().regex(/^(ak_|ct_|ok_|oq_)/).error(getJoiErrorMsg)
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
    case SOPHIA_TYPES.hash:
      return customJoi.binary().bufferCheck(32).error(getJoiErrorMsg)
    case SOPHIA_TYPES.bytes:
      return customJoi.binary().bufferCheck(generic).error(getJoiErrorMsg)
    case SOPHIA_TYPES.signature:
      return customJoi.binary().bufferCheck(64).error(getJoiErrorMsg)
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
      case 'binary.bufferCheck':
        return ({
          ...err,
          message: `Value '${Buffer.from(value).toString('hex')}' at path: [${path}] not a ${context.size} bytes`
        })
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
 * @return Promise{Array} Object with validation errors
 */
async function prepareArgsForEncode (aci, params) {
  if (!aci) return params
  // Validation
  validateArguments(aci, params)
  const bindings = aci.bindings
  // Cast argument from JS to Sophia type
  return Promise.all(aci.arguments.map(async ({ type }, i) => transform(type, params[i], {
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
export async function getContractInstance (source, { client, aci, contractAddress, opt } = {}) {
  if (!client) throw new Error('Client required')
  const clients = [client]
  aci = aci || await client.contractGetACI(source)
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
    },
    setClient (client) {
      clients[0] = client
    },
    async addAccount (account, { select } = {}) {
      await clients[0].addAccount(account, { select })
    },
    getClient () {
      return clients[0]
    }
  }
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
   */
  instance.methods = instance
    .aci
    .functions
    .reduce(
      (acc, { name, arguments: args, stateful }) => ({
        ...acc,
        [name]: Object.assign(
          function () {
            const opt = arguments.length > args.length ? R.last(arguments) : {}
            if (name === 'init') return instance.deploy(Object.values(arguments), opt)
            return instance.call(name, Object.values(arguments), { ...opt, callStatic: !stateful })
          },
          {
            get: function () {
              const opt = arguments.length > args.length ? R.last(arguments) : {}
              console.log(opt)
              return instance.call(name, Object.values(arguments), { ...opt, callStatic: true })
            },
            send: function () {
              const opt = arguments.length > args.length ? R.last(arguments) : {}
              console.log(opt)
              return instance.call(name, Object.values(arguments), opt)
            }
          }
        )
      }),
      {}
    )

  return instance
}

async function call (fn, params = [], options = {}) {
  const opt = R.merge(this.options, options)
  const fnACI = getFunctionACI(this.aci, fn)
  const source = opt.source || this.source
  if (!fn) throw new Error('Function name is required')
  if (!this.deployInfo.address) throw new Error('You need to deploy contract before calling!')

  params = !opt.skipArgsConvert ? await prepareArgsForEncode(fnACI, params, { compilerVersion: this.compilerVersion }) : params
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
  init = !opt.skipArgsConvert ? await prepareArgsForEncode(fnACI, init, { compilerVersion: this.compilerVersion }) : init

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
