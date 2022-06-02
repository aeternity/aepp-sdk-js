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

/**
 * Crypto module
 * @module @aeternity/aepp-sdk/es/utils/crypto
 * @example import { getAddressFromPriv } from '@aeternity/aepp-sdk'
 */

import nacl, { SignKeyPair } from 'tweetnacl'
import aesjs from 'aes-js'
import { blake2b, Data } from 'blakejs'
import { encode as varuintEncode } from 'varuint-bitcoin'

import { str2buf } from './bytes'
import { concatBuffers } from './other'
import { encode, decode, sha256hash, EncodedData, EncodingType } from './encoder'

export { sha256hash }

const Ecb = aesjs.ModeOfOperation.ecb

/**
 * Generate address from secret key
 * @rtype (secret: String) => tx: Promise[String]
 * @param {String | Uint8Array} secret - Private key
 * @return {String} Public key
 */
export function getAddressFromPriv (secret: string | Uint8Array): string {
  const secretBuffer = typeof secret === 'string' ? str2buf(secret) : secret
  const keys = nacl.sign.keyPair.fromSecretKey(secretBuffer)
  return encode(keys.publicKey, 'ak')
}

/**
 * Check if address is valid
 * @rtype (input: String) => valid: Boolean
 * @param {String} address - Address
 * @param {String} prefix Transaction prefix. Default: 'ak'
 * @return {Boolean} valid
 */
export function isAddressValid (address: string, prefix: EncodingType = 'ak'): boolean {
  try {
    decode(address as EncodedData<typeof prefix>)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Generate a random salt (positive integer)
 * @rtype () => salt: Number
 * @return {Number} random salt
 */
export function salt (): number {
  return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER))
}

/**
 * Converts a positive integer to the smallest possible
 * representation in a binary digit representation
 * @rtype (value: Number) => Buffer
 * @param {Number} value - Value to encode
 * @return {Buffer} - Encoded data
 */
export function encodeUnsigned (value: number): Buffer {
  const binary = Buffer.allocUnsafe(4)
  binary.writeUInt32BE(value)
  return binary.slice(binary.findIndex(i => i !== 0))
}

/**
 * Calculate 256bits Blake2b hash of `input`
 * @rtype (input: String) => hash: String
 * @param {Data} input - Data to hash
 * @return {Buffer} Hash
 */
export function hash (input: Data): Buffer {
  return Buffer.from(blake2b(input, undefined, 32)) // 256 bits
}

// Todo Duplicated in tx builder. remove
/**
 * Compute contract address
 * @rtype (owner: String, nonce: Number) => String
 * @param {EncodedData<'ak'>} owner - Address of contract owner
 * @param {Number} nonce - Round when contract was created
 * @return {String} - Contract address
 */
export function encodeContractAddress (owner: EncodedData<'ak'>, nonce: number): string {
  const publicKey = decode(owner)
  const binary = concatBuffers([publicKey, encodeUnsigned(nonce)])
  return encode(hash(binary), 'ct')
}

// KEY-PAIR HELPERS

/**
 * Generate keyPair from secret key
 * @rtype (secret: Uint8Array) => KeyPair
 * @param {Uint8Array} secret - secret key
 * @return {Object} - Object with Private(privateKey) and Public(publicKey) keys
 */
export function generateKeyPairFromSecret (secret: Uint8Array): SignKeyPair {
  return nacl.sign.keyPair.fromSecretKey(secret)
}

/**
 * Generate a random ED25519 keypair
 * @param raw Whether to return raw (binary) keys
 * @return Key pair
 */
export function generateKeyPair (raw?: true): { publicKey: Buffer, secretKey: Buffer }
export function generateKeyPair (raw: false): { publicKey: EncodedData<'ak'>, secretKey: string }
export function generateKeyPair (raw: boolean = false): {
  publicKey: EncodedData<'ak'> | Buffer
  secretKey: string | Buffer
} {
  const keyPair = nacl.sign.keyPair()
  const publicBuffer = Buffer.from(keyPair.publicKey)
  const secretBuffer = Buffer.from(keyPair.secretKey)

  if (raw) {
    return {
      publicKey: publicBuffer,
      secretKey: secretBuffer
    }
  } else {
    return {
      publicKey: encode(publicBuffer, 'ak'),
      secretKey: secretBuffer.toString('hex')
    }
  }
}

/**
 * Encrypt given data using `password`
 * @rtype (password: String, binaryData: Buffer) => Uint8Array
 * @param {String} password - Password to encrypt with
 * @param {Uint8Array} binaryData - Data to encrypt
 * @return {Uint8Array} Encrypted data
 */
export function encryptKey (password: string, binaryData: Uint8Array): Uint8Array {
  const hashedPasswordBytes = sha256hash(password)
  const aesEcb = new Ecb(hashedPasswordBytes)
  return aesEcb.encrypt(binaryData)
}

/**
 * Decrypt given data using `password`
 * @rtype (password: String, encrypted: String) => Uint8Array
 * @param {String} password - Password to decrypt with
 * @param {Uint8Array} encrypted - Data to decrypt
 * @return {Uint8Array} Decrypted data
 */
export function decryptKey (password: string, encrypted: Uint8Array): Uint8Array {
  const encryptedBytes = Buffer.from(encrypted)
  const hashedPasswordBytes = sha256hash(password)
  const aesEcb = new Ecb(hashedPasswordBytes)
  return aesEcb.decrypt(encryptedBytes)
}

// SIGNATURES

/**
 * Generate signature
 * @rtype (data: String | Buffer, privateKey: Buffer) => Buffer
 * @param {String | Uint8Array} data - Data to sign
 * @param {String | Uint8Array} privateKey - Key to sign with
 * @return {Uint8Array} Signature
 */
export function sign (data: string | Uint8Array, privateKey: string | Uint8Array): Uint8Array {
  return nacl.sign.detached(Buffer.from(data), Buffer.from(privateKey))
}

/**
 * Verify that signature was signed by public key
 * @rtype (data: Buffer, signature: Buffer, publicKey: Buffer) => Boolean
 * @param {Uint8Array} data - Data to verify
 * @param {Uint8Array} signature - Signature to verify
 * @param {string | Uint8Array} publicKey - Key to verify against
 * @return {Boolean} Valid?
 */
export function verify (
  data: Uint8Array, signature: Uint8Array, publicKey: string | Uint8Array): boolean {
  const publicKeyBuffer = typeof publicKey === 'string' ? str2buf(publicKey) : publicKey
  return nacl.sign.detached.verify(data, signature, publicKeyBuffer)
}

export function messageToHash (message: string): Buffer {
  const p = Buffer.from('aeternity Signed Message:\n', 'utf8')
  const msg = Buffer.from(message, 'utf8')
  return hash(concatBuffers([varuintEncode(p.length), p, varuintEncode(msg.length), msg]))
}

export function signMessage (message: string, privateKey: string | Buffer): Uint8Array {
  return sign(messageToHash(message), privateKey)
}

export function verifyMessage (
  str: string, signature: Uint8Array, publicKey: string | Uint8Array): boolean {
  return verify(messageToHash(str), signature, publicKey)
}

/**
 * Check key pair for validity
 *
 * Sign a message, and then verifying that signature
 * @rtype (privateKey: Buffer, publicKey: Buffer) => Boolean
 * @param {String | Uint8Array} privateKey - Private key to verify
 * @param {String | Uint8Array} publicKey - Public key to verify
 * @return {Boolean} Valid?
 */
export function isValidKeypair (
  privateKey: string | Uint8Array, publicKey: string | Uint8Array
): boolean {
  const message = Buffer.from('TheMessage')
  const signature = sign(message, privateKey)
  return verify(message, signature, publicKey)
}
