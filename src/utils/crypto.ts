import nacl, { SignKeyPair } from 'tweetnacl';
// js extension is required for mjs build, not importing the whole package to reduce bundle size
// eslint-disable-next-line import/extensions
import { blake2b } from 'blakejs/blake2b.js';
import { encode as varuintEncode } from 'varuint-bitcoin';

import { concatBuffers } from './other';
import {
  decode, encode, Encoded, Encoding,
} from './encoder';
import { ArgumentError } from './errors';

/**
 * Generate address from secret key
 * @param secret - Private key as hex string
 * @returns Public key encoded as address
 */
export function getAddressFromPriv(secret: string | Uint8Array): Encoded.AccountAddress {
  const secretBuffer = typeof secret === 'string' ? Buffer.from(secret, 'hex') : secret;
  const keys = nacl.sign.keyPair.fromSecretKey(secretBuffer);
  return encode(keys.publicKey, Encoding.AccountAddress);
}

/**
 * Check if address is valid
 * @param address - Address
 * @param prefix - Transaction prefix. Default: 'ak'
 * @returns is valid
 */
export function isAddressValid(
  address: string,
  prefix: Encoding = Encoding.AccountAddress,
): boolean {
  try {
    decode(address as Encoded.Generic<typeof prefix>);
    const actualPrefix = address.split('_')[0];
    if (actualPrefix !== prefix) {
      throw new ArgumentError('Encoded string type', prefix, actualPrefix);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Generate a random salt (positive integer)
 * @returns random salt
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
 */
export function encodeUnsigned(value: number): Buffer {
  const binary = Buffer.allocUnsafe(4);
  binary.writeUInt32BE(value);
  return binary.slice(binary.findIndex((i) => i !== 0));
}

/**
 * Calculate 256bits Blake2b hash of `input`
 * @param input - Data to hash
 * @returns Hash
 */
export function hash(input: string | Uint8Array): Buffer {
  return Buffer.from(blake2b(input, undefined, 32)); // 256 bits
}

// Todo Duplicated in tx builder. remove
/**
 * Compute contract address
 * @category contract
 * @param owner - Address of contract owner
 * @param nonce - Round when contract was created
 * @returns Contract address
 */
export function encodeContractAddress(
  owner: Encoded.AccountAddress,
  nonce: number,
): Encoded.ContractAddress {
  const publicKey = decode(owner);
  const binary = concatBuffers([publicKey, encodeUnsigned(nonce)]);
  return encode(hash(binary), Encoding.ContractAddress);
}

// KEY-PAIR HELPERS

/**
 * Generate keyPair from secret key
 * @param secret - secret key
 * @returns Object with Private(privateKey) and Public(publicKey) keys
 */
export function generateKeyPairFromSecret(secret: Uint8Array): SignKeyPair {
  return nacl.sign.keyPair.fromSecretKey(secret);
}

/**
 * Generate a random ED25519 keypair
 * @param raw - Whether to return raw (binary) keys
 * @returns Key pair
 */
export function generateKeyPair(raw: true): { publicKey: Buffer; secretKey: Buffer };
export function generateKeyPair(raw?: false): {
  publicKey: Encoded.AccountAddress; secretKey: string;
};
export function generateKeyPair(raw = false): {
  publicKey: Encoded.AccountAddress | Buffer;
  secretKey: string | Buffer;
} {
  const keyPair = nacl.sign.keyPair();
  const publicBuffer = Buffer.from(keyPair.publicKey);
  const secretBuffer = Buffer.from(keyPair.secretKey);

  if (raw) {
    return {
      publicKey: publicBuffer,
      secretKey: secretBuffer,
    };
  }
  return {
    publicKey: encode(publicBuffer, Encoding.AccountAddress),
    secretKey: secretBuffer.toString('hex'),
  };
}

// SIGNATURES

/**
 * Generate signature
 * @param data - Data to sign
 * @param privateKey - Key to sign with
 * @returns Signature
 */
export function sign(data: string | Uint8Array, privateKey: string | Uint8Array): Uint8Array {
  return nacl.sign.detached(Buffer.from(data), Buffer.from(privateKey));
}

/**
 * Verify that signature was signed by public key
 * @param data - Data that was signed
 * @param signature - Signature of data
 * @param address - Address to verify against
 * @returns is data was signed by address
 */
export function verify(
  data: Uint8Array,
  signature: Uint8Array,
  address: Encoded.AccountAddress,
): boolean {
  return nacl.sign.detached.verify(data, signature, decode(address));
}

const messagePrefix = Buffer.from('aeternity Signed Message:\n', 'utf8');
export const messagePrefixLength = varuintEncode(messagePrefix.length);

// TODO: consider rename to hashMessage
export function messageToHash(message: string): Buffer {
  const msg = Buffer.from(message, 'utf8');
  return hash(concatBuffers([messagePrefixLength, messagePrefix, varuintEncode(msg.length), msg]));
}

export function signMessage(message: string, privateKey: string | Buffer): Uint8Array {
  return sign(messageToHash(message), privateKey);
}

/**
 * Verify that message was signed by address
 * @param message - Message that was signed
 * @param signature - Signature of message
 * @param address - Address to verify against
 * @returns is data was signed by address
 */
// TODO: deprecate in favour of `verify(messageToHash(message), ...`, also the name is confusing
// it should contain "signature"
export function verifyMessage(
  message: string,
  signature: Uint8Array,
  address: Encoded.AccountAddress,
): boolean {
  return verify(messageToHash(message), signature, address);
}

/**
 * Check key pair for validity
 *
 * Signs a message, and then verifies that signature
 * @param privateKey - Private key to verify
 * @param publicKey - Public key to verify as hex string
 * @returns Valid?
 */
export function isValidKeypair(
  privateKey: string | Uint8Array,
  publicKey: string | Uint8Array,
): boolean {
  const message = Buffer.from('TheMessage');
  const signature = sign(message, privateKey);
  const publicKeyBuffer = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey;
  return verify(message, signature, encode(publicKeyBuffer, Encoding.AccountAddress));
}
