import { encode as bs58Encode, decode as bs58Decode } from 'bs58'
import { sha256 as Sha256 } from 'sha.js'
import {
  DecodeError,
  EncodeError,
  InvalidChecksumError,
  PayloadLengthError,
  PrefixMismatchError
} from './errors'

/**
 * Calculate SHA256 hash of `input`
 * @rtype (input: String) => hash: String
 * @param {Buffer|String} input - Data to hash
 * @return {String} Hash
 */
export function sha256hash (input: Buffer | string) {
  return new Sha256().update(input).digest()
}

// based on https://github.com/aeternity/protocol/blob/master/node/api/api_encoding.md
const base64Types = ['ba', 'cb', 'or', 'ov', 'pi', 'ss', 'cs', 'ck', 'cv', 'st', 'tx']
const base58Types = ['ak', 'bf', 'bs', 'bx', 'ch', 'cm', 'ct', 'kh', 'mh', 'nm', 'ok', 'oq', 'pp', 'sg', 'th']
// TODO: add all types with a fixed length
const typesLength: { [name: string]: number } = {
  ak: 32,
  ct: 32,
  ok: 32
} as const

function ensureValidLength (data: Buffer | string, type: string) {
  if (!typesLength[type]) return
  if (data.length === typesLength[type]) return
  throw new PayloadLengthError(`Payload should be ${typesLength[type]} bytes, got ${data.length} instead`)
}

const getChecksum = (payload: Buffer | string) => sha256hash(sha256hash(payload)).slice(0, 4)

const addChecksum = (input: Buffer | string) => {
  const payload = Buffer.from(input)
  return Buffer.concat([payload, getChecksum(payload)])
}

function getPayload (buffer: Buffer) {
  const payload = buffer.slice(0, -4)
  if (!getChecksum(payload).equals(buffer.slice(-4))) throw new InvalidChecksumError()
  return payload
}

const base64 = {
  encode: (buffer: Buffer | string) => addChecksum(buffer).toString('base64'),
  decode: (string: string) => getPayload(Buffer.from(string, 'base64'))
}

const base58 = {
  encode: (buffer: Buffer | string) => bs58Encode(addChecksum(buffer)),
  decode: (string: string) => getPayload(bs58Decode(string))
}

/**
 * Decode data using the default encoding/decoding algorithm
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {string} data An Base58/64check encoded and prefixed string (ex tx_..., sg_..., ak_....)
 * @param {string} [requiredPrefix] Ensure that data have this prefix
 * @return {Buffer} Decoded data
 */
export function decode (data: string, requiredPrefix?: string) {
  const [prefix, encodedPayload, extra] = data.split('_')
  if (!encodedPayload) throw new DecodeError(`Encoded string missing payload: ${data}`)
  if (extra) throw new DecodeError(`Encoded string have extra parts: ${data}`)
  if (requiredPrefix && requiredPrefix !== prefix) {
    throw new PrefixMismatchError(prefix, requiredPrefix)
  }
  const decoder = (base64Types.includes(prefix) && base64.decode) ||
    (base58Types.includes(prefix) && base58.decode)
  if (!decoder) {
    throw new DecodeError(`Encoded string have unknown type: ${prefix}`)
  }
  const payload = decoder(encodedPayload)
  ensureValidLength(payload, prefix)
  return payload
}

/**
 * Encode data using the default encoding/decoding algorithm
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {Buffer|String} data  An decoded data
 * @param {string} type Prefix of Transaction
 * @return {String} Encoded string Base58check or Base64check data
 */
export function encode (data: Buffer | string, type: string) {
  const encoder = (base64Types.includes(type) && base64.encode) ||
    (base58Types.includes(type) && base58.encode)
  if (!encoder) {
    throw new EncodeError(`Unknown type: ${type}`)
  }
  ensureValidLength(data, type)
  return `${type}_${encoder(data)}`
}
