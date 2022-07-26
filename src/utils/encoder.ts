import { encode as bs58Encode, decode as bs58Decode } from 'bs58';
// js extension is required for mjs build, not importing the whole package to reduce bundle size
// eslint-disable-next-line import/extensions
import Sha256 from 'sha.js/sha256.js';
import {
  DecodeError,
  ArgumentError,
  InvalidChecksumError,
  PayloadLengthError,
} from './errors';
import { concatBuffers, isKeyOfObject } from './other';
import * as Encoded from './encoder-types';
import { Encoding } from './encoder-types';

export { Encoded, Encoding };

/**
 * Calculate SHA256 hash of `input`
 * @param input - Data to hash
 * @returns Hash
 * @deprecated use `SubtleCrypto.digest` or `sha.js` package instead
 */
export function sha256hash(input: Uint8Array | string): Buffer {
  return new Sha256().update(input).digest();
}

/**
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_api_encoder.erl#L177-L202}
 */
const base64Types = [
  Encoding.ContractBytearray,
  Encoding.ContractStoreKey,
  Encoding.ContractStoreValue,
  Encoding.Transaction,
  Encoding.OracleQuery,
  Encoding.OracleResponse,
  Encoding.State,
  Encoding.Poi,
  Encoding.StateTrees,
  Encoding.CallStateTree,
  Encoding.Bytearray,
] as const;
const base58Types = [
  Encoding.KeyBlockHash,
  Encoding.MicroBlockHash,
  Encoding.BlockPofHash,
  Encoding.BlockTxHash,
  Encoding.BlockStateHash,
  Encoding.Channel,
  Encoding.ContractAddress,
  Encoding.TxHash,
  Encoding.OracleAddress,
  Encoding.OracleQueryId,
  Encoding.AccountAddress,
  Encoding.Signature,
  Encoding.Commitment,
  Encoding.PeerPubkey,
  Encoding.Name,
] as const;

/**
 * @see {@link https://github.com/aeternity/aeserialization/blob/eb68fe331bd476910394966b7f5ede7a74d37e35/src/aeser_api_encoder.erl#L261-L286}
 */
const byteSizeForType = {
  [Encoding.KeyBlockHash]: 32,
  [Encoding.MicroBlockHash]: 32,
  [Encoding.BlockPofHash]: 32,
  [Encoding.BlockTxHash]: 32,
  [Encoding.BlockStateHash]: 32,
  [Encoding.Channel]: 32,
  [Encoding.ContractAddress]: 32,
  [Encoding.TxHash]: 32,
  [Encoding.OracleAddress]: 32,
  [Encoding.OracleQueryId]: 32,
  [Encoding.AccountAddress]: 32,
  [Encoding.Signature]: 64,
  [Encoding.Commitment]: 32,
  [Encoding.PeerPubkey]: 32,
  [Encoding.State]: 32,
} as const;

function ensureValidLength(data: Uint8Array, type: Encoding): void {
  if (!isKeyOfObject(type, byteSizeForType)) return;
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

const parseType = (maybeType: unknown): [Encoding, typeof base64] => {
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
export function decode(data: Encoded.Any): Buffer {
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
export function encode<Type extends Encoding>(
  data: Uint8Array,
  type: Type,
): Encoded.Generic<Type> {
  const [, encoder] = parseType(type);
  ensureValidLength(data, type);
  return `${type}_${encoder.encode(data)}`;
}
