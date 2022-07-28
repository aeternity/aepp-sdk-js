/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
import nacl, { SignKeyPair } from 'tweetnacl';
// js extension is required for mjs build, not importing the whole package to reduce bundle size
// eslint-disable-next-line import/extensions
import { blake2b } from 'blakejs/blake2b.js';
import { encode as varuintEncode } from 'varuint-bitcoin';

import { str2buf } from './bytes';
import { concatBuffers } from './other';
import {
  decode, encode, Encoded, Encoding,
} from './encoder';

/**
 * Generate address from secret key
 * @param secret - Private key
 * @returns Public key encoded as address
 */
export function getAddressFromPriv(secret: string | Uint8Array): Encoded.AccountAddress {
  const secretBuffer = typeof secret === 'string' ? str2buf(secret) : secret;
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
  return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
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
 * @param data - Data to verify
 * @param signature - Signature to verify
 * @param publicKey - Key to verify against
 * @returns Valid?
 */
export function verify(
  data: Uint8Array,
  signature: Uint8Array,
  publicKey: string | Uint8Array,
): boolean {
  const publicKeyBuffer = typeof publicKey === 'string' ? str2buf(publicKey) : publicKey;
  return nacl.sign.detached.verify(data, signature, publicKeyBuffer);
}

export function messageToHash(message: string): Buffer {
  const p = Buffer.from('aeternity Signed Message:\n', 'utf8');
  const msg = Buffer.from(message, 'utf8');
  return hash(concatBuffers([varuintEncode(p.length), p, varuintEncode(msg.length), msg]));
}

export function signMessage(message: string, privateKey: string | Buffer): Uint8Array {
  return sign(messageToHash(message), privateKey);
}

export function verifyMessage(
  str: string,
  signature: Uint8Array,
  publicKey: string | Uint8Array,
): boolean {
  return verify(messageToHash(str), signature, publicKey);
}

/**
 * Check key pair for validity
 *
 * Sign a message, and then verifying that signature
 * @param privateKey - Private key to verify
 * @param publicKey - Public key to verify
 * @returns Valid?
 */
export function isValidKeypair(
  privateKey: string | Uint8Array,
  publicKey: string | Uint8Array,
): boolean {
  const message = Buffer.from('TheMessage');
  const signature = sign(message, privateKey);
  return verify(message, signature, publicKey);
}
