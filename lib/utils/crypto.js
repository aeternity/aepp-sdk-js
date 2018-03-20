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
const msgpack = require ('msgpack-lite')

let codec = msgpack.createCodec({int64: true});

const EC = require ('elliptic').ec

const aesjs = require ('aes-js')

const secp256k1EC = new EC ('secp256k1')

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

  generateKeyPair: () => {
    // <epoch>/apps/aens/test/aens_test_utils.erl
    const keyPair = secp256k1EC.genKeyPair ()
    const publicKey = Buffer.from (keyPair.getPublic ().encode ())
    const pubKeyAddress = Crypto.encodeBase58Check (publicKey)

    let privKeyAddress = keyPair.getPrivate ('hex')

    return {
      pub: `ak$${pubKeyAddress}`,
      priv: privKeyAddress
    }
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
    let key = secp256k1EC.keyFromPrivate (privateKey)
    return key.sign(Buffer.from(Crypto.hash(txBin))).toDER()
  },

  verify: (str, signature, publicKey) => {
    let key = secp256k1EC.keyFromPublic(publicKey)
    return key.verify(Buffer.from(Crypto.hash(str)), signature)
  },


  decodeTx: (txHash) => {
    let decodedTx = Crypto.decodeBase58Check (txHash.split ('$')[1])
    return msgpack.decode (Buffer.from (decodedTx, 'hex'), {codec: codec})
  },

  encodeTx: (txData) => {
    let encodedTxData = msgpack.encode (txData, {codec: codec})
    let encodedTx = Crypto.encodeBase58Check (Buffer.from (encodedTxData))
    return `tx$${encodedTx}`
  }

}

module.exports = Crypto
