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

require ('@babel/polyfill')

const bs58check = require ('bs58check')
const shajs = require ('sha.js')
const RLP = require('rlp')

const nacl = require('tweetnacl')

const aesjs = require ('aes-js')

const {leftPad, rightPad} = require('./bytes')

const Crypto = {
  hash: (input) => {
    return shajs ('sha256').update (input).digest()
  },

  encodeBase58Check: (input) => {
    return bs58check.encode (input)
  },

  decodeBase58Check: (str) => {
    return bs58check.decode (str)
  },

  generateKeyPair: (raw = false) => {
    // <epoch>/apps/aens/test/aens_test_utils.erl
    let keyPair = nacl.sign.keyPair()

    let publicBuffer = Buffer.from(keyPair.publicKey)
    let secretBuffer = Buffer.from(keyPair.secretKey)

    if (raw) {
      return {
        pub: publicBuffer,
        priv: secretBuffer
      }
    } else {
      const pubKeyAddress = Crypto.encodeBase58Check (publicBuffer)

      return {
        pub: `ak$${pubKeyAddress}`,
        priv: secretBuffer.toString('hex')
      }
    }
  },

  getReadablePublicKey: (binaryKey) => {
    const publicKeyBuffer = Buffer.from (binaryKey, 'hex')
    const pubKeyAddress = Crypto.encodeBase58Check (publicKeyBuffer)
    return `ak$${pubKeyAddress}`
  },

  generateSaveWallet: (password) => {
    let keys = Crypto.generateKeyPair(true)
    return {
      pub: Crypto.encryptPublicKey(password, keys.pub),
      priv: Crypto.encryptPrivateKey(password, keys.priv)
    }
  },

  encryptPublicKey: (password, binaryKey) => {
    return Crypto.encryptKey(password, rightPad(128, binaryKey))
  },

  encryptPrivateKey: (password, binaryKey) => {
    return Crypto.encryptKey(password, leftPad(32, binaryKey))
  },

  encryptKey: (password, binaryData) => {
    let hashedPassword = Crypto.hash (password)
    let hashedPasswordBytes = Buffer.from (hashedPassword, 'hex')
    let aesEcb = new aesjs.ModeOfOperation.ecb (hashedPasswordBytes)
    return aesEcb.encrypt(binaryData)
  },

  decryptKey: (password, encrypted) => {
    const encryptedBytes = Buffer.from (encrypted)
    let hashedPassword = Crypto.hash (password)
    let hashedPasswordBytes = Buffer.from (hashedPassword, 'hex')
    let aesEcb = new aesjs.ModeOfOperation.ecb (hashedPasswordBytes)
    return Buffer.from (aesEcb.decrypt (encryptedBytes))
  },

  decryptPrivateKey: (password, encrypted) => {
    return Crypto.decryptKey(password, encrypted)
  },

  decryptPubKey: (password, encrypted) => {
    return Crypto.decryptKey (password, encrypted).slice (0, 65)
  },

  sign: (txBin, privateKey) => {
    let messageUint = new Uint8Array(txBin)
    return nacl.sign.detached(messageUint, privateKey)
  },

  verify: (str, signature, publicKey) => {
    let messageUint = new Uint8Array(str)
    return nacl.sign.detached.verify(messageUint, signature, publicKey)
  },

  decodeTx: (txHash) => {
    let decodedTx = Crypto.decodeBase58Check (txHash.split ('$')[1])
    var decoded = RLP.decode(Buffer.from (decodedTx, 'hex'));
    return decoded
  },

  encodeTx: (txData) => {
    const encodedTxData = RLP.encode(txData)
    const encodedTx = Crypto.encodeBase58Check (Buffer.from (encodedTxData))
    return `tx$${encodedTx}`
  },

  isValidKeypair: (privateKey, publicKey) => {
    let message = "TheMessage"
    let signature = Crypto.sign(message, privateKey)
    return Crypto.verify(message, signature, publicKey)
  }
}

module.exports = Crypto
