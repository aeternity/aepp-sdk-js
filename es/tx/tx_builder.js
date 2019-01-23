import { BigNumber } from 'bignumber.js'
import {
  assertedType,
  decodeBase58Check,
  decodeBase64Check,
  encodeBase58Check,
  encodeBase64Check,
  hash,
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

const ORACLE_TTL_TYPES = {
  delta: 'delta',
  block: 'block'
}
/**
 * JavaScript-based Transaction build function''
 *
 * Will provide ability to build all type of transaction'' natively
 */

const base64Types = ['tx', 'st', 'ss', 'pi', 'ov', 'or', 'cb']

/**
 * Build a contract public key
 *
 * @param {string} ownerId The public key of the owner account
 * @param {number} nonce the nonce of the transaction
 * @return {string} Contract public key
 */
export function buildContractId (ownerId, nonce) {
  const ownerIdAndNonce = Buffer.from([...decode(ownerId, 'ak'), ...toBytes(nonce)])
  const b2bHash = hash(ownerIdAndNonce)
  return encode(b2bHash, 'ct')
}

/**
 * Build a oracle query id
 *
 * @param {String} senderId The public key of the sender account
 * @param {Number} nonce the nonce of the transaction
 * @param {Number} oracleId The oracle public key
 * @return {string} Contract public key
 */
export function oracleQueryId (senderId, nonce, oracleId) {
  function _int32 (val) {
    const nonceBE = toBytes(val, true)
    return Buffer.concat([Buffer.alloc(32 - nonceBE.length), nonceBE])
  }
  const b2bHash = hash(Buffer.from([...decode(senderId, 'ak'), ..._int32(nonce), ...decode(oracleId, 'ok')]))
  return encode(b2bHash, 'oq')
}

/**
 * Format the salt into a 64-byte hex string
 *
 * @param {number} salt
 * @return {string} Zero-padded hex string of salt
 */
export function formatSalt (salt) {
  return Buffer.from(salt.toString(16).padStart(64, '0'), 'hex')
}

/**
 * Generate the commitment hash by hashing the formatted salt and
 * name, base 58 encoding the result and prepending 'cm_'
 *
 * @function commitmentHash
 * @category async
 * @rtype (name: String, salt?: String) => hash: Promise[String]
 * @param {String} name - Name to be registered
 * @param {Number} salt Random salt
 * @return {String} Commitment hash
 */
export async function commitmentHash (name, salt = createSalt()) {
  return `cm_${encodeBase58Check(hash(Buffer.concat([nameId(name), formatSalt(salt)])))}`
}

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

/**
 * Helper function to build pointers for name update TX
 *
 * @param {Array} pointers - Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])
 * @return {Array} Serialized pointers array
 */
export function buildPointers (pointers) {
  return pointers.map(
    p => [
      toBytes(p['key']),
      writeId(p['id'])
    ]
  )
}

/**
 * Helper function to read pointers from name update TX
 *
 * @param {Array} pointers - Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])
 * @return {Array} Serialized pointers array
 */
export function readPointers (pointers) {
  return pointers.map(
    ([key, id]) => Object.assign({
      key: key.toString(),
      id: readId(id)
    })
  )
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
  // return {}
}

function validateParams (params, schema) {
  return schema.reduce(
    (acc, [key, type, prefix]) => Object.assign(acc, validateField(params[key], type, prefix)),
    {}
  )
}

function transformParams (params) {
  return Object
    .entries(params)
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value
        if (key === 'oracleTtl') acc = { ...acc, oracleTtlType: value.type === ORACLE_TTL_TYPES.delta ? 0 : 1, oracleTtlValue: value.value }
        if (key === 'queryTtl') acc = { ...acc, queryTtlType: value.type === ORACLE_TTL_TYPES.delta ? 0 : 1, queryTtlValue: value.value }
        if (key === 'responseTtl') acc = { ...acc, responseTtlType: value.type === ORACLE_TTL_TYPES.delta ? 0 : 1, responseTtlValue: value.value }
        return acc
      },
      {}
    )
}

export function buildRawTx (params, schema) {
  const valid = validateParams(params, schema)
  params = transformParams(params)
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
