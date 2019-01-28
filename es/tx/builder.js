/* eslint-disable curly */
import { BigNumber } from 'bignumber.js'
import { rlp } from '../utils/crypto'

import {
  DEFAULT_FEE,
  FEE_BYTE_SIZE,
  FIELD_TYPES, GAS_PER_BYTE,
  PREFIX_ID_TAG,
  TX_DESERIALIZATION_SCHEMA, TX_FEE_FORMULA,
  TX_SERIALIZATION_SCHEMA, VALIDATION_MESSAGE,
  VSN
} from './schema'
import { readInt, readId, readPointers, writeId, writeInt, buildPointers, encode, decode } from './helpers'
import { toBytes } from '../utils/bytes'

const ORACLE_TTL_TYPES = {
  delta: 'delta',
  block: 'block'
}

// SERIALIZE AND DESERIALIZE PART
function deserializeField (value, type, prefix) {
  switch (type) {
    case FIELD_TYPES.int:
      return readInt(value)
    case FIELD_TYPES.id:
      return readId(value)
    case FIELD_TYPES.binary:
      return encode(value, prefix)
    case FIELD_TYPES.string:
      return value ? value.toString() : ''
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

function validateParams (params, schema) {
  const valid = schema.reduce(
    (acc, [key, type, prefix]) => Object.assign(acc, validateField(params[key], key, type, prefix)),
    {}
  )

  if (Object.keys(valid).length) {
    throw Object({
      ...(new Error('Validation Error')),
      errorData: valid,
      code: 'TX_BUILD_VALIDATION_ERROR'
    })
  }

  return true
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

// INTERFACE
/**
 * Calculate fee
 * @rtype (fee, txType, gas = 0) => String
 * @param {String|Number} fee - fee
 * @param {String} txType - Transaction type
 * @param {Options} options - Options object
 * @param {String|Number} options.gas - Gas amount
 * @param {Object} options.params - Tx params
 * @return {String|Number}
 * @example calculateFee(null, 'spendtx')
 */
export function calculateFee (fee, txType, { gas = 0, params } = {}) {
  function getGasBySize (size) {
    return GAS_PER_BYTE * (size + FEE_BYTE_SIZE)
  }

  if (!fee) {
    // TODO remove that after implement oracle fee calculation
    if (!params) return DEFAULT_FEE

    const { rlpEncoded: txWithOutFee } = buildTx(params, txType, { skipValidation: true })
    const txSize = txWithOutFee.length

    return TX_FEE_FORMULA[txType] ? TX_FEE_FORMULA[txType](gas) + getGasBySize(txSize) : DEFAULT_FEE
  }
  return fee
}

/**
 * BUILD BINARY TRANSACTION
 * */
export function buildRawTx (params, schema, { skipValidation = false } = {}) {
  // Transform params(reason is for do not break current interface of `tx`)
  params = transformParams(params)
  // Validation
  skipValidation || validateParams(params, schema)

  return schema.map(([key, fieldType, prefix]) => serializeField(params[key], fieldType, prefix))
}

/**
 * UNPACK BINARY TRANSACTION
 * */
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
 * BUILD TRANSACTION
 * */
export function buildTx (params, type, { skipValidation = false } = {}) {
  const [schema, tag] = TX_SERIALIZATION_SCHEMA[type]
  const binary = buildRawTx({ ...params, VSN, tag }, schema, { skipValidation }).filter(e => e !== undefined)

  const rlpEncoded = rlp.encode(binary)
  const tx = encode(rlpEncoded, 'tx')

  return { tx, rlpEncoded, binary }
}

/**
 * UNPACK TRANSACTION
 * */
export function unpackTx (encodedTx, fromRlpBinary = false) {
  const rlpEncoded = fromRlpBinary ? encodedTx : decode(encodedTx, 'tx')
  const binary = rlp.decode(rlpEncoded)

  const objId = readInt(binary[0])
  const [schema] = TX_DESERIALIZATION_SCHEMA[objId]

  return { tx: unpackRawTx(binary, schema), rlpEncoded, binary }
}
