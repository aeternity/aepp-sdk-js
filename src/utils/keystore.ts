import nacl from 'tweetnacl'
import { v4 as uuid } from '@aeternity/uuid'
import { ArgonType, hash } from '@aeternity/argon2-browser/dist/argon2-bundled.min.js'
import { getAddressFromPriv } from './crypto'
import { bytesToHex, hexToBytes } from './bytes'
import { InvalidPasswordError } from './errors'

/**
 * KeyStore module
 * @module @aeternity/aepp-sdk/es/utils/keystore
 * @example import { recover } from '@aeternity/aepp-sdk'
 * @example const { recover } = require('@aeternity/aepp-sdk')
 */

const DERIVED_KEY_FUNCTIONS = {
  async argon2id (
    pass: string | Uint8Array,
    salt: string | Uint8Array,
    params: Partial<Keystore['crypto']['kdf_params']>
  ): Promise<Uint8Array> {
    const { memlimit_kib: mem, opslimit: time } = params

    return (await hash({
      hashLen: 32,
      pass,
      salt,
      time,
      mem,
      type: ArgonType.Argon2id
    })).hash
  }
}

const CRYPTO_FUNCTIONS = {
  'xsalsa20-poly1305': {
    encrypt: nacl.secretbox,
    decrypt (...args: Parameters<typeof nacl.secretbox.open>): Uint8Array {
      const res = nacl.secretbox.open(...args)
      if (res == null) throw new InvalidPasswordError()
      return res
    }
  }
}

export interface Keystore {
  name: string
  version: 1
  public_key: string
  id: string
  crypto: {
    secret_type: 'ed25519'
    symmetric_alg: keyof typeof CRYPTO_FUNCTIONS
    ciphertext: string
    cipher_params: {
      nonce: string
    }
    kdf: keyof typeof DERIVED_KEY_FUNCTIONS
    kdf_params: {
      memlimit_kib: number
      opslimit: number
      parallelism: number
      salt: string
    }
  }
}

const CRYPTO_DEFAULTS = {
  secret_type: 'ed25519',
  symmetric_alg: 'xsalsa20-poly1305',
  kdf: 'argon2id',
  kdf_params: {
    memlimit_kib: 65536,
    opslimit: 3,
    parallelism: 1
  }
} as const

/**
 * Symmetric private key encryption using secret (derived) key.
 * @param {Uint8Array} plaintext Data to be encrypted.
 * @param {Uint8Array} key Secret key.
 * @param {Uint8Array} nonce Randomly generated nonce.
 * @param {String} [algo=xsalsa20-poly1305] Encryption algorithm.
 * @return {Uint8Array} Encrypted data.
 */
function encrypt (
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  algo: keyof typeof CRYPTO_FUNCTIONS = CRYPTO_DEFAULTS.symmetric_alg
): Uint8Array {
  return CRYPTO_FUNCTIONS[algo].encrypt(plaintext, nonce, key)
}

/**
 * Symmetric private key decryption using secret (derived) key.
 * @param {Uint8Array} ciphertext Data to be decrypted.
 * @param {Uint8Array} key Secret key.
 * @param {Uint8Array} nonce Nonce from key-object.
 * @param {String} [algo=xsalsa20-poly1305] Encryption algorithm.
 * @return {Buffer} Decrypted data.
 */
function decrypt (
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  algo: keyof typeof CRYPTO_FUNCTIONS = CRYPTO_DEFAULTS.symmetric_alg
): Uint8Array {
  return CRYPTO_FUNCTIONS[algo].decrypt(ciphertext, nonce, key)
}

/**
 * Derive secret key from password with key derivation function.
 * @param {String|Uint8Array} password User-supplied password.
 * @param {String|Uint8Array} nonce Randomly generated nonce.
 * @param {String} kdf Key derivation function.
 * @param {Object} kdfParams KDF parameters.
 * @return {Uint8Array} Secret key derived from password.
 */
async function deriveKey (
  password: string | Uint8Array,
  nonce: string | Uint8Array,
  kdf: Keystore['crypto']['kdf'],
  kdfParams: Omit<Keystore['crypto']['kdf_params'], 'salt'>
): Promise<Uint8Array> {
  return await DERIVED_KEY_FUNCTIONS[kdf](password, nonce, kdfParams)
}

/**
 * Recover plaintext private key from secret-storage key object.
 * @param {String|Uint8Array} password Keystore object password.
 * @param {Object} keystore Keystore object.
 * @return {Buffer} Plaintext private key.
 */
export async function recover (
  password: string | Uint8Array, { crypto }: Keystore
): Promise<string> {
  const salt = hexToBytes(crypto.kdf_params.salt)
  return bytesToHex(decrypt(
    hexToBytes(crypto.ciphertext),
    await deriveKey(password, salt, crypto.kdf, crypto.kdf_params),
    hexToBytes(crypto.cipher_params.nonce),
    crypto.symmetric_alg
  ))
}

/**
 * Export private key to keystore secret-storage format.
 * @param {String} name Key name.
 * @param {String|Uint8Array} password User-supplied password.
 * @param {String|Uint8Array} privateKey Private key as hex-string or a Buffer.
 * @param {Buffer} nonce Randomly generated 24byte nonce.
 * @param {Buffer} salt Randomly generated 16byte salt.
 * @param {Partial<Keystore['crypto']>} [options] Encryption parameters.
 * @param {String} [options.kdf=argon2id] Key derivation function.
 * @param {Object} [options.kdf_params] KDF parameters.
 * @return {Object}
 */
export async function dump (
  name: string,
  password: string | Uint8Array,
  privateKey: string | Uint8Array,
  nonce: Uint8Array = nacl.randomBytes(24),
  salt: Uint8Array = nacl.randomBytes(16),
  options?: Partial<Keystore['crypto']>
): Promise<Keystore> {
  const opt = { ...CRYPTO_DEFAULTS, ...options }
  const derivedKey = await deriveKey(password, salt, opt.kdf, opt.kdf_params)
  const payload = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey
  return {
    name,
    version: 1,
    public_key: getAddressFromPriv(payload),
    id: uuid(),
    crypto: {
      secret_type: opt.secret_type,
      symmetric_alg: opt.symmetric_alg,
      ciphertext: bytesToHex(encrypt(payload, derivedKey, nonce, opt.symmetric_alg)),
      cipher_params: { nonce: bytesToHex(nonce) },
      kdf: opt.kdf,
      kdf_params: {
        ...opt.kdf_params,
        salt: bytesToHex(salt)
      }
    }
  }
}
