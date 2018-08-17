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
import RLP from 'rlp'
import {blake2b} from 'blakejs'
import nacl from 'tweetnacl'
import aesjs from 'aes-js'
import {leftPad, rightPad} from './bytes'
import shajs from 'sha.js'

const Ecb = aesjs.ModeOfOperation.ecb

/**
 * Calculate 256bits Blake2b hash of `input`
 * @rtype (input: String) => hash: String
 * @param {String} input - Data to hash
 * @return {String} Hash
 */
export function hash (input) {
  return blake2b(input, null, 32) // 256 bits
}

/**
 * Calculate 256bits Blake2b nameHash of `input`
 * as defined in https://github.com/aeternity/protocol/blob/master/AENS.md#hashing
 * @rtype (input: String) => hash: String
 * @param {String} input - Data to hash
 * @return {String} Hash
 */
export function nameHash (input) {
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
 * Base58 encode given `input`
 * @rtype (input: String) => Buffer
 * @param {String} input - Data to encode
 * @return {Buffer} Base58 encoded data
 */
export function encodeBase58Check (input) {
  return bs58check.encode(input)
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
 * Generate a random ED25519 keypair
 * @rtype (raw: Boolean) => {pub: String, priv: String} | {pub: Buffer, priv: Buffer}
 * @param {Boolean} raw - Whether to return raw (binary) keys
 * @return {Object} Key pair
 */
export function generateKeyPair (raw = false) {
  // <epoch>/apps/aens/test/aens_test_utils.erl
  const keyPair = nacl.sign.keyPair()

  const publicBuffer = Buffer.from(keyPair.publicKey)
  const secretBuffer = Buffer.from(keyPair.secretKey)

  if (raw) {
    return {
      pub: publicBuffer,
      priv: secretBuffer
    }
  } else {
    return {
      pub: `ak$${encodeBase58Check(publicBuffer)}`,
      priv: secretBuffer.toString('hex')
    }
  }
}

/**
 * Encrypt given public key using `password`
 * @rtype (password: String, binaryKey: Buffer) => UInt8Array
 * @param {String} password - Password to encrypt with
 * @param {Buffer} binaryKey - Key to encrypt
 * @return {UInt8Array} Encrypted key
 */
export function encryptPublicKey (password, binaryKey) {
  return encryptKey(password, rightPad(32, binaryKey))
}

/**
 * Encrypt given private key using `password`
 * @rtype (password: String, binaryKey: Buffer) => UInt8Array
 * @param {String} password - Password to encrypt with
 * @param {Buffer} binaryKey - Key to encrypt
 * @return {UInt8Array} Encrypted key
 */
export function encryptPrivateKey (password, binaryKey) {
  return encryptKey(password, leftPad(64, binaryKey))
}

/**
 * Encrypt given data using `password`
 * @rtype (password: String, binaryData: Buffer) => UInt8Array
 * @param {String} password - Password to encrypt with
 * @param {Buffer} binaryData - Data to encrypt
 * @return {UInt8Array} Encrypted data
 */
export function encryptKey (password, binaryData) {
  let hashedPasswordBytes = sha256hash(password)
  let aesEcb = new Ecb(hashedPasswordBytes)
  return aesEcb.encrypt(binaryData)
}

/**
 * Decrypt given data using `password`
 * @rtype (password: String, encrypted: String) => UInt8Array
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

/**
 * Generate signature
 * @rtype (data: String, privateKey: Buffer) => Buffer
 * @param {String} data - Data to sign
 * @param {Buffer} privateKey - Key to sign with
 * @return {Buffer} Signature
 */
export function sign (data, privateKey) {
  return nacl.sign.detached(new Uint8Array(data), privateKey)
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
  const p = Buffer.from('‎æternity Signed Message:\n', 'utf8')
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
 * with 'ak$'
 * @rtype (binaryKey: Buffer) => String
 * @param {Buffer} binaryKey - Key to encode
 * @return {String} Encoded key
 */
export function aeEncodeKey (binaryKey) {
  const publicKeyBuffer = Buffer.from(binaryKey, 'hex')
  const pubKeyAddress = encodeBase58Check(publicKeyBuffer)
  return `ak$${pubKeyAddress}`
}

/**
 * Generate a new key pair using {@link generateKeyPair} and encrypt it using `password`
 * @rtype (password: String) => {pub: UInt8Array, priv: UInt8Array}
 * @param {String} password - Password to encrypt with
 * @return {Object} Encrypted key pair
 */
export function generateSaveWallet (password) {
  let keys = generateKeyPair(true)
  return {
    pub: encryptPublicKey(password, keys.pub),
    priv: encryptPrivateKey(password, keys.priv)
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
 * @return {String} Payload
 */
export function assertedType (data, type) {
  if (RegExp(`^${type}\\$.+$`).test(data)) {
    return data.split('$')[1]
  } else {
    throw Error(`Data doesn't match expected type ${type}`)
  }
}

/**
 * Decode a transaction
 * @rtype (txHash: String) => Buffer
 * @param {String} password - Password to decrypt with
 * @return {Array} Decoded transaction
 */
export function decodeTx (txHash) {
  return RLP.decode(Buffer.from(decodeBase58Check(assertedType(txHash, 'tx')), 'hex'))
}

/**
 * Encode a transaction
 * @rtype (txData: Transaction) => String
 * @param {Transaction} txData - Transaction to encode
 * @return {String} Encoded transaction
 */
export function encodeTx (txData) {
  const encodedTxData = RLP.encode(txData)
  const encodedTx = encodeBase58Check(Buffer.from(encodedTxData))
  return `tx$${encodedTx}`
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
  const message = 'TheMessage'
  const signature = sign(message, privateKey)
  return verify(message, signature, publicKey)
}

/**
 * Obtain key pair from `env`
 *
 * Designed to be used with `env` from nodejs. Assumes enviroment variables
 * `WALLET_PRIV` and `WALLET_PUB`.
 * @rtype (env: Object) => {pub: String, priv: String}, throws: Error
 * @param {Object} env - Environment
 * @return {Object} Key pair
 */
export function envKeypair (env) {
  const keypair = {
    priv: env['WALLET_PRIV'],
    pub: env['WALLET_PUB']
  }

  if (keypair.pub && keypair.priv) {
    return keypair
  } else {
    throw Error('Environment variables WALLET_PRIV and WALLET_PUB need to be set')
  }
}

/**
 * RLP decode
 * @rtype (data: Any) => Buffer[]
 * @param {Buffer|String|Integer|Array} data - Data to decode
 * @return {Array} Array of Buffers containing the original message
 */
export const decode = RLP.decode

const OBJECT_TAGS = {
  SIGNED_TX: 11,
  CHANNEL_CREATE_TX: 50,
  CHANNEL_CLOSE_MUTUAL_TX: 53,
  CHANNEL_OFFCHAIN_TX: 57
}

function readInt (buf) {
  return buf.readIntBE(0, buf.length)
}

function readSignatures (buf) {
  const signatures = []

  for (let i = 0; i < buf.length; i++) {
    signatures.push(encodeBase58Check(buf[i]))
  }

  return signatures
}

function readOffChainTXUpdates (buf) {
  const updates = []

  for (let i = 0; i < buf.length; i++) {
    updates.push([
      readInt(buf[i][0]),
      'ak$' + encodeBase58Check(buf[i][1]),
      'ak$' + encodeBase58Check(buf[i][2]),
      readInt(buf[i][3])
    ])
  }

  return updates
}

/**
 * Deserialize `binary` state channel transaction
 * @rtype (binary: String) => Object
 * @param {String} binary - Data to deserialize
 * @return {Object} Channel data
 */
export function deserialize (binary) {
  const obj = {
    tag: readInt(binary[0]),
    version: readInt(binary[1])
  }

  switch (obj.tag) {
    case OBJECT_TAGS.SIGNED_TX:
      return Object.assign(obj, {
        signatures: readSignatures(binary[2]),
        tx: deserialize(decode(binary[3]))
      })

    case OBJECT_TAGS.CHANNEL_CREATE_TX:
      return Object.assign(obj, {
        initiator: 'ak$' + encodeBase58Check(binary[2]),
        initiatorAmount: readInt(binary[3]),
        responder: 'ak$' + encodeBase58Check(binary[4]),
        responderAmount: readInt(binary[5]),
        channelReserve: readInt(binary[6]),
        lockPeriod: readInt(binary[7]),
        ttl: readInt(binary[8]),
        fee: readInt(binary[9]),
        nonce: readInt(binary[10])
      })

    case OBJECT_TAGS.CHANNEL_CLOSE_MUTUAL_TX:
      return Object.assign(obj, {
        channelId: encodeBase58Check(binary[2]),
        initiatorAmount: readInt(binary[3]),
        responderAmount: readInt(binary[4]),
        ttl: readInt(binary[5]),
        fee: readInt(binary[6]),
        nonce: readInt(binary[7])
      })

    case OBJECT_TAGS.CHANNEL_OFFCHAIN_TX:
      return Object.assign(obj, {
        channelId: encodeBase58Check(binary[2]),
        round: readInt(binary[3]),
        updates: readOffChainTXUpdates(binary[4]),
        state: encodeBase58Check(binary[5])
      })
  }
}
