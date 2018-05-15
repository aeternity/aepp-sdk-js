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
import shajs from 'sha.js'
import RLP from 'rlp'
import nacl from 'tweetnacl'
import aesjs from 'aes-js'
import { leftPad, rightPad } from './bytes'

const Ecb = aesjs.ModeOfOperation.ecb

function hash (input) {
  return shajs('sha256').update(input).digest()
}

function encodeBase58Check (input) {
  return bs58check.encode(input)
}

function decodeBase58Check (str) {
  return bs58check.decode(str)
}

function generateKeyPair (raw = false) {
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

function encryptPublicKey (password, binaryKey) {
  return encryptKey(password, rightPad(32, binaryKey))
}

function encryptPrivateKey (password, binaryKey) {
  return encryptKey(password, leftPad(64, binaryKey))
}

function encryptKey (password, binaryData) {
  let hashedPassword = hash(password)
  let hashedPasswordBytes = Buffer.from(hashedPassword, 'hex')
  let aesEcb = new Ecb(hashedPasswordBytes)
  return aesEcb.encrypt(binaryData)
}

function decryptKey (password, encrypted) {
  const encryptedBytes = Buffer.from(encrypted)
  let hashedPassword = hash(password)
  let hashedPasswordBytes = Buffer.from(hashedPassword, 'hex')
  let aesEcb = new Ecb(hashedPasswordBytes)
  return Buffer.from(aesEcb.decrypt(encryptedBytes))
}

function sign (txBin, privateKey) {
  return nacl.sign.detached(new Uint8Array(txBin), privateKey)
}

function verify (str, signature, publicKey) {
  return nacl.sign.detached.verify(new Uint8Array(str), signature, publicKey)
}

export default {
  hash,
  encodeBase58Check,
  decodeBase58Check,
  generateKeyPair,

  getReadablePublicKey (binaryKey) {
    const publicKeyBuffer = Buffer.from(binaryKey, 'hex')
    const pubKeyAddress = encodeBase58Check(publicKeyBuffer)
    return `ak$${pubKeyAddress}`
  },

  generateSaveWallet (password) {
    let keys = generateKeyPair(true)
    return {
      pub: encryptPublicKey(password, keys.pub),
      priv: encryptPrivateKey(password, keys.priv)
    }
  },

  encryptPublicKey,
  encryptPrivateKey,
  encryptKey,
  decryptKey,

  decryptPrivateKey (password, encrypted) {
    return decryptKey(password, encrypted)
  },

  decryptPubKey (password, encrypted) {
    return decryptKey(password, encrypted).slice(0, 65)
  },

  sign,
  verify,

  decodeTx (txHash) {
    let decodedTx = decodeBase58Check(txHash.split('$')[1])
    var decoded = RLP.decode(Buffer.from(decodedTx, 'hex'))
    return decoded
  },

  encodeTx (txData) {
    const encodedTxData = RLP.encode(txData)
    const encodedTx = encodeBase58Check(Buffer.from(encodedTxData))
    return `tx$${encodedTx}`
  },

  isValidKeypair (privateKey, publicKey) {
    const message = 'TheMessage'
    const signature = sign(message, privateKey)
    return verify(message, signature, publicKey)
  }
}
