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

import bs58check from 'bs58check'
import RLP from 'rlp'
import { blake2b } from 'blakejs'
import nacl from 'tweetnacl'
import aesjs from 'aes-js'

import { leftPad, rightPad } from './bytes'

const Ecb = aesjs.ModeOfOperation.ecb

/**
 *
 * @param
 * @param
 * @return
 */
export function hash (input) {
  return blake2b(input, null, 32) // 256 bits
}

/**
 * Generate a random salt
 * @return {number} random salt
 */
export function salt () {
  return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER))
}

/**
 *
 * @param
 * @param
 * @return
 */
export function encodeBase58Check (input) {
  return bs58check.encode(input)
}

/**
 *
 * @param
 * @param
 * @return
 */
export function decodeBase58Check (str) {
  return bs58check.decode(str)
}

/**
 *
 * @param
 * @param
 * @return
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
 *
 * @param
 * @param
 * @return
 */
export function encryptPublicKey (password, binaryKey) {
  return encryptKey(password, rightPad(32, binaryKey))
}

/**
 *
 * @param
 * @param
 * @return
 */
export function encryptPrivateKey (password, binaryKey) {
  return encryptKey(password, leftPad(64, binaryKey))
}

/**
 *
 * @param
 * @param
 * @return
 */
export function encryptKey (password, binaryData) {
  let hashedPasswordBytes = hash(password)
  let aesEcb = new Ecb(hashedPasswordBytes)
  return aesEcb.encrypt(binaryData)
}

/**
 *
 * @param
 * @param
 * @return
 */
export function decryptKey (password, encrypted) {
  const encryptedBytes = Buffer.from(encrypted)
  let hashedPasswordBytes = hash(password)
  let aesEcb = new Ecb(hashedPasswordBytes)
  return Buffer.from(aesEcb.decrypt(encryptedBytes))
}

/**
 *
 * @param
 * @param
 * @return
 */
export function sign (txBin, privateKey) {
  return nacl.sign.detached(new Uint8Array(txBin), privateKey)
}

/**
 * Verify that signature was signed by public key
 * @param str
 * @param signature
 * @param publicKey
 * @return true if the
 */
export function verify (str, signature, publicKey) {
  return nacl.sign.detached.verify(new Uint8Array(str), signature, publicKey)
}

/**
 * Prepare a transaction for posting to the blockchain, by creating
 * the 4-tuple of <tag, version, signatures_array, binary_tx> which is
 * posted.
 * @param signature
 * @param data
 * @return the 4-tuple
 */
export function prepareTx (signature, data) {
  // the signed tx deserializer expects a 4-tuple:
  // <tag, version, signatures_array, binary_tx>
  return [Buffer.from([11]), Buffer.from([1]), [Buffer.from(signature)], data]
}

/**
 *
 * @param
 * @param
 * @return
 */
export function personalMessageToBinary (message) {
  const p = Buffer.from('‎Æternity Signed Message:\n', 'utf8')
  const msg = Buffer.from(message, 'utf8')
  if (msg.length >= 0xFD) throw new Error('message too long')
  return Buffer.concat([Buffer.from([p.length]), p, Buffer.from([msg.length]), msg])
}

/**
 *
 * @param
 * @param
 * @return
 */
export function signPersonalMessage (message, privateKey) {
  return sign(personalMessageToBinary(message), privateKey)
}

/**
 *
 * @param
 * @param
 * @return
 */
export function verifyPersonalMessage (str, signature, publicKey) {
  return verify(personalMessageToBinary(str), signature, publicKey)
}

/**
 * æternity readable public keys are the base58-encoded public key,
 * prepended with 'ak$'.
 * @param binaryKey
 * @return the readable public key
 */
export function getReadablePublicKey (binaryKey) {
  const publicKeyBuffer = Buffer.from(binaryKey, 'hex')
  const pubKeyAddress = encodeBase58Check(publicKeyBuffer)
  return `ak$${pubKeyAddress}`
}

/**
 * Generate and save a wallet (key pair)
 * @param password to encrypt wallet with
 * @return the key pair
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
 * @param password
 * @param encrypted
 * @return the decrypted private key
 */
export function decryptPrivateKey (password, encrypted) {
  return decryptKey(password, encrypted)
}

/**
 *
 * @param
 * @param
 * @return
 */
export function decryptPubKey (password, encrypted) {
  return decryptKey(password, encrypted).slice(0, 65)
}

/**
 * Decode a transaction by removing everything before the first '$'
 * sign, and RLP-decoding the rest.
 * @param txHash, the encoded transaction
 * @return the decoded transaction
 */
export function decodeTx (txHash) {
  let decodedTx = decodeBase58Check(txHash.split('$')[1])
  var decoded = RLP.decode(Buffer.from(decodedTx, 'hex'))
  return decoded
}

/**
 * Encode a transaction using RLP
 * @param txData
 * @return encoded transaction
 */
export function encodeTx (txData) {
  const encodedTxData = RLP.encode(txData)
  const encodedTx = encodeBase58Check(Buffer.from(encodedTxData))
  return `tx$${encodedTx}`
}

/**
 * Check key pair for validity, by signing a message, and then
 * verifying that signature
 * @param privateKey
 * @param publicKey
 * @return true if key pair is valid, false otherwise
 */
export function isValidKeypair (privateKey, publicKey) {
  const message = 'TheMessage'
  const signature = sign(message, privateKey)
  return verify(message, signature, publicKey)
}

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
      'ak$' + encodeBase58Check(buf[i][0]),
      'ak$' + encodeBase58Check(buf[i][1]),
      readInt(buf[i][2])
    ])
  }

  return updates
}

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
        previousRound: readInt(binary[3]),
        round: readInt(binary[4]),
        initiator: 'ak$' + encodeBase58Check(binary[5]),
        responder: 'ak$' + encodeBase58Check(binary[6]),
        initiatorAmount: readInt(binary[7]),
        responderAmount: readInt(binary[8]),
        updates: readOffChainTXUpdates(binary[9]),
        state: encodeBase58Check(binary[10])
      })
  }
}
