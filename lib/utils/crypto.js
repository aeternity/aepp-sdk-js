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


// C = #crypto{algo   = ecdsa,
//   type   = ecdh,
//   digest = sha256,
//   curve = secp256k1},

// if (!String.prototype.padEnd) {
//   console.log('make available')
//   String.prototype.padEnd = function padEnd(targetLength,padString) {
//     targetLength = targetLength>>0; //floor if number or convert non-number to 0;
//     padString = String((typeof padString !== 'undefined' ? padString : ' '));
//     if (this.length > targetLength) {
//       return String(this);
//     }
//     else {
//       targetLength = targetLength-this.length;
//       if (targetLength > padString.length) {
//         padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
//       }
//       return String(this) + padString.slice(0,targetLength);
//     }
//   };
// }

const {leftPad, rightPad} = require('./string')

const bs58 = require('bs58')


const cryptoConfig = {
  algo: 'ecdsa',
  type: 'ecdh',
  digest: 'sha256',
  curve: 'secp256k1'
}

const sha256 = require('sha256')
const EC = require('elliptic').ec

const secp256k1EC = new EC('secp256k1')
const curve25519 = new EC('curve25519')

// const aesjs = require('aes-js')
// const shajs = require('sha.js')
//
// const PRIV_SIZE = 32

// const ecSign = (msgHash, privateKey) => {
//   const sig = secp256k1.sign(msgHash, privateKey)
//
//   const ret = {}
//   ret.r = sig.signature.slice(0, 32)
//   ret.s = sig.signature.slice(32, 64)
//   ret.v = sig.recovery + 27
//   return ret
// }

// const padPrivkey = (input) => {
//   // return aesjs.utils.utf8.toBytes(input).padStart(PRIV_SIZE, '\0')
//   return leftPad(PRIV_SIZE, input)
// }
//
// const padding128 = (input) => {
//   // return aesjs.utils.utf8.toBytes(input).padEnd(128, '\0')
//   let inputBinary = aesjs.utils.utf8.toBytes(input)
//   return rightPad(128, input)
// }
//
// const hash = (input) => {
//   return shajs('sha256').update(input).digest('hex')
// }

// const encryptPubkey = (password, pubKey) => {
//   // crypto:block_encrypt(aes_ecb, hash(Password),  padding128(Bin)).
//   let pwBytes = aesjs.utils.utf8.toBytes(hash(password))
//   let paddedPubKey = padding128(pubKey)
//   let bytesArray = aesjs.utils.utf8.toBytes(paddedPubKey)
//   let aesEcb = new aesjs.ModeOfOperation.ecb(bytesArray)
//   return aesEcb.encrypt(pwBytes)
// }
//
// const encryptPrivateKey = (password, privateKey) => {
//   let pwBytes = aesjs.utils.utf8.toBytes(hash(password))
//   let privateKeyBytes = aesjs.utils.utf8.toBytes(padPrivkey(privateKey))
//   let aesEcb = new aesjs.ModeOfOperation.ecb(privateKeyBytes)
//   return aesEcb.encrypt(pwBytes)
// }

// <epoch>/apps/aecore/src/aec_base58c.erl:checkStr

const getCheckString = (input) => {
  return sha256 (sha256 (input)).substring (0, 4)
}

const encodeBase58 = (input) => {
  const inputBytes = Buffer.from(input)
  // get check string and convert to bytes
  const checkSumBytes = Buffer.from(getCheckString(input), 'utf-8')
  // <epoch>/apps/aecore/src/aec_base58c.erl:base58_check
  // ... as in `binary_to_base58` just append the encoded strings
  return bs58.encode(Buffer.concat([inputBytes, checkSumBytes])) //  + bs58.encode(checkSumBytes)
}

const decodeBase58 = (str) => {
  let decoded = bs58.decode(str)
  let size = decoded.length
  let body = decoded.slice(0, size-4)
  let checkSum = decoded.slice(size-4)
  let bodyString = body.toString('utf-8')
  if (checkSum.toString() === getCheckString(bodyString)) {
    return bodyString
  } else {
    throw Error('Checksum does not match')
  }
}

const generateKeyPair = () => {
  // <epoch>/apps/aens/test/aens_test_utils.erl
  const keyPair = secp256k1EC.genKeyPair()
  const publicKey = keyPair.getPublic().encode()

  const pubKeyAddress = encodeBase58(publicKey)

  let privKeyAddress = keyPair.getPrivate('hex')
  return {
    pub: `ak$${pubKeyAddress}`,
    priv: privKeyAddress
  }
}

module.exports = {
  generateKeyPair,
  encodeBase58,
  decodeBase58,
  getCheckString
}
