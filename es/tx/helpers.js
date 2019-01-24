import {
  assertedType,
  decodeBase58Check,
  decodeBase64Check,
  encodeBase58Check, encodeBase64Check,
  hash,
  nameId,
  salt
} from '../utils/crypto'
import { toBytes } from '../utils/bytes'
import { ID_TAG_PREFIX, PREFIX_ID_TAG } from './schema'
import { BigNumber } from 'bignumber.js'

export const createSalt = salt

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
export function decode (data, type) {
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
export function encode (data, type) {
  return `${type}_${base64Types.includes(type)
    ? encodeBase64Check(data)
    : encodeBase58Check(data)}`
}

/**
 * Utility function to create and _id type
 * @param {string} hashId Encoded hash
 * @return {Buffer} Buffer Buffer with ID tag and decoded HASh
 */
export function writeId (hashId) {
  const prefix = hashId.slice(0, 2)
  const idTag = PREFIX_ID_TAG[prefix]
  if (!idTag) throw new Error(`Id tag for prefix ${prefix} not found.`)
  return Buffer.from([...toBytes(idTag), ...decode(hashId, prefix)])
}

export function readId (buf) {
  const tag = buf.readUIntBE(0, 1)
  const prefix = ID_TAG_PREFIX[tag]
  if (!prefix) throw new Error(`Prefix for id-tag ${tag} not found.`)
  return encode(buf.slice(1, buf.length), prefix)
}

/**
 * Utility function to convert int to bytes
 *
 * @param {Number|String|BigNumber} val Value
 * @return {Buffer} Buffer Buffer from number(BigEndian)
 */
export function writeInt (val) {
  return toBytes(val, true)
}

export function readInt (buf) {
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
