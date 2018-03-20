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
require('@babel/polyfill');

var bs58check = require('bs58check');

var shajs = require('sha.js');

var msgpack = require('msgpack-lite');

var codec = msgpack.createCodec({
  int64: true
});

var EC = require('elliptic').ec;

var aesjs = require('aes-js');

var secp256k1EC = new EC('secp256k1');

var _require = require('./bytes'),
    leftPad = _require.leftPad,
    rightPad = _require.rightPad;

var Crypto = {
  hash: function hash(input) {
    return shajs('sha256').update(input).digest();
  },
  encodeBase58Check: function encodeBase58Check(input) {
    return bs58check.encode(input);
  },
  decodeBase58Check: function decodeBase58Check(str) {
    return bs58check.decode(str);
  },
  generateKeyPair: function generateKeyPair() {
    var raw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    // <epoch>/apps/aens/test/aens_test_utils.erl
    var keyPair = secp256k1EC.genKeyPair();
    var binaryPublic = keyPair.getPublic();

    if (raw) {
      var privateBin = keyPair.getPrivate('hex');
      var privBuffer = Buffer.from(privateBin, 'hex');
      var pubBin = binaryPublic.encode('hex');
      var pubBuffer = Buffer.from(pubBin, 'hex');
      return {
        pub: pubBuffer,
        priv: privBuffer
      };
    } else {
      var publicKeyBuffer = Buffer.from(binaryPublic.encode());
      var pubKeyAddress = Crypto.encodeBase58Check(publicKeyBuffer);
      var privKeyAddress = keyPair.getPrivate('hex');
      return {
        pub: "ak$".concat(pubKeyAddress),
        priv: privKeyAddress
      };
    }
  },
  getReadablePublicKey: function getReadablePublicKey(binaryKey) {
    var publicKeyBuffer = Buffer.from(binaryKey, 'hex');
    var pubKeyAddress = Crypto.encodeBase58Check(publicKeyBuffer);
    return "ak$".concat(pubKeyAddress);
  },
  generateSaveWallet: function generateSaveWallet(password) {
    var keys = Crypto.generateKeyPair(true);
    return {
      pub: Crypto.encryptPublicKey(password, keys.pub),
      priv: Crypto.encryptPrivateKey(password, keys.priv)
    };
  },
  encryptPublicKey: function encryptPublicKey(password, binaryKey) {
    return Crypto.encryptKey(password, rightPad(128, binaryKey));
  },
  encryptPrivateKey: function encryptPrivateKey(password, binaryKey) {
    return Crypto.encryptKey(password, leftPad(32, binaryKey));
  },
  encryptKey: function encryptKey(password, binaryData) {
    var hashedPassword = Crypto.hash(password);
    var hashedPasswordBytes = Buffer.from(hashedPassword, 'hex');
    var aesEcb = new aesjs.ModeOfOperation.ecb(hashedPasswordBytes);
    return aesEcb.encrypt(binaryData);
  },
  decryptKey: function decryptKey(password, encrypted) {
    var encryptedBytes = Buffer.from(encrypted);
    var hashedPassword = Crypto.hash(password);
    var hashedPasswordBytes = Buffer.from(hashedPassword, 'hex');
    var aesEcb = new aesjs.ModeOfOperation.ecb(hashedPasswordBytes);
    return Buffer.from(aesEcb.decrypt(encryptedBytes));
  },
  decryptPrivateKey: function decryptPrivateKey(password, encrypted) {
    return Crypto.decryptKey(password, encrypted);
  },
  decryptPubKey: function decryptPubKey(password, encrypted) {
    return Crypto.decryptKey(password, encrypted).slice(0, 65);
  },
  sign: function sign(txBin, privateKey) {
    var key = secp256k1EC.keyFromPrivate(privateKey);
    return key.sign(Buffer.from(Crypto.hash(txBin))).toDER();
  },
  verify: function verify(str, signature, publicKey) {
    var key = secp256k1EC.keyFromPublic(publicKey);
    return key.verify(Buffer.from(Crypto.hash(str)), signature);
  },
  decodeTx: function decodeTx(txHash) {
    var decodedTx = Crypto.decodeBase58Check(txHash.split('$')[1]);
    return msgpack.decode(Buffer.from(decodedTx, 'hex'), {
      codec: codec
    });
  },
  encodeTx: function encodeTx(txData) {
    var encodedTxData = msgpack.encode(txData, {
      codec: codec
    });
    var encodedTx = Crypto.encodeBase58Check(Buffer.from(encodedTxData));
    return "tx$".concat(encodedTx);
  }
};
module.exports = Crypto;