import { BigNumber } from 'bignumber.js'
import {
  assertedType,
  decodeBase58Check,
  decodeBase64Check,
  encodeBase58Check,
  encodeBase64Check,
  rlp
} from '../utils/crypto'
import { toBytes } from '../utils/bytes'
import {
  FIELD_TYPES,
  ID_TAG,
  TX_DESERIALIZATION_SCHEMA,
  TX_SERIALIZATION_SCHEMA,
  VSN
} from './schema'

/**
 * JavaScript-based Transaction build function''
 *
 * Will provide ability to build all type of transaction'' natively
 */

const base64Types = ['tx', 'st', 'ss', 'pi', 'ov', 'or', 'cb']

/**
 * Decode data using the default encoding/decoding algorithm
 *
 * @param {string} data  An encoded and prefixed string (ex tx_..., sg_..., ak_....)
 * @param {string} type Prefix of Transaction
 * @return {Buffer} Buffer of decoded Base58check or Base64check data
 */
function decode (data, type) {
  if (!type) type = data.split('_')[0]
  return base64Types.includes(type)
    ? decodeBase64Check(assertedType(data, type))
    : decodeBase58Check(assertedType(data, type))
}

/**
 * Encode data using the default encoding/decoding algorithm
 *
 * @param {Buffer|String} data  An decoded data
 * @param {string} type Prefix of Transaction
 * @return {String} Encoded string Base58check or Base64check data
 */
function encode (data, type) {
  return `${type}_${base64Types.includes(type)
    ? encodeBase64Check(data)
    : encodeBase58Check(data)}`
}

/**
 * Utility function to create and _id type
 * @param {string} hashId Encoded hash
 * @return {Buffer} Buffer Buffer with ID tag and decoded HASh
 */
function writeId (hashId) {
  const prefix = hashId.slice(0, 2)
  const idTag = {
    'ak': ID_TAG.account,
    'nm': ID_TAG.name,
    'cm': ID_TAG.commitment,
    'ok': ID_TAG.oracle,
    'ct': ID_TAG.contract,
    'ch': ID_TAG.channel
  }[prefix]
  return Buffer.from([...toBytes(idTag), ...decode(hashId, prefix)])
}

function readId (buf) {
  const tag = buf.readUIntBE(0, 1)
  const prefix = {
    [ID_TAG.account]: 'ak',
    [ID_TAG.name]: 'nm',
    [ID_TAG.commitment]: 'cm',
    [ID_TAG.oracle]: 'ok',
    [ID_TAG.contract]: 'ct',
    [ID_TAG.channel]: 'ch'
  }[tag]
  return encode(buf.slice(1, buf.length), prefix)
}

/**
 * Utility function to convert int to bytes
 *
 * @param {Number|String|BigNumber} val Value
 * @return {Buffer} Buffer Buffer from number(BigEndian)
 */
function writeInt (val) {
  return toBytes(val, true)
}

function readInt (buf) {
  return BigNumber(buf.toString('hex'), 16).toString(10)
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
      return value.toString()
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
    default:
      return value
  }
}

// TODO implement tx params validation
function validateField (value, type, prefix) {
  // switch (type) {
  //   case FIELD_TYPES.int:
  //     // return writeInt(value)
  //   case FIELD_TYPES.id:
  //     // return writeId(value)
  //   case FIELD_TYPES.binary:
  //     // return decode(value, prefix)
  //   case FIELD_TYPES.string:
  //     // return toBytes(value)
  // }
  return {}
}

function validateParams (params, schema) {
  return schema.reduce(
    (acc, [key, type, prefix]) => Object.assign(acc, validateField(params[key], type, prefix)),
    {}
  )
}

export function buildRawTx (params, schema) {
  const valid = validateParams(params, schema)
  // Validation
  if (Object.keys(valid).length) throw new Error(valid)

  return schema.map(([key, fieldType, prefix]) => serializeField(params[key], fieldType, prefix))
}

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

export function buildTx (params, type) {
  const [schema, tag] = TX_SERIALIZATION_SCHEMA[type]
  const binary = buildRawTx({ ...params, VSN, tag }, schema).filter(e => e !== undefined)

  const rlpEncoded = rlp.encode(binary)
  const tx = encode(rlpEncoded, 'tx')

  return { tx, rlpEncoded, binary }
}

export function unpackTx (encodedTx, fromRlpBinary = false) {
  const rlpEncoded = fromRlpBinary ? encodedTx : decode(encodedTx, 'tx')
  const binary = rlp.decode(rlpEncoded)

  const objId = readInt(binary[0])
  const [schema] = TX_DESERIALIZATION_SCHEMA[objId]

  return { tx: unpackRawTx(binary, schema), rlpEncoded, binary }
}
