import nacl from 'tweetnacl';
// js extension is required for mjs build, not importing the whole package to reduce bundle size
// eslint-disable-next-line import/extensions
import { blake2b } from 'blakejs/blake2b.js';

import { concatBuffers, isItemOfArray } from './other.js';
import { decode, Encoded, Encoding } from './encoder.js';
import { ArgumentError } from './errors.js';

/**
 * Check if address is valid
 * @param maybeAddress - Address to check
 * @category utils
 */
export function isAddressValid(maybeAddress: string): maybeAddress is Encoded.AccountAddress;
/**
 * Check if data is encoded in one of provided encodings
 * @param maybeEncoded - Data to check
 * @param encodings - Rest parameters with encodings to check against
 */
export function isAddressValid<E extends Encoding>(
  maybeEncoded: string,
  ...encodings: E[]
): maybeEncoded is Encoded.Generic<E>;
export function isAddressValid(maybeEncoded: string, ...encodings: Encoding[]): boolean {
  if (encodings.length === 0) encodings = [Encoding.AccountAddress];
  try {
    decode(maybeEncoded as Encoded.Any);
    const encoding = maybeEncoded.split('_')[0];
    if (!isItemOfArray(encoding, encodings)) {
      throw new ArgumentError(
        'Encoded string type',
        encodings.length > 1 ? `one of ${encodings.join(', ')}` : encodings[0],
        encoding,
      );
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a random salt (positive integer)
 * @returns random salt
 * @category utils
 */
export function genSalt(): number {
  const [random] = new BigUint64Array(nacl.randomBytes(8).buffer);
  return Number(random % BigInt(Number.MAX_SAFE_INTEGER));
}

/**
 * Converts a positive integer to the smallest possible
 * representation in a binary digit representation
 * @param value - Value to encode
 * @returns Encoded number
 * @category utils
 * @deprecated This function is out of the sdk scope. Copy implementation from sdk if necessary.
 */
export function encodeUnsigned(value: number): Buffer {
  const binary = Buffer.allocUnsafe(4);
  binary.writeUInt32BE(value);
  return binary.subarray(binary.findIndex((i) => i !== 0));
}

/**
 * Calculate 256bits Blake2b hash of `input`
 * @param input - Data to hash
 * @returns Hash
 * @category utils
 * @deprecated use "blakejs" package directly
 */
export function hash(input: string | Uint8Array): Buffer {
  return Buffer.from(blake2b(input, undefined, 32)); // 256 bits
}

/**
 * Verify that data was signed by account
 * @param data - Data that was signed
 * @param signature - Signature of data
 * @param address - Address of account to verify against
 * @returns is data was signed by account
 * @category utils
 */
export function verifySignature(
  data: Uint8Array,
  signature: Uint8Array,
  address: Encoded.AccountAddress,
): boolean {
  return nacl.sign.detached.verify(data, signature, decode(address));
}

export function encodeVarUInt(value: number): Buffer {
  if (value < 0xfd) {
    return Buffer.from([value]);
  }
  if (value <= 0xffff) {
    return concatBuffers([Buffer.from([0xfd]), Buffer.from(new Uint16Array([value]).buffer)]);
  }
  if (value <= 0xffffffff) {
    return concatBuffers([Buffer.from([0xfe]), Buffer.from(new Uint32Array([value]).buffer)]);
  }
  return concatBuffers([
    Buffer.from([0xff]),
    Buffer.from(new BigUint64Array([BigInt(value)]).buffer),
  ]);
}

const messagePrefix = Buffer.from('aeternity Signed Message:\n', 'utf8');
export const messagePrefixLength = encodeVarUInt(messagePrefix.length);

/**
 * Hash message
 * @param message - Message to hash
 * @returns Hash of message
 * @category utils
 */
export function hashMessage(message: string): Buffer {
  const msg = Buffer.from(message, 'utf8');
  return hash(concatBuffers([messagePrefixLength, messagePrefix, encodeVarUInt(msg.length), msg]));
}

/**
 * Verify that message was signed by address
 * @param message - Message that was signed
 * @param signature - Signature of message
 * @param address - Address to verify against
 * @returns is data was signed by address
 * @category utils
 */
export function verifyMessageSignature(
  message: string,
  signature: Uint8Array,
  address: Encoded.AccountAddress,
): boolean {
  return verifySignature(hashMessage(message), signature, address);
}
