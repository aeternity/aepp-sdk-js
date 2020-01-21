import * as R from 'ramda'
import BigNumber from 'bignumber.js'

import {
  assertedType,
  decodeBase58Check,
  decodeBase64Check,
  encodeBase58Check, encodeBase64Check,
  hash,
  salt
} from '../../utils/crypto'
import { toBytes } from '../../utils/bytes'
import {
  ID_TAG_PREFIX,
  PREFIX_ID_TAG,
  AENS_NAME_DOMAINS,
  NAME_BID_RANGES,
  NAME_BID_MAX_LENGTH,
  NAME_FEE,
  NAME_FEE_BID_INCREMENT,
  NAME_BID_TIMEOUTS,
  FATE_ABI,
  VM_TYPE
} from './schema'
import { ceil } from '../../utils/bignumber'

/**
 * JavaScript-based Transaction builder helper function's
 * @module @aeternity/aepp-sdk/es/tx/builder/helpers
 * @export TxBuilderHelper
 * @example import TxBuilderHelper from '@aeternity/aepp-sdk/es/tx/builder/helpers'
 */

export const createSalt = salt

const base64Types = ['tx', 'st', 'ss', 'pi', 'ov', 'or', 'cb', 'cs', 'ba']

/**
 * Build a contract public key
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
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
 * Build hash
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} prefix Transaction hash prefix
 * @param {Buffer} data Rlp encoded transaction buffer
 * @return {String} Transaction hash
 */
export function buildHash (prefix, data) {
  return encode(hash(data), prefix)
}

/**
 * Build a oracle query id
 * @function
 * @function* @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
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
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {number} salt
 * @return {string} Zero-padded hex string of salt
 */
export function formatSalt (salt) {
  return Buffer.from(salt.toString(16).padStart(64, '0'), 'hex')
}

/**
 * Calculate 256bits Blake2b nameId of `input`
 * as defined in https://github.com/aeternity/protocol/blob/master/AENS.md#hashing
 * @rtype (input: String) => hash: String
 * @param {String} input - Data to hash
 * @return {Buffer} Hash
 */
export function nameHash (input) {
  let buf = Buffer.allocUnsafe(32).fill(0)
  if (!input) {
    return buf
  } else {
    const labels = input.split('.')
    for (let i = 0; i < labels.length; i++) {
      buf = hash(Buffer.concat([buf, hash(labels[i])]))
    }
    return buf
  }
}

/**
 * Encode a domain name
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} name Name to encode
 * @return {String} `nm_` prefixed encoded domain name
 */
export function produceNameId (name) {
  const namespace = R.last(name.split('.'))
  if (namespace === 'chain') return encode(hash(name.toLowerCase()), 'nm')
  return encode(nameHash(name), 'nm')
}

/**
 * Generate the commitment hash by hashing the formatted salt and
 * name, base 58 encoding the result and prepending 'cm_'
 *
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @function commitmentHash
 * @category async
 * @rtype (name: String, salt?: String) => hash: Promise[String]
 * @param {String} name - Name to be registered
 * @param {Number} salt Random salt
 * @return {String} Commitment hash
 */
export function commitmentHash (name, salt = createSalt()) {
  const namespace = R.last(name.split('.'))
  if (namespace === 'chain') return `cm_${encodeBase58Check(hash(Buffer.concat([Buffer.from(name.toLowerCase()), formatSalt(salt)])))}`
  return `cm_${encodeBase58Check(hash(Buffer.concat([nameHash(name.toLowerCase()), formatSalt(salt)])))}`
}

/**
 * Decode data using the default encoding/decoding algorithm
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {string} data  An encoded and prefixed string (ex tx_..., sg_..., ak_....)
 * @param {string} type Prefix of Transaction
 * @return {Buffer} Buffer of decoded Base58check or Base64check data
 */
export function decode (data, type = '') {
  if (!type) type = data.split('_')[0]
  return base64Types.includes(type)
    ? decodeBase64Check(assertedType(data, type))
    : decodeBase58Check(assertedType(data, type))
}

/**
 * Encode data using the default encoding/decoding algorithm
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
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
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {string} hashId Encoded hash
 * @return {Buffer} Buffer Buffer with ID tag and decoded HASh
 */
export function writeId (hashId) {
  const prefix = hashId.slice(0, 2)
  const idTag = PREFIX_ID_TAG[prefix]
  if (!idTag) throw new Error(`Id tag for prefix ${prefix} not found.`)
  return Buffer.from([...toBytes(idTag), ...decode(hashId, prefix)])
}

/**
 * Utility function to read and _id type
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {Buffer} buf Data
 * @return {String} Encoided hash string with prefix
 */
export function readId (buf) {
  const tag = buf.readUIntBE(0, 1)
  const prefix = ID_TAG_PREFIX[tag]
  if (!prefix) throw new Error(`Prefix for id-tag ${tag} not found.`)
  return encode(buf.slice(1, buf.length), prefix)
}

/**
 * Utility function to convert int to bytes
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {Number|String|BigNumber} val Value
 * @return {Buffer} Buffer Buffer from number(BigEndian)
 */
export function writeInt (val) {
  return toBytes(val, true)
}

/**
 * Utility function to convert bytes to int
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {Buffer} buf Value
 * @return {String} Buffer Buffer from number(BigEndian)
 */
export function readInt (buf = Buffer.from([])) {
  return BigNumber(buf.toString('hex'), 16).toString(10)
}

/**
 * Helper function to build pointers for name update TX
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {Array} pointers - Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])
 * @return {Array} Serialized pointers array
 */
export function buildPointers (pointers) {
  return pointers.map(
    p => [
      toBytes(p.key),
      writeId(p.id)
    ]
  )
}

/**
 * Helper function to read pointers from name update TX
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {Array} pointers - Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])
 * @return {Array} Deserialize pointer array
 */
export function readPointers (pointers) {
  return pointers.map(
    ([key, id]) => Object.assign({
      key: key.toString(),
      id: readId(id)
    })
  )
}

/**
 * Is name valid
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {string} name
 * @param {boolean} [throwError=true] Throw error on invalid
 * @return Boolean
 * @throws Error
 */
export function isNameValid (name, throwError = true) {
  if ((!name || typeof name !== 'string') && throwError) throw new Error('AENS: Name must be a string')
  if (!AENS_NAME_DOMAINS.includes(R.last(name.split('.')))) {
    if (throwError) throw new Error(`AENS: Invalid name domain. Possible domains [${AENS_NAME_DOMAINS}]`)
    return false
  }
  return true
}

/**
 * What kind of a hash is this? If it begins with 'ak_' it is an
 * account key, if with 'ok_' it's an oracle key.
 *
 * @param s - the hash.
 * returns the type, or throws an exception if type not found.
 */
export function classify (s) {
  const keys = {
    ak: 'account_pubkey',
    ok: 'oracle_pubkey',
    ct: 'contract_pubkey',
    ch: 'channel'
  }

  if (!s.match(/^[a-z]{2}_.+/)) {
    throw Error('Not a valid hash')
  }

  const klass = s.substr(0, 2)
  if (klass in keys) {
    return keys[klass]
  } else {
    throw Error(`Unknown class ${klass}`)
  }
}

/**
 * Validate name pointers array
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String[]} pointers Pointers array. Allowed values is: account(ak_), oracle(ok_), contract(ct_), channel(ch_)
 * @return {Boolean}
 */
export function validatePointers (pointers = []) {
  return !pointers
    .find(p => !p || typeof p !== 'string' || !['ak', 'ok', 'ct', 'ch'].includes(p.split('_')[0]))
}

/**
 * Get the minimum name fee for a domain
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} domain the domain name to get the fee for
 * @return {String} the minimum fee for the domain auction
 */
export function getMinimumNameFee (domain) {
  const nameLength = domain.replace('.chain', '').length
  return NAME_BID_RANGES[nameLength >= NAME_BID_MAX_LENGTH ? NAME_BID_MAX_LENGTH : nameLength]
}

/**
 * Compute bid fee for AENS auction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} domain the domain name to get the fee for
 * @param {Number|String} startFee Auction start fee
 * @param {Number} [increment=0.5] Bid multiplier(In percentage, must be between 0 and 1)
 * @return {String} Bid fee
 */
export function computeBidFee (domain, startFee = NAME_FEE, increment = NAME_FEE_BID_INCREMENT) {
  if (!(Number(increment) === increment && increment % 1 !== 0)) throw new Error(`Increment must be float. Current increment ${increment}`)
  if (increment < NAME_FEE_BID_INCREMENT) throw new Error(`minimum increment percentage is ${NAME_FEE_BID_INCREMENT}`)
  return ceil(
    BigNumber(BigNumber(startFee).eq(NAME_FEE) ? getMinimumNameFee(domain) : startFee).times(BigNumber(NAME_FEE_BID_INCREMENT).plus(1))
  )
}

/**
 * Compute auction end height
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} domain the domain name to get the fee for
 * @param {Number|String} claimHeight Auction starting height
 * @return {String} Auction end height
 */
export function computeAuctionEndBlock (domain, claimHeight) {
  return R.cond([
    [R.lt(5), R.always(NAME_BID_TIMEOUTS[4].plus(claimHeight))],
    [R.lt(9), R.always(NAME_BID_TIMEOUTS[8].plus(claimHeight))],
    [R.lte(NAME_BID_MAX_LENGTH), R.always(NAME_BID_TIMEOUTS[12].plus(claimHeight))],
    [R.T, R.always(BigNumber(claimHeight))]
  ])(domain.replace('.chain', '').length).toString(10)
}

/**
 * Get contract backend by abiVersion
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {Object} { abiVersion } abiVersion Transaction abiVersion
 * @return {String} Backend
 */
export function getContractBackendFromTx ({ abiVersion } = {}) {
  return FATE_ABI.includes(parseInt(abiVersion))
    ? VM_TYPE.FATE
    : VM_TYPE.AEVM
}

/**
 * Is name accept going to auction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} name Transaction abiVersion
 * @return {Boolean}
 */
export function isAuctionName (name) {
  return name.replace('.chain', '').length < 13
}

export default {
  readPointers,
  buildPointers,
  buildContractId,
  readId,
  writeId,
  readInt,
  writeInt,
  encode,
  decode,
  commitmentHash,
  formatSalt,
  oracleQueryId,
  getContractBackendFromTx,
  createSalt,
  buildHash,
  isNameValid,
  produceNameId,
  classify,
  isAuctionName,
  validatePointers
}
