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
 * @example import { Crypto } from '@aeternity/aepp-sdk'
 */

import bs58check from 'bs58check'
import { decode as rlpDecode, encode as rlpEncode } from 'rlp'
import ed2curve from 'ed2curve'
import nacl from 'tweetnacl'
import aesjs from 'aes-js'
import shajs from 'sha.js'

import { leftPad, rightPad, str2buf, toBytes } from './bytes'
import { decode as decodeNode } from '../tx/builder/helpers'
import { hash } from './crypto-ts'

export * from './crypto-ts'

const Ecb = aesjs.ModeOfOperation.ecb

export const ADDRESS_FORMAT = {
  sophia: 1,
  api: 2,
  raw: 3
}

/**
 * Format account address
 * @rtype (format: String, address: String) => tx: Promise[String]
 * @param {String} format - Format type
 * @param {String} address - Base58check account address
 * @return {String} Formatted address
 */
export function formatAddress (format = ADDRESS_FORMAT.api, address) {
  switch (format) {
    case ADDRESS_FORMAT.api:
      return address
    case ADDRESS_FORMAT.sophia:
      return `0x${decodeNode(address, 'ak').toString('hex')}`
  }
}

/**
 * Generate address from secret key
 * @rtype (secret: String) => tx: Promise[String]
 * @param {String} secret - Private key
 * @return {String} Public key
 */
export function getAddressFromPriv (secret) {
  const keys = nacl.sign.keyPair.fromSecretKey(str2buf(secret))
  const publicBuffer = Buffer.from(keys.publicKey)
  return `ak_${encodeBase58Check(publicBuffer)}`
}

/**
 * Check if address is valid
 * @rtype (input: String) => valid: Boolean
 * @param {String} address - Address
 * @param {String} prefix Transaction prefix. Default: 'ak'
 * @return {Boolean} valid
 */
export function isAddressValid (address, prefix = 'ak') {
  if (typeof address !== 'string') return false
  try {
    return decodeBase58Check(assertedType(address, prefix)).length === 32
  } catch (e) {
    return false
  }
}

/**
 * Parse decimal address and return base58Check encoded address with prefix 'ak'
 * @rtype (input: String) => address: String
 * @param {String} decimalAddress - Address
 * @return {String} address
 */
export function addressFromDecimal (decimalAddress) {
  return aeEncodeKey(toBytes(decimalAddress, true))
}

/**
 * Calculate SHA256 hash of `input`
 * @rtype (input: String) => hash: String
 * @param {String} input - Data to hash
 * @return {String} Hash
 */
export function sha256hash (input) {
  return shajs('sha256').update(input).digest()
}

/**
 * Generate a random salt (positive integer)
 * @rtype () => salt: Number
 * @return {Number} random salt
 */
export function salt () {
  return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER))
}

/**
 * Base64check encode given `input`
 * @rtype (input: String|buffer) => Buffer
 * @param {String} input - Data to encode
 * @return {Buffer} Base64check encoded data
 */
export function encodeBase64Check (input) {
  const buffer = Buffer.from(input)
  const checksum = checkSumFn(input)
  const payloadWithChecksum = Buffer.concat([buffer, checksum], buffer.length + 4)
  return payloadWithChecksum.toString('base64')
}

export function checkSumFn (payload) {
  return sha256hash(sha256hash(payload)).slice(0, 4)
}

function decodeRaw (buffer) {
  const payload = buffer.slice(0, -4)
  const checksum = buffer.slice(-4)
  const newChecksum = checkSumFn(payload)

  if (!checksum.equals(newChecksum)) return

  return payload
}

/**
 * Base64check decode given `str`
 * @rtype (str: String) => Buffer
 * @param {String} str - Data to decode
 * @return {Buffer} Base64check decoded data
 */
export function decodeBase64Check (str) {
  const buffer = Buffer.from(str, 'base64')
  const payload = decodeRaw(buffer)
  if (!payload) throw new Error('Invalid checksum')
  return Buffer.from(payload)
}

/**
 * Base58 encode given `input`
 * @rtype (input: String) => String
 * @param {String|Buffer} input - Data to encode
 * @return {String} Base58 encoded data
 */
export function encodeBase58Check (input) {
  return bs58check.encode(Buffer.from(input))
}

/**
 * Base58 decode given `str`
 * @rtype (str: String) => Buffer
 * @param {String} str - Data to decode
 * @return {Buffer} Base58 decoded data
 */
export function decodeBase58Check (str) {
  return bs58check.decode(str)
}

/**
 * Conver hex string to Uint8Array
 * @rtype (str: String) => Uint8Array
 * @param {String} str - Data to conver
 * @return {Uint8Array} - converted data
 */
export function hexStringToByte (str) {
  if (!str) {
    return new Uint8Array()
  }

  const a = []
  for (let i = 0, len = str.length; i < len; i += 2) {
    a.push(parseInt(str.substr(i, 2), 16))
  }

  return new Uint8Array(a)
}

/**
 * Converts a positive integer to the smallest possible
 * representation in a binary digit representation
 * @rtype (value: Number) => Buffer
 * @param {Number} value - Value to encode
 * @return {Buffer} - Encoded data
 */
export function encodeUnsigned (value) {
  const binary = Buffer.allocUnsafe(4)
  binary.writeUInt32BE(value)
  return binary.slice(binary.findIndex(i => i !== 0))
}

// Todo Duplicated in tx builder. remove
/**
 * Compute contract address
 * @rtype (owner: String, nonce: Number) => String
 * @param {String} owner - Address of contract owner
 * @param {Number} nonce - Round when contract was created
 * @return {String} - Contract address
 */
export function encodeContractAddress (owner, nonce) {
  const publicKey = decodeBase58Check(assertedType(owner, 'ak'))
  const binary = Buffer.concat([publicKey, encodeUnsigned(nonce)])
  return `ct_${encodeBase58Check(hash(binary))}`
}

// KEY-PAIR HELPERS

/**
 * Generate keyPair from secret key
 * @rtype (secret: Uint8Array) => KeyPair
 * @param {Uint8Array} secret - secret key
 * @return {Object} - Object with Private(privateKey) and Public(publicKey) keys
 */
export function generateKeyPairFromSecret (secret) {
  return nacl.sign.keyPair.fromSecretKey(secret)
}

/**
 * Generate a random ED25519 keypair
 * @rtype (raw: Boolean) => {publicKey: String, secretKey: String} | {publicKey: Buffer, secretKey: Buffer}
 * @param {Boolean} raw - Whether to return raw (binary) keys
 * @return {Object} Key pair
 */
export function generateKeyPair (raw = false) {
  // <node>/apps/aens/test/aens_test_utils.erl
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
      publicKey: `ak_${encodeBase58Check(publicBuffer)}`,
      secretKey: secretBuffer.toString('hex')
    }
  }
}

/**
 * Encrypt given public key using `password`
 * @rtype (password: String, binaryKey: Buffer) => Uint8Array
 * @param {String} password - Password to encrypt with
 * @param {Buffer} binaryKey - Key to encrypt
 * @return {Uint8Array} Encrypted key
 */
export function encryptPublicKey (password, binaryKey) {
  return encryptKey(password, rightPad(32, binaryKey))
}

/**
 * Encrypt given private key using `password`
 * @rtype (password: String, binaryKey: Buffer) => Uint8Array
 * @param {String} password - Password to encrypt with
 * @param {Buffer} binaryKey - Key to encrypt
 * @return {Uint8Array} Encrypted key
 */
export function encryptPrivateKey (password, binaryKey) {
  return encryptKey(password, leftPad(64, binaryKey))
}

/**
 * Encrypt given data using `password`
 * @rtype (password: String, binaryData: Buffer) => Uint8Array
 * @param {String} password - Password to encrypt with
 * @param {Buffer} binaryData - Data to encrypt
 * @return {Uint8Array} Encrypted data
 */
export function encryptKey (password, binaryData) {
  const hashedPasswordBytes = sha256hash(password)
  const aesEcb = new Ecb(hashedPasswordBytes)
  return aesEcb.encrypt(binaryData)
}

/**
 * Decrypt given data using `password`
 * @rtype (password: String, encrypted: String) => Uint8Array
 * @param {String} password - Password to decrypt with
 * @param {String} encrypted - Data to decrypt
 * @return {Buffer} Decrypted data
 */
export function decryptKey (password, encrypted) {
  const encryptedBytes = Buffer.from(encrypted)
  const hashedPasswordBytes = sha256hash(password)
  const aesEcb = new Ecb(hashedPasswordBytes)
  return Buffer.from(aesEcb.decrypt(encryptedBytes))
}

// SIGNATURES

/**
 * Generate signature
 * @rtype (data: String|Buffer, privateKey: Buffer) => Buffer
 * @param {String|Buffer} data - Data to sign
 * @param {String|Buffer} privateKey - Key to sign with
 * @return {Buffer|Uint8Array} Signature
 */
export function sign (data, privateKey) {
  return nacl.sign.detached(Buffer.from(data), Buffer.from(privateKey))
}

/**
 * Verify that signature was signed by public key
 * @rtype (str: String, signature: Buffer, publicKey: Buffer) => Boolean
 * @param {String|Buffer} str - Data to verify
 * @param {Buffer} signature - Signature to verify
 * @param {Buffer} publicKey - Key to verify against
 * @return {Boolean} Valid?
 */
export function verify (str, signature, publicKey) {
  return nacl.sign.detached.verify(new Uint8Array(str), signature, publicKey)
}

/**
 * @typedef {Array} Transaction
 * @rtype Transaction: [tag: Buffer, version: Buffer, [signature: Buffer], data: Buffer]
 */

/**
 * Prepare a transaction for posting to the blockchain
 * @rtype (signature: Buffer | String, data: Buffer) => Transaction
 * @param {Buffer} signature - Signature of `data`
 * @param {Buffer} data - Transaction data
 * @return {Transaction} Transaction
 */
export function prepareTx (signature, data) {
  // the signed tx deserializer expects a 4-tuple:
  // <tag, version, signatures_array, binary_tx>
  return [Buffer.from([11]), Buffer.from([1]), [Buffer.from(signature)], data]
}

export function personalMessageToBinary (message) {
  const p = Buffer.from('aeternity Signed Message:\n', 'utf8')
  const msg = Buffer.from(message, 'utf8')
  if (msg.length >= 0xFD) throw new Error('message too long')
  return Buffer.concat([Buffer.from([p.length]), p, Buffer.from([msg.length]), msg])
}

export function signPersonalMessage (message, privateKey) {
  return sign(hash(personalMessageToBinary(message)), privateKey)
}

export function verifyPersonalMessage (str, signature, publicKey) {
  return verify(hash(personalMessageToBinary(str)), signature, publicKey)
}

/**
 * æternity readable public keys are the base58-encoded public key, prepended
 * with 'ak_'
 * @rtype (binaryKey: Buffer) => String
 * @param {Buffer} binaryKey - Key to encode
 * @return {String} Encoded key
 */
export function aeEncodeKey (binaryKey) {
  const publicKeyBuffer = Buffer.from(binaryKey, 'hex')
  const pubKeyAddress = encodeBase58Check(publicKeyBuffer)
  return `ak_${pubKeyAddress}`
}

/**
 * Generate a new key pair using {@link generateKeyPair} and encrypt it using `password`
 * @rtype (password: String) => {publicKey: Uint8Array, secretKey: Uint8Array}
 * @param {String} password - Password to encrypt with
 * @return {Object} Encrypted key pair
 */
export function generateSaveWallet (password) {
  const keys = generateKeyPair(true)
  return {
    publicKey: encryptPublicKey(password, keys.publicKey),
    secretKey: encryptPrivateKey(password, keys.secretKey)
  }
}

/**
 * Decrypt an encrypted private key
 * @rtype (password: String, encrypted: Buffer) => Buffer
 * @param {String} password - Password to decrypt with
 * @return {Buffer} Decrypted key
 */
export function decryptPrivateKey (password, encrypted) {
  return decryptKey(password, encrypted)
}

/**
 * Decrypt an encrypted public key
 * @rtype (password: String, encrypted: Buffer) => Buffer
 * @param {String} password - Password to decrypt with
 * @return {Buffer} Decrypted key
 */
export function decryptPubKey (password, encrypted) {
  return decryptKey(password, encrypted).slice(0, 65)
}

/**
 * Assert encoded type and return its payload
 * @rtype (data: String, type: String) => String, throws: Error
 * @param {String} data - ae data
 * @param {String} type - Prefix
 * @param {Boolean} omitError - Return false instead of throwing the error if data doesn't match expected type
 * @return {String|Boolean} Payload
 */
export function assertedType (data, type, omitError) {
  if (RegExp(`^${type}_.+$`).test(data)) return data.split('_')[1]
  else if (omitError) return false
  else throw new Error(`Data doesn't match expected type ${type}`)
}

/**
 * Decode a transaction
 * @rtype (txHash: String) => Buffer
 * @param {String} encodedTx - Encoded transaction
 * @return {Buffer} Decoded transaction
 */
export function decodeTx (encodedTx) {
  return rlpDecode(Buffer.from(decodeBase64Check(assertedType(encodedTx, 'tx'))))
}

/**
 * Encode a transaction
 * @rtype (txData: Transaction) => String
 * @param {Transaction} txData - Transaction to encode
 * @return {String} Encoded transaction
 */
export function encodeTx (txData) {
  const encodedTxData = rlpEncode(txData)
  const encodedTx = encodeBase64Check(encodedTxData)
  return `tx_${encodedTx}`
}

/**
 * Check key pair for validity
 *
 * Sign a message, and then verifying that signature
 * @rtype (privateKey: Buffer, publicKey: Buffer) => Boolean
 * @param {Buffer} privateKey - Private key to verify
 * @param {Buffer} publicKey - Public key to verify
 * @return {Boolean} Valid?
 */
export function isValidKeypair (privateKey, publicKey) {
  const message = Buffer.from('TheMessage')
  const signature = sign(message, privateKey)
  return verify(message, signature, publicKey)
}

/**
 * This function encrypts a message using base58check encoded and 'ak' prefixed
 * publicKey such that only the corresponding secretKey will
 * be able to decrypt
 * @rtype (msg: String, publicKey: String) => Object
 * @param {Buffer} msg - Data to encode
 * @param {String} publicKey - Public key
 * @return {Object}
 */
export function encryptData (msg, publicKey) {
  const ephemeralKeyPair = nacl.box.keyPair()
  const pubKeyUInt8Array = decodeBase58Check(assertedType(publicKey, 'ak'))
  const nonce = nacl.randomBytes(nacl.box.nonceLength)

  const encryptedMessage = nacl.box(
    Buffer.from(msg),
    nonce,
    ed2curve.convertPublicKey(pubKeyUInt8Array),
    ephemeralKeyPair.secretKey
  )

  return {
    ciphertext: Buffer.from(encryptedMessage).toString('hex'),
    ephemPubKey: Buffer.from(ephemeralKeyPair.publicKey).toString('hex'),
    nonce: Buffer.from(nonce).toString('hex'),
    version: 'x25519-xsalsa20-poly1305'
  }
}

/**
 * This function decrypt a message using secret key
 * @rtype (secretKey: String, encryptedData: Object) => Buffer|null
 * @param {String} secretKey - Secret key
 * @param {Object} encryptedData - Encrypted data
 * @return {Buffer|null}
 */
export function decryptData (secretKey, encryptedData) {
  const receiverSecretKeyUint8Array = ed2curve.convertSecretKey(Buffer.from(secretKey, 'hex'))
  const nonce = Buffer.from(encryptedData.nonce, 'hex')
  const ciphertext = Buffer.from(encryptedData.ciphertext, 'hex')
  const ephemPubKey = Buffer.from(encryptedData.ephemPubKey, 'hex')
  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    ephemPubKey,
    receiverSecretKeyUint8Array
  )
  return decrypted ? Buffer.from(decrypted) : decrypted
}
