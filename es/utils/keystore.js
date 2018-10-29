import nacl from 'tweetnacl'
import * as argon2 from 'argon2'
import uuid from 'uuid'

import { encodeBase58Check } from './crypto'

const DEFAULTS = {
  crypto: {
    secret_type: 'ed25519',
    symmetric_alg: 'xsalsa20-poly1305',
    kdf: 'argon2id',
    kdf_params: {
      memlimit: 1024,
      opslimit: 3
    }
  }
}

// DERIVED KEY PART
const DERIVED_KEY_FUNCTIONS = {
  'argon2id': deriveKeyUsingArgon2id
}

async function deriveKeyUsingArgon2id (password, nonce, options) {
  const { memlimit: memoryCost, opslimit: parallelism } = options.kdf_params
  return argon2.hash(password, { memoryCost, parallelism, type: argon2.argon2id, raw: true, salt: nonce })
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
 * Check whether a string is valid hex.
 * @param {string} str String to validate.
 * @return {boolean} True if the string is valid hex, false otherwise.
 */
function isHex (str) {
  return !!(str.length % 2 === 0 && str.match(/^[0-9a-f]+$/i))
}

/**
 * Check whether a string is valid base-64.
 * @param {string} str String to validate.
 * @return {boolean} True if the string is valid base-64, false otherwise.
 */
function isBase64 (str) {
  let index
  if (str.length % 4 > 0 || str.match(/[^0-9a-z+\/=]/i)) return false
  index = str.indexOf('=')
  return !!(index === -1 || str.slice(index).match(/={1,2}/))
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
async function deriveKey (password, nonce, options = { kdf_params: DEFAULTS.crypto.kdf_params, kdf: DEFAULTS.crypto.kdf }) {
  if (typeof password === 'undefined' || password === null || !nonce) {
    throw new Error('Must provide password and nonce to derive a key')
  }

  if (!DERIVED_KEY_FUNCTIONS.hasOwnProperty(options.kdf)) throw new Error('Unsupported kdf type')

  return await DERIVED_KEY_FUNCTIONS[options.kdf](password, nonce, options)
}

/**
 * Assemble key data object in secret-storage format.
 * @param {buffer} name Key name.
 * @param {buffer} derivedKey Password-derived secret key.
 * @param {buffer} privateKey Private key.
 * @param {buffer} nonce Randomly generated nonce.
 * @param {Object=} options Encryption parameters.
 * @param {string=} options.kdf Key derivation function (default: pbkdf2).
 * @param {string=} options.cipher Symmetric cipher (default: constants.cipher).
 * @param {Object=} options.kdfparams KDF parameters (default: constants.<kdf>).
 * @return {Object}
 */
function marshal (name, derivedKey, privateKey, nonce, options = {}) {
  const opt = Object.assign({}, DEFAULTS.crypto, options)
  return Object.assign(
    { name, version: 1, address: getAddressFromPriv(privateKey), id: uuid.v4() },
    { crypto: Object.assign(
      {
        secret_type: opt.secret_type,
        symmetric_alg: opt.symmetric_alg,
        ciphertext: Buffer.from(encrypt(Buffer.from(privateKey), derivedKey, nonce, opt.symmetric_alg)).toString('hex'),
        cipher_params: { nonce: Buffer.from(nonce).toString('hex') }
      },
      { kdf: opt.kdf, kdf_params: opt.kdf_params }
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
 * @param {string} password Keystore object password.
 * @param {Object} keyObject Keystore object.
 * @return {buffer} Plaintext private key.
 */
export async function recover (password, keyObject) {
  validateKeyObj(keyObject)
  const nonce = Uint8Array.from(str2buf(keyObject.crypto.cipher_params.nonce))
  const key = await decrypt(
    Uint8Array.from(str2buf(keyObject.crypto.ciphertext)),
    await deriveKey(password, nonce),
    nonce,
    keyObject.crypto.symmetric_alg
  )
  if (!key) throw new Error('Invalid password or nonce')
  return Buffer.from(key).toString('hex')
}

/**
 * Export private key to keystore secret-storage format.
 * @param {string|buffer} name Key name.
 * @param {string|buffer} password User-supplied password.
 * @param {string|buffer} privateKey Private key.
 * @param {buffer|Uint8Array} nonce Randomly generated nonce.
 * @param {Object=} options Encryption parameters.
 * @param {string=} options.kdf Key derivation function (default: pbkdf2).
 * @param {string=} options.cipher Symmetric cipher (default: constants.cipher).
 * @param {Object=} options.kdfparams KDF parameters (default: constants.<kdf>).
 * @return {Object}
 */
export async function dump (name, password, privateKey, nonce = nacl.randomBytes(24), options = {}) {
  const opt = Object.assign({}, DEFAULTS.crypto, options)
  return marshal(
    name,
    await deriveKey(password, nonce, opt),
    privateKey,
    nonce,
    opt
  )
}

function validateKeyObj (obj) {
  const root = ['crypto', 'id', 'version', 'address']
  const crypto_keys = ['cipher_params', 'ciphertext', 'symmetric_alg', 'kdf', 'kdf_params']

  const missingRootKeys = root.filter(key => !obj.hasOwnProperty(key))
  if (missingRootKeys.length) throw new Error(`Invalid key file format. Require properties: ${missingRootKeys}`)

  const missingCryptoKeys = crypto_keys.filter(key => !obj['crypto'].hasOwnProperty(key))
  if (missingCryptoKeys.length) throw new Error(`Invalid key file format. Require properties: ${missingCryptoKeys}`)

  return true
}



