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
 * @example import * as Crypto from '@aeternity/aepp-sdk/es/utils/crypto'
 */

import bs58check from 'bs58check'
import * as RLP from 'rlp'
import { blake2b } from 'blakejs'
import nacl from 'tweetnacl'
import aesjs from 'aes-js'
import { leftPad, rightPad, toBytes } from './bytes'
import shajs from 'sha.js'
import { decode as decodeNode } from '../tx/builder/helpers'

const Ecb = aesjs.ModeOfOperation.ecb

/**
 * Check whether a string is valid base-64.
 * @param {string} str String to validate.
 * @return {boolean} True if the string is valid base-64, false otherwise.
 */
export function isBase64 (str) {
  let index
  // eslint-disable-next-line no-useless-escape
  if (str.length % 4 > 0 || str.match(/[^0-9a-z+\/=]/i)) return false
  index = str.indexOf('=')
  return !!(index === -1 || str.slice(index).match(/={1,2}/))
}

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
 * Check if address is valid
 * @rtype (input: String) => valid: Boolean
 * @param {String} address - Address
 * @return {Boolean} valid
 */
export function isAddressValid (address) {
  let isValid
  try {
    isValid = decodeBase58Check(assertedType(address, 'ak')).length === 32
  } catch (e) {
    isValid = false
  }
  return isValid
}

/**
 * Convert base58Check address to hex string
 * @rtype (base58CheckAddress: String) => hexAddress: String
 * @param {String} base58CheckAddress - Address
 * @return {String} Hex string
 */
export function addressToHex (base58CheckAddress) {
  return `0x${decodeBase58Check(assertedType(base58CheckAddress, 'ak')).toString('hex')}`
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
 * Calculate 256bits Blake2b hash of `input`
 * @rtype (input: String) => hash: String
 * @param {String|Buffer} input - Data to hash
 * @return {Buffer} Hash
 */
export function hash (input) {
  return Buffer.from(blake2b(input, null, 32)) // 256 bits
}

/**
 * Calculate 256bits Blake2b nameId of `input`
 * as defined in https://github.com/aeternity/protocol/blob/master/AENS.md#hashing
 * @rtype (input: String) => hash: String
 * @param {String} input - Data to hash
 * @return {Buffer} Hash
 */
export function nameId (input) {
  let buf = Buffer.allocUnsafe(32).fill(0)
  if (!input) {
    return buf
  } else {
    const labels = input.split('.')
    for (let i = 0; i < labels.length; i++) {
      buf = hash(Buffer.concat([buf, hash(labels[i])]))
    }
    return buf
  }
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
 * @param {String} input - Data to encode
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

  var a = []
  for (var i = 0, len = str.length; i < len; i += 2) {
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
  let hashedPasswordBytes = sha256hash(password)
  let aesEcb = new Ecb(hashedPasswordBytes)
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
  let hashedPasswordBytes = sha256hash(password)
  let aesEcb = new Ecb(hashedPasswordBytes)
  return Buffer.from(aesEcb.decrypt(encryptedBytes))
}

// SIGNATURES

/**
 * Generate signature
 * @rtype (data: String|Buffer, privateKey: Buffer) => Buffer
 * @param {String|Buffer} data - Data to sign
 * @param {String|Buffer} privateKey - Key to sign with
 * @return {Buffer} Signature
 */
export function sign (data, privateKey) {
  return nacl.sign.detached(Buffer.from(data), Buffer.from(privateKey))
}

/**
 * Verify that signature was signed by public key
 * @rtype (str: String, signature: Buffer, publicKey: Buffer) => Boolean
 * @param {String} str - Data to verify
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
  const p = Buffer.from('æternity Signed Message:\n', 'utf8')
  const msg = Buffer.from(message, 'utf8')
  if (msg.length >= 0xFD) throw new Error('message too long')
  return Buffer.concat([Buffer.from([p.length]), p, Buffer.from([msg.length]), msg])
}

export function signPersonalMessage (message, privateKey) {
  return sign(personalMessageToBinary(message), privateKey)
}

export function verifyPersonalMessage (str, signature, publicKey) {
  return verify(personalMessageToBinary(str), signature, publicKey)
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
  let keys = generateKeyPair(true)
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
 * Assert base58 encoded type and return its payload
 * @rtype (data: String, type: String) => String, throws: Error
 * @param {String} data - ae data
 * @param {String} type - Prefix
 * @param forceError
 * @return {String|Boolean} Payload
 */
export function assertedType (data, type, forceError = false) {
  if (RegExp(`^${type}_.+$`).test(data)) {
    return data.split('_')[1]
  } else {
    if (!forceError) throw Error(`Data doesn't match expected type ${type}`)
    return false
  }
}

/**
 * Decode a transaction
 * @rtype (txHash: String) => Buffer
 * @param {String} password - Password to decrypt with
 * @return {Array} Decoded transaction
 */
export function decodeTx (txHash) {
  return RLP.decode(Buffer.from(decodeBase64Check(assertedType(txHash, 'tx'))))
}

/**
 * Encode a transaction
 * @rtype (txData: Transaction) => String
 * @param {Transaction} txData - Transaction to encode
 * @return {String} Encoded transaction
 */
export function encodeTx (txData) {
  const encodedTxData = RLP.encode(txData)
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
 * Obtain key pair from `env`
 *
 * Designed to be used with `env` from nodejs. Assumes enviroment variables
 * `WALLET_PRIV` and `WALLET_PUB`.
 * @rtype (env: Object) => {publicKey: String, secretKey: String}, throws: Error
 * @param {Object} env - Environment
 * @return {Object} Key pair
 */
export function envKeypair (env, force = false) {
  const keypair = {
    secretKey: env['WALLET_PRIV'],
    publicKey: env['WALLET_PUB']
  }

  if (keypair.publicKey && keypair.secretKey) {
    return keypair
  } else {
    if (!force) throw Error('Environment variables WALLET_PRIV and WALLET_PUB need to be set')
  }
}

/**
 * RLP decode
 * @rtype (data: Any) => Buffer[]
 * @param {Buffer|String|Integer|Array} data - Data to decode
 * @return {Array} Array of Buffers containing the original message
 */
export const decode = RLP.decode
export const encode = RLP.encode
export const rlp = RLP

const OBJECT_TAGS = {
  SIGNED_TX: 11,
  CHANNEL_CREATE_TX: 50,
  CHANNEL_CLOSE_MUTUAL_TX: 53,
  CHANNEL_OFFCHAIN_TX: 57,
  CHANNEL_OFFCHAIN_UPDATE_TRANSFER: 570
}

function objectTag (tag, pretty) {
  if (pretty) {
    const entry = Object.entries(OBJECT_TAGS).find(([key, value]) => tag === value)
    return entry ? entry[0] : tag
  }
  return tag
}

function readInt (buf) {
  return buf.readIntBE(0, buf.length)
}

function readId (buf) {
  const type = buf.readUIntBE(0, 1)
  const prefix = {
    1: 'ak',
    2: 'nm',
    3: 'cm',
    4: 'ok',
    5: 'ct',
    6: 'ch'
  }[type]
  const hash = encodeBase58Check(buf.slice(1, buf.length))
  return `${prefix}_${hash}`
}

function readSignatures (buf) {
  const signatures = []

  for (let i = 0; i < buf.length; i++) {
    signatures.push(encodeBase58Check(buf[i]))
  }

  return signatures
}

function deserializeOffChainUpdate (binary, opts) {
  const tag = readInt(binary[0])
  const obj = {
    tag: objectTag(tag, opts.prettyTags),
    version: readInt(binary[1])
  }

  switch (tag) {
    case OBJECT_TAGS.CHANNEL_OFFCHAIN_UPDATE_TRANSFER:
      return Object.assign(obj, {
        from: readId(binary[2]),
        to: readId(binary[3]),
        amount: readInt(binary[4])
      })
  }

  return obj
}

function readOffChainTXUpdates (buf, opts) {
  const updates = []

  for (let i = 0; i < buf.length; i++) {
    updates.push(deserializeOffChainUpdate(decode(buf[i]), opts))
  }

  return updates
}

/**
 * Deserialize `binary` state channel transaction
 * @rtype (binary: String) => Object
 * @param {String} binary - Data to deserialize
 * @param {Object} opts - Options
 * @return {Object} Channel data
 */
export function deserialize (binary, opts = { prettyTags: false }) {
  const tag = readInt(binary[0])
  const obj = {
    tag: objectTag(tag, opts.prettyTags),
    version: readInt(binary[1])
  }

  switch (tag) {
    case OBJECT_TAGS.SIGNED_TX:
      return Object.assign(obj, {
        signatures: readSignatures(binary[2]),
        tx: deserialize(decode(binary[3]), opts)
      })

    case OBJECT_TAGS.CHANNEL_CREATE_TX:
      return Object.assign(obj, {
        initiator: readId(binary[2]),
        initiatorAmount: readInt(binary[3]),
        responder: readId(binary[4]),
        responderAmount: readInt(binary[5]),
        channelReserve: readInt(binary[6]),
        lockPeriod: readInt(binary[7]),
        ttl: readInt(binary[8]),
        fee: readInt(binary[9])
      })

    case OBJECT_TAGS.CHANNEL_CLOSE_MUTUAL_TX:
      return Object.assign(obj, {
        channelId: readId(binary[2]),
        initiatorAmount: readInt(binary[3]),
        responderAmount: readInt(binary[4]),
        ttl: readInt(binary[5]),
        fee: readInt(binary[6]),
        nonce: readInt(binary[7])
      })

    case OBJECT_TAGS.CHANNEL_OFFCHAIN_TX:
      return Object.assign(obj, {
        channelId: readId(binary[2]),
        round: readInt(binary[3]),
        updates: readOffChainTXUpdates(binary[4], opts),
        state: encodeBase58Check(binary[5])
      })
  }
}
