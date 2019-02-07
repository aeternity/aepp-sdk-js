/* eslint-disable curly */
import { BigNumber } from 'bignumber.js'
import { rlp } from '../../utils/crypto'

import {
  DEFAULT_FEE,
  FEE_BYTE_SIZE,
  FIELD_TYPES, GAS_PER_BYTE, OBJECT_ID_TX_TYPE,
  PREFIX_ID_TAG,
  TX_DESERIALIZATION_SCHEMA, TX_FEE_FORMULA,
  TX_SERIALIZATION_SCHEMA, VALIDATION_MESSAGE,
  VSN
} from './schema'
import { readInt, readId, readPointers, writeId, writeInt, buildPointers, encode, decode } from './helpers'
import { toBytes } from '../../utils/bytes'

/**
 * JavaScript-based Transaction builder
 * @module @aeternity/aepp-sdk/es/tx/builder/index
 * @export TxBuilder
 * @example import Transaction from '@aeternity/aepp-sdk/es/tx/builder/index'
 */

const ORACLE_TTL_TYPES = {
  delta: 'delta',
  block: 'block'
}

// SERIALIZE AND DESERIALIZE PART
function deserializeField (value, type, prefix) {
  if (!value) return ''
  switch (type) {
    case FIELD_TYPES.int:
      return readInt(value)
    case FIELD_TYPES.id:
      return readId(value)
    case FIELD_TYPES.binary:
      return encode(value, prefix)
    case FIELD_TYPES.string:
      return value.toString()
    case FIELD_TYPES.pointers:
      return readPointers(value)
    case FIELD_TYPES.rlpBinary:
      return unpackTx(value, true)
    default:
      return value
  }
}

function serializeField (value, type, prefix) {
  switch (type) {
    case FIELD_TYPES.int:
      return writeInt(value)
    case FIELD_TYPES.id:
      return writeId(value)
    case FIELD_TYPES.binary:
      return decode(value, prefix)
    case FIELD_TYPES.signatures:
      return value.map(Buffer.from)
    case FIELD_TYPES.string:
      return toBytes(value)
    case FIELD_TYPES.pointers:
      return buildPointers(value)
    default:
      return value
  }
}

function validateField (value, key, type, prefix) {
  const assert = (valid, params) => valid ? {} : { [key]: VALIDATION_MESSAGE[type](params) }

  // All fields are required
  if (value === undefined || value === null) return { [key]: 'Field is required' }

  // Validate type of value
  switch (type) {
    case FIELD_TYPES.int:
      return assert(!isNaN(value) || BigNumber.isBigNumber(value), { value })
    case FIELD_TYPES.id:
      return assert(PREFIX_ID_TAG[value.split('_')[0]] && value.split('_')[0] === prefix, { value, prefix })
    case FIELD_TYPES.binary:
      return assert(value.split('_')[0] === prefix, { prefix, value })
    case FIELD_TYPES.string:
      return assert(true)
    case FIELD_TYPES.pointers:
      return assert(Array.isArray(value) && !value.find(e => e !== Object(e)), { value })
    default:
      return {}
  }
}

function transformParams (params) {
  return Object
    .entries(params)
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value
        if (key === 'oracleTtl') acc = {
          ...acc,
          oracleTtlType: value.type === ORACLE_TTL_TYPES.delta ? 0 : 1,
          oracleTtlValue: value.value
        }
        if (key === 'queryTtl') acc = {
          ...acc,
          queryTtlType: value.type === ORACLE_TTL_TYPES.delta ? 0 : 1,
          queryTtlValue: value.value
        }
        if (key === 'responseTtl') acc = {
          ...acc,
          responseTtlType: value.type === ORACLE_TTL_TYPES.delta ? 0 : 1,
          responseTtlValue: value.value
        }
        return acc
      },
      {}
    )
}

function getGasBySize (size) {
  return BigNumber(GAS_PER_BYTE).times(size + FEE_BYTE_SIZE)
}

// INTERFACE

/**
 * Calculate min fee
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/index
 * @rtype (txType, { gas = 0, gasPrice = 1, params }) => String
 * @param {String} txType - Transaction type
 * @param {Options} options - Options object
 * @param {String|Number} options.gas - Gas amount
 * @param {String|Number} options.gasPrice - Gas Price(default: 1)
 * @param {Object} options.params - Tx params
 * @return {String|Number}
 * @example calculateMinFee('spendTx', { gas, gasPrice, params })
 */
export function calculateMinFee (txType, { gas = 0, gasPrice = 1, params }) {
  if (!params) return DEFAULT_FEE

  const { rlpEncoded: txWithOutFee } = buildTx(params, txType, { excludeKeys: ['fee'] })
  const txSize = txWithOutFee.length

  return TX_FEE_FORMULA[txType]
    ? BigNumber(TX_FEE_FORMULA[txType](gas)).plus(getGasBySize(txSize)).times(BigNumber(gasPrice)).toString(10)
    : DEFAULT_FEE
}

/**
 * Calculate fee
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/index
 * @rtype (fee, txType, gas = 0) => String
 * @param {String|Number} fee - fee
 * @param {String} txType - Transaction type
 * @param {Options} options - Options object
 * @param {String|Number} options.gas - Gas amount
 * @param {String|Number} options.gasPrice - Gas Price(default: 1)
 * @param {Object} options.params - Tx params
 * @return {String|Number}
 * @example calculateFee(null, 'spendTx', { gas, gasPrice, params })
 */
export function calculateFee (fee = 0, txType, { gas = 0, gasPrice = 1, params, showWarning = true } = {}) {
  if (!TX_FEE_FORMULA[txType] && showWarning) console.warn(`Can't find transaction fee formula for ${txType}, we will use DEFAULT_FEE(${DEFAULT_FEE})`)

  const minFee = calculateMinFee(txType, { params, gas, gasPrice })
  if (fee && BigNumber(minFee).gt(BigNumber(fee)) && showWarning) console.warn('Transaction fee is lower then min fee!')

  return fee || minFee
}

/**
 * Validate transaction params
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/index
 * @param {Object} params Object with tx params
 * @param {Array} schema Transaction schema
 * @return {Object} Object with validation errors
 */
export function validateParams (params, schema, { excludeKeys }) {
  return schema
    .filter(([key]) => !excludeKeys.includes(key) && key !== 'payload')
    .reduce(
      (acc, [key, type, prefix]) => Object.assign(acc, validateField(params[key], key, type, prefix)),
      {}
    )
}

/**
 * Build binary transaction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/index
 * @param {Object} params Object with tx params
 * @param {Array} schema Transaction schema
 * @param {Object} [options={}] options
 * @param {Object} [options.excludeKeys] excludeKeys Array of keys to exclude for validation and build
 * @throws {Error} Validation error
 * @return {Array} Array with binary fields of transaction
 */
export function buildRawTx (params, schema, { excludeKeys = [] } = {}) {
  // Transform params(reason is for do not break current interface of `tx`)
  params = transformParams(params)
  // Validation
  const valid = validateParams(params, schema, { excludeKeys })
  if (Object.keys(valid).length) {
    throw Object.assign(
      {
        msg: 'Validation error',
        errorData: valid,
        code: 'TX_BUILD_VALIDATION_ERROR'
      })
  }

  return schema
    .filter(([key]) => !excludeKeys.includes(key))
    .map(([key, fieldType, prefix]) => serializeField(params[key], fieldType, prefix))
}

/**
 * Unpack binary transaction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/index
 * @param {Array} binary Array with binary transaction field's
 * @param {Array} schema Transaction schema
 * @return {Object} Object with transaction field's
 */
export function unpackRawTx (binary, schema) {
  return schema
    .reduce(
      (
        acc,
        [key, fieldType, prefix],
        index
      ) => Object.assign(acc, { [key]: deserializeField(binary[index], fieldType, prefix) }),
      {}
    )
}

/**
 * Build transaction hash
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/index
 * @param {Object} params Object with tx params
 * @param {String} type Transaction type
 * @param {Object} [options={}] options
 * @param {Object} [options.excludeKeys] excludeKeys Array of keys to exclude for validation and build
 * @throws {Error} Validation error
 * @return {Object} { tx, rlpEncoded, binary } Object with tx -> Base64Check transaction hash with 'tx_' prefix, rlp encoded transaction and binary transaction
 */
export function buildTx (params, type, { excludeKeys = [] } = {}) {
  const [schema, tag] = TX_SERIALIZATION_SCHEMA[type]
  const binary = buildRawTx({ ...params, VSN, tag }, schema, { excludeKeys }).filter(e => e !== undefined)

  const rlpEncoded = rlp.encode(binary)
  const tx = encode(rlpEncoded, 'tx')

  return { tx, rlpEncoded, binary }
}

/**
 * Unpack transaction hash
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/index
 * @param {String|Array} encodedTx String or RLP encoded transaction array (if fromRlpBinary flag is true)
 * @param {Boolean} fromRlpBinary Unpack from RLP encoded transaction (default: false)
 * @return {Object} { tx, rlpEncoded, binary } Object with tx -> Object with transaction param's, rlp encoded transaction and binary transaction
 */
export function unpackTx (encodedTx, fromRlpBinary = false) {
  const rlpEncoded = fromRlpBinary ? encodedTx : decode(encodedTx, 'tx')
  const binary = rlp.decode(rlpEncoded)

  const objId = readInt(binary[0])
  const [schema] = TX_DESERIALIZATION_SCHEMA[objId]

  return { tx: { type: OBJECT_ID_TX_TYPE[objId], ...unpackRawTx(binary, schema) }, rlpEncoded, binary }
}

export default { calculateMinFee, calculateFee, unpackTx, unpackRawTx, buildTx, buildRawTx, validateParams }
