import { encode as bs58Encode, decode as bs58Decode } from 'bs58';
import { sha256 as Sha256 } from 'sha.js';
import {
  DecodeError,
  ArgumentError,
  InvalidChecksumError,
  PayloadLengthError,
} from './errors';
import { concatBuffers } from './other';

/**
 * Calculate SHA256 hash of `input`
 * @param input - Data to hash
 * @returns Hash
 */
export function sha256hash(input: Uint8Array | string): Buffer {
  return new Sha256().update(input).digest();
}

// based on https://github.com/aeternity/protocol/blob/master/node/api/api_encoding.md
const base64Types = ['ba', 'cb', 'or', 'ov', 'pi', 'ss', 'cs', 'ck', 'cv', 'st', 'tx'] as const;
const base58Types = ['ak', 'bf', 'bs', 'bx', 'ch', 'cm', 'ct', 'kh', 'mh', 'nm', 'ok', 'oq', 'pp', 'sg', 'th'] as const;

export type EncodingType = typeof base64Types[number] | typeof base58Types[number];
export type EncodedData<Type extends EncodingType> = `${Type}_${string}`;

/**
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_api_encoder.erl#L261-L286}
 */
const byteSizeForType: { [name in EncodingType]?: number } = {
  kh: 32,
  mh: 32,
  bf: 32,
  bx: 32,
  bs: 32,
  ch: 32,
  ct: 32,
  th: 32,
  ok: 32,
  oq: 32,
  ak: 32,
  sg: 64,
  cm: 32,
  pp: 32,
  st: 32,
} as const;

function ensureValidLength(data: Uint8Array, type: EncodingType): void {
  const reqLen = byteSizeForType[type];
  if (reqLen == null || data.length === reqLen) return;
  throw new PayloadLengthError(`Payload should be ${reqLen} bytes, got ${data.length} instead`);
}

const getChecksum = (payload: Uint8Array): Buffer => sha256hash(sha256hash(payload)).slice(0, 4);

const addChecksum = (payload: Uint8Array): Buffer => concatBuffers([payload, getChecksum(payload)]);

function getPayload(buffer: Buffer): Buffer {
  const payload = buffer.slice(0, -4);
  if (!getChecksum(payload).equals(buffer.slice(-4))) throw new InvalidChecksumError();
  return payload;
}

const base64 = {
  encode: (buffer: Uint8Array) => addChecksum(buffer).toString('base64'),
  decode: (string: string) => getPayload(Buffer.from(string, 'base64')),
};

const base58 = {
  encode: (buffer: Uint8Array) => bs58Encode(addChecksum(buffer)),
  decode: (string: string) => getPayload(Buffer.from(bs58Decode(string))),
};

const parseType = (maybeType: unknown): [EncodingType, typeof base64] => {
  const base64Type = base64Types.find((t) => t === maybeType);
  if (base64Type != null) return [base64Type, base64];
  const base58Type = base58Types.find((t) => t === maybeType);
  if (base58Type != null) return [base58Type, base58];
  throw new ArgumentError('prefix', `one of ${[...base58Types, ...base64Types].join(', ')}`, maybeType);
};

/**
 * Decode data using the default encoding/decoding algorithm
 * @param data - An Base58/64check encoded and prefixed string
 * (ex tx_..., sg_..., ak_....)
 * @returns Decoded data
 */
export function decode(data: EncodedData<EncodingType>): Buffer {
  const [prefix, encodedPayload, extra] = data.split('_');
  if (encodedPayload == null) throw new DecodeError(`Encoded string missing payload: ${data}`);
  if (extra != null) throw new DecodeError(`Encoded string have extra parts: ${data}`);
  const [type, encoder] = parseType(prefix);
  const payload = encoder.decode(encodedPayload);
  ensureValidLength(payload, type);
  return payload;
}

/**
 * Encode data using the default encoding/decoding algorithm
 * @param data - An decoded data
 * @param type - Prefix of Transaction
 * @returns Encoded string Base58check or Base64check data
 */
export function encode<Type extends EncodingType>(data: Uint8Array, type: Type): EncodedData<Type> {
  const [, encoder] = parseType(type);
  ensureValidLength(data, type);
  return `${type}_${encoder.encode(data)}`;
}
