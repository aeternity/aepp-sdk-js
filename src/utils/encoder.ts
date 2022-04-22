import { encode as bs58Encode, decode as bs58Decode } from 'bs58'
import { sha256 as Sha256 } from 'sha.js'
import {
  DecodeError,
  ArgumentError,
  InvalidChecksumError,
  PayloadLengthError,
  PrefixMismatchError
} from './errors'

/**
 * Calculate SHA256 hash of `input`
 * @rtype (input: String) => hash: String
 * @param {Uint8Array|String} input - Data to hash
 * @return {String} Hash
 */
export function sha256hash (input: Uint8Array | string): Buffer {
  return new Sha256().update(input).digest()
}

// based on https://github.com/aeternity/protocol/blob/master/node/api/api_encoding.md
const base64Types = ['ba', 'cb', 'or', 'ov', 'pi', 'ss', 'cs', 'ck', 'cv', 'st', 'tx']
const base58Types = ['ak', 'bf', 'bs', 'bx', 'ch', 'cm', 'ct', 'kh', 'mh', 'nm', 'ok', 'oq', 'pp', 'sg', 'th']
type EncodingType = typeof base64Types[number] | typeof base58Types[number]
// TODO: add all types with a fixed length
const typesLength: { [name in EncodingType]?: number } = {
  ak: 32,
  ct: 32,
  ok: 32
} as const

function ensureValidLength (data: Uint8Array, type: EncodingType): void {
  const reqLen = typesLength[type]
  if (reqLen == null || data.length === reqLen) return
  throw new PayloadLengthError(`Payload should be ${reqLen} bytes, got ${data.length} instead`)
}

const getChecksum = (payload: Uint8Array): Buffer =>
  sha256hash(sha256hash(payload)).slice(0, 4)

const addChecksum = (payload: Uint8Array): Buffer => {
  return Buffer.concat([payload, getChecksum(payload)])
}

function getPayload (buffer: Buffer): Buffer {
  const payload = buffer.slice(0, -4)
  if (!getChecksum(payload).equals(buffer.slice(-4))) throw new InvalidChecksumError()
  return payload
}

const base64 = {
  encode: (buffer: Uint8Array) => addChecksum(buffer).toString('base64'),
  decode: (string: string) => getPayload(Buffer.from(string, 'base64'))
}

const base58 = {
  encode: (buffer: Uint8Array) => bs58Encode(addChecksum(buffer)),
  decode: (string: string) => getPayload(bs58Decode(string))
}

const parseType = (maybeType: unknown): [EncodingType, typeof base64] => {
  const base64Type = base64Types.find(t => t === maybeType)
  if (base64Type != null) return [base64Type, base64]
  const base58Type = base58Types.find(t => t === maybeType)
  if (base58Type != null) return [base58Type, base58]
  throw new ArgumentError('prefix', `one of ${[...base58Types, ...base64Types].join(', ')}`, maybeType)
}

/**
 * Decode data using the default encoding/decoding algorithm
 * @function
 * @alias module:@aeternity/aepp-sdk/es/tx/builder/helpers
 * @param {string} data An Base58/64check encoded and prefixed string (ex tx_..., sg_..., ak_....)
 * @param {string} [requiredPrefix] Ensure that data have this prefix
 * @return {Buffer} Decoded data
 */
export function decode (data: string, requiredPrefix?: EncodingType): Buffer {
  const [prefix, encodedPayload, extra] = data.split('_')
  if (encodedPayload == null) throw new DecodeError(`Encoded string missing payload: ${data}`)
  if (extra != null) throw new DecodeError(`Encoded string have extra parts: ${data}`)
  if (requiredPrefix != null && requiredPrefix !== prefix) {
    throw new PrefixMismatchError(prefix, requiredPrefix)
  }
  const [type, { decode }] = parseType(prefix)
  const payload = decode(encodedPayload)
  ensureValidLength(payload, type)
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
export function encode (data: Uint8Array, type: EncodingType): string {
  const [, { encode }] = parseType(type)
  ensureValidLength(data, type)
  return `${type}_${encode(data)}`
}
