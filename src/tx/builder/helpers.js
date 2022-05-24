import BigNumber from 'bignumber.js'
import { hash, salt } from '../../utils/crypto'
import { encode, decode } from '../../utils/encoder'
import { toBytes } from '../../utils/bytes'
import { concatBuffers } from '../../utils/other'
import {
  ID_TAG_PREFIX,
  PREFIX_ID_TAG,
  NAME_BID_RANGES,
  NAME_FEE_BID_INCREMENT,
  NAME_BID_TIMEOUTS,
  NAME_MAX_LENGTH_FEE,
  POINTER_KEY_BY_PREFIX
} from './constants'
import { ceil } from '../../utils/bignumber'
import {
  TagNotFoundError,
  PrefixNotFoundError,
  InvalidNameError,
  IllegalBidFeeError,
  NoDefaultAensPointerError,
  ArgumentError
} from '../../utils/errors'

/**
 * JavaScript-based Transaction builder helper function's
 * @module @aeternity/aepp-sdk/es/tx/builder/helpers
 * @example import { buildContractId } from '@aeternity/aepp-sdk'
 */

export const createSalt = salt

export { encode, decode }

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
    return concatBuffers([Buffer.alloc(32 - nonceBE.length), nonceBE])
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
 * Encode an AENS name
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} name Name to encode
 * @return {String} `nm_` prefixed encoded AENS name
 */
export function produceNameId (name) {
  ensureNameValid(name)
  return encode(hash(name.toLowerCase()), 'nm')
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
  ensureNameValid(name)
  return encode(hash(concatBuffers([Buffer.from(name.toLowerCase()), formatSalt(salt)])), 'cm')
}

/**
 * Utility function to create and _id type
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {string} hashId Encoded hash
 * @return {Buffer} Buffer Buffer with ID tag and decoded HASh
 */
export function writeId (hashId) {
  if (typeof hashId !== 'string') throw new ArgumentError('hashId', 'a string', hashId)
  const prefix = hashId.slice(0, 2)
  const idTag = PREFIX_ID_TAG[prefix]
  if (!idTag) throw new TagNotFoundError(prefix)
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
  const tag = Buffer.from(buf).readUIntBE(0, 1)
  const prefix = ID_TAG_PREFIX[tag]
  if (!prefix) throw new PrefixNotFoundError(tag)
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
  return new BigNumber(Buffer.from(buf).toString('hex'), 16).toString(10)
}

/**
 * Helper function to build pointers for name update TX
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {Array} pointers - Array of pointers
 * ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])
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
 * @param {Array} pointers - Array of pointers
 * ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ])
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

const AENS_SUFFIX = '.chain'

/**
 * Ensure that AENS name is valid
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {string} name
 * @return void
 * @throws Error
 */
export function ensureNameValid (name) {
  if (!name || typeof name !== 'string') throw new InvalidNameError('Name must be a string')
  if (!name.endsWith(AENS_SUFFIX)) throw new InvalidNameError(`Name should end with ${AENS_SUFFIX}: ${name}`)
}

/**
 * Is AENS name valid
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {string} name
 * @return Boolean
 */
export function isNameValid (name) {
  try {
    ensureNameValid(name)
    return true
  } catch (error) {
    return false
  }
}

/**
 * @param identifier - account/oracle/contract address, or channel
 * @returns {String} default AENS pointer key
 * @throws exception when default key not defined
 */
export function getDefaultPointerKey (identifier) {
  decode(identifier)
  const prefix = identifier.substr(0, 2)
  return POINTER_KEY_BY_PREFIX[prefix] ||
    (() => { throw new NoDefaultAensPointerError(prefix) })()
}

/**
 * Get the minimum AENS name fee
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} name the AENS name to get the fee for
 * @return {String} the minimum fee for the AENS name auction
 */
export function getMinimumNameFee (name) {
  ensureNameValid(name)
  const nameLength = name.length - AENS_SUFFIX.length
  return NAME_BID_RANGES[Math.min(nameLength, NAME_MAX_LENGTH_FEE)]
}

/**
 * Compute bid fee for AENS auction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} name the AENS name to get the fee for
 * @param {Number|String} startFee Auction start fee
 * @param {Number} [increment=0.5] Bid multiplier(In percentage, must be between 0 and 1)
 * @return {String} Bid fee
 */
export function computeBidFee (name, startFee, increment = NAME_FEE_BID_INCREMENT) {
  if (!(Number(increment) === increment && increment % 1 !== 0)) throw new IllegalBidFeeError(`Increment must be float. Current increment ${increment}`)
  if (increment < NAME_FEE_BID_INCREMENT) throw new IllegalBidFeeError(`minimum increment percentage is ${NAME_FEE_BID_INCREMENT}`)
  return ceil(
    BigNumber(startFee ?? getMinimumNameFee(name)).times(BigNumber(NAME_FEE_BID_INCREMENT).plus(1))
  )
}

/**
 * Compute auction end height
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} name
 * @param {Number|String} claimHeight Auction starting height
 * @return {String} Auction end height
 */
export function computeAuctionEndBlock (name, claimHeight) {
  ensureNameValid(name)
  const length = name.length - AENS_SUFFIX.length
  const h = (length <= 4 && NAME_BID_TIMEOUTS[4]) ||
    (length <= 8 && NAME_BID_TIMEOUTS[8]) ||
    (length <= 12 && NAME_BID_TIMEOUTS[12]) ||
    NAME_BID_TIMEOUTS[13]
  return h.plus(claimHeight).toString(10)
}

/**
 * Is name accept going to auction
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {String} name
 * @return {Boolean}
 */
export function isAuctionName (name) {
  ensureNameValid(name)
  return name.length < 13 + AENS_SUFFIX.length
}
