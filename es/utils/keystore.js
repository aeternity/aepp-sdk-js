import nacl from 'tweetnacl'
import uuid from 'uuid'

import { encodeBase58Check, isBase64 } from './crypto'
import { isHex } from './string'

/**
 * KeyStore module
 * !!!Work only in node.js!!!
 * @module @aeternity/aepp-sdk/es/utils/keystore
 * @example import * as Crypto from '@aeternity/aepp-sdk/es/utils/keystore'
 */

const DEFAULTS = {
  crypto: {
    secret_type: 'ed25519',
    symmetric_alg: 'xsalsa20-poly1305',
    kdf: 'argon2id',
    kdf_params: {
      memlimit_kib: 65536,
      opslimit: 3,
      parallelism: 1
    }
  }
}

// DERIVED KEY PART
const DERIVED_KEY_FUNCTIONS = {
  'argon2id': deriveKeyUsingArgon2id
}

export async function deriveKeyUsingArgon2id (password, salt, options) {
  const { memlimit_kib: memoryCost, parallelism, opslimit: timeCost } = options.kdf_params
  const isBrowser = !(typeof module !== 'undefined' && module.exports)

  if (isBrowser) {
    const _sodium = require('libsodium-wrappers-sumo')

    return _sodium.ready.then(async () => {
      // tslint:disable-next-line:typedef
      const sodium = _sodium

      const result = sodium.crypto_pwhash(
        32,
        password,
        salt,
        timeCost,
        memoryCost * 1024,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      )
      return Buffer.from(result)
    })
  } else {
    const argon2 = require('argon2')
    return argon2.hash(password, { timeCost, memoryCost, parallelism, type: argon2.argon2id, raw: true, salt })
  }
}

// CRYPTO PART
const CRYPTO_FUNCTIONS = {
  'xsalsa20-poly1305': { encrypt: encryptXsalsa20Poly1305, decrypt: decryptXsalsa20Poly1305 }
}

function encryptXsalsa20Poly1305 ({ plaintext, key, nonce }) {
  return nacl.secretbox(plaintext, nonce, key)
}

function decryptXsalsa20Poly1305 ({ ciphertext, key, nonce }) {
  const res = nacl.secretbox.open(ciphertext, nonce, key)
  if (!res) throw new Error('Invalid password or nonce')
  return res
}

/**
 * Convert a string to a Buffer.  If encoding is not specified, hex-encoding
 * will be used if the input is valid hex.  If the input is valid base64 but
 * not valid hex, base64 will be used.  Otherwise, utf8 will be used.
 * @param {string} str String to be converted.
 * @param {string=} enc Encoding of the input string (optional).
 * @return {buffer} Buffer (bytearray) containing the input data.
 */
function str2buf (str, enc) {
  if (!str || str.constructor !== String) return str
  if (!enc && isHex(str)) enc = 'hex'
  if (!enc && isBase64(str)) enc = 'base64'
  return Buffer.from(str, enc)
}

/**
 * Symmetric private key encryption using secret (derived) key.
 * @param {buffer|string} plaintext Data to be encrypted.
 * @param {buffer|string} key Secret key.
 * @param {buffer|string} nonce Randomly generated nonce.
 * @param {string=} algo Encryption algorithm (default: DEFAULTS.crypto.symmetric_alg).
 * @return {buffer} Encrypted data.
 */
function encrypt (plaintext, key, nonce, algo = DEFAULTS.crypto.symmetric_alg) {
  if (!CRYPTO_FUNCTIONS[algo]) throw new Error(algo + ' is not available')
  return CRYPTO_FUNCTIONS[algo].encrypt({ plaintext, nonce, key })
}

/**
 * Symmetric private key decryption using secret (derived) key.
 * @param {buffer|Uint8Array} ciphertext Data to be decrypted.
 * @param {buffer|Uint8Array} key Secret key.
 * @param {buffer|Uint8Array} nonce Nonce from key-object.
 * @param {string=} algo Encryption algorithm.
 * @return {buffer} Decrypted data.
 */
function decrypt (ciphertext, key, nonce, algo) {
  if (!CRYPTO_FUNCTIONS[algo]) throw new Error(algo + ' is not available')
  return CRYPTO_FUNCTIONS[algo].decrypt({ ciphertext, nonce, key })
}

/**
 * Derive secret key from password with key derivation function.
 * @param {string} password User-supplied password.
 * @param {buffer|Uint8Array} nonce Randomly generated nonce.
 * @param {Object=} options Encryption parameters.
 * @param {string=} options.kdf Key derivation function (default: DEFAULTS.crypto.kdf).
 * @param {Object=} options.kdf_params KDF parameters (default: DEFAULTS.crypto.kdf_params).
 * @return {buffer} Secret key derived from password.
 */
async function deriveKey (password, nonce, options = {
  kdf_params: DEFAULTS.crypto.kdf_params,
  kdf: DEFAULTS.crypto.kdf
}) {
  if (typeof password === 'undefined' || password === null || !nonce) {
    throw new Error('Must provide password and nonce to derive a key')
  }

  if (!DERIVED_KEY_FUNCTIONS.hasOwnProperty(options.kdf)) throw new Error('Unsupported kdf type')

  return DERIVED_KEY_FUNCTIONS[options.kdf](password, nonce, options)
}

/**
 * Assemble key data object in secret-storage format.
 * @param {buffer} name Key name.
 * @param {buffer} derivedKey Password-derived secret key.
 * @param {buffer} privateKey Private key.
 * @param {buffer} nonce Randomly generated 24byte nonce.
 * @param {buffer} salt Randomly generated 16byte salt.
 * @param {Object=} options Encryption parameters.
 * @param {string=} options.kdf Key derivation function (default: argon2id).
 * @param {string=} options.cipher Symmetric cipher (default: constants.cipher).
 * @param {Object=} options.kdf_params KDF parameters (default: constants.<kdf>).
 * @return {Object}
 */
function marshal (name, derivedKey, privateKey, nonce, salt, options = {}) {
  const opt = Object.assign({}, DEFAULTS.crypto, options)
  return Object.assign(
    { name, version: 1, public_key: getAddressFromPriv(privateKey), id: uuid.v4() },
    {
      crypto: Object.assign(
        {
          secret_type: opt.secret_type,
          symmetric_alg: opt.symmetric_alg,
          ciphertext: Buffer.from(encrypt(Buffer.from(privateKey), derivedKey, nonce, opt.symmetric_alg)).toString('hex'),
          cipher_params: { nonce: Buffer.from(nonce).toString('hex') }
        },
        { kdf: opt.kdf, kdf_params: { ...opt.kdf_params, salt: Buffer.from(salt).toString('hex') } }
      )
    }
  )
}

export function getAddressFromPriv (secret) {
  const keys = nacl.sign.keyPair.fromSecretKey(str2buf(secret))
  const publicBuffer = Buffer.from(keys.publicKey)
  return `ak_${encodeBase58Check(publicBuffer)}`
}

/**
 * Recover plaintext private key from secret-storage key object.
 * @param {String} password Keystore object password.
 * @param {Object} keyObject Keystore object.
 * @return {Buffer} Plaintext private key.
 */
export async function recover (password, keyObject) {
  validateKeyObj(keyObject)
  const nonce = Uint8Array.from(str2buf(keyObject.crypto.cipher_params.nonce))
  const salt = Uint8Array.from(str2buf(keyObject.crypto.kdf_params.salt))
  const kdfParams = keyObject.crypto.kdf_params
  const kdf = keyObject.crypto.kdf

  const key = await decrypt(
    Uint8Array.from(str2buf(keyObject.crypto.ciphertext)),
    await deriveKey(password, salt, { kdf, kdf_params: kdfParams }),
    nonce,
    keyObject.crypto.symmetric_alg
  )
  if (!key) throw new Error('Invalid password')
  return Buffer.from(key).toString('hex')
}

/**
 * Export private key to keystore secret-storage format.
 * @param {String} name Key name.
 * @param {String} password User-supplied password.
 * @param {String} privateKey Private key.
 * @param {Buffer} nonce Randomly generated 24byte nonce.
 * @param {Buffer} salt Randomly generated 16byte salt.
 * @param {Object=} options Encryption parameters.
 * @param {String=} options.kdf Key derivation function (default: pbkdf2).
 * @param {String=} options.cipher Symmetric cipher (default: constants.cipher).
 * @param {Object=} options.kdfparams KDF parameters (default: constants.<kdf>).
 * @return {Object}
 */
export async function dump (name, password, privateKey, nonce = nacl.randomBytes(24), salt = nacl.randomBytes(16), options = {}) {
  const opt = Object.assign({}, DEFAULTS.crypto, options)
  return marshal(
    name,
    await deriveKey(password, salt, opt),
    privateKey,
    nonce,
    salt,
    opt
  )
}

export function validateKeyObj (obj) {
  const root = ['crypto', 'id', 'version', 'public_key']
  const cryptoKeys = ['cipher_params', 'ciphertext', 'symmetric_alg', 'kdf', 'kdf_params']

  const missingRootKeys = root.filter(key => !obj.hasOwnProperty(key))
  if (missingRootKeys.length) throw new Error(`Invalid key file format. Require properties: ${missingRootKeys}`)

  const missingCryptoKeys = cryptoKeys.filter(key => !obj['crypto'].hasOwnProperty(key))
  if (missingCryptoKeys.length) throw new Error(`Invalid key file format. Require properties: ${missingCryptoKeys}`)

  return true
}
