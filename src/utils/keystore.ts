import nacl from 'tweetnacl';
import { v4 as uuid } from '@aeternity/uuid';
import { hash, argon2id } from '@aeternity/argon2';
import { getAddressFromPriv } from './crypto';
import { InvalidPasswordError } from './errors';

const DERIVED_KEY_FUNCTIONS = {
  async argon2id(
    pass: string | Uint8Array,
    salt: string | Uint8Array,
    params: Partial<Keystore['crypto']['kdf_params']>,
  ): Promise<Uint8Array> {
    const { memlimit_kib: memoryCost, opslimit: timeCost } = params;

    return hash(pass, {
      hashLength: 32,
      salt,
      timeCost,
      memoryCost,
      type: argon2id,
    });
  },
};

const CRYPTO_FUNCTIONS = {
  'xsalsa20-poly1305': {
    encrypt: nacl.secretbox,
    decrypt(...args: Parameters<typeof nacl.secretbox.open>): Uint8Array {
      const res = nacl.secretbox.open(...args);
      if (res == null) throw new InvalidPasswordError();
      return res;
    },
  },
};

export interface Keystore {
  name: string;
  version: 1;
  public_key: string;
  id: string;
  crypto: {
    secret_type: 'ed25519';
    symmetric_alg: keyof typeof CRYPTO_FUNCTIONS;
    ciphertext: string;
    cipher_params: {
      nonce: string;
    };
    /**
     * Key derivation function name.
     */
    kdf: keyof typeof DERIVED_KEY_FUNCTIONS;
    /**
     * Key derivation function parameters.
     */
    kdf_params: {
      memlimit_kib: number;
      opslimit: number;
      parallelism: number;
      salt: string;
    };
  };
}

const CRYPTO_DEFAULTS = {
  secret_type: 'ed25519',
  symmetric_alg: 'xsalsa20-poly1305',
  kdf: 'argon2id',
  kdf_params: {
    memlimit_kib: 65536,
    opslimit: 3,
    parallelism: 1,
  },
} as const;

/**
 * Symmetric private key encryption using secret (derived) key.
 * @category keystore
 * @param plaintext - Data to be encrypted.
 * @param key - Secret key.
 * @param nonce - Randomly generated nonce.
 * @param algo - Encryption algorithm.
 * @returns Encrypted data.
 */
function encrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  algo: keyof typeof CRYPTO_FUNCTIONS = CRYPTO_DEFAULTS.symmetric_alg,
): Uint8Array {
  return CRYPTO_FUNCTIONS[algo].encrypt(plaintext, nonce, key);
}

/**
 * Symmetric private key decryption using secret (derived) key.
 * @category keystore
 * @param ciphertext - Data to be decrypted.
 * @param key - Secret key.
 * @param nonce - Nonce from key-object.
 * @param algo - Encryption algorithm.
 * @returns Decrypted data.
 */
function decrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  algo: keyof typeof CRYPTO_FUNCTIONS = CRYPTO_DEFAULTS.symmetric_alg,
): Uint8Array {
  return CRYPTO_FUNCTIONS[algo].decrypt(ciphertext, nonce, key);
}

/**
 * Derive secret key from password with key derivation function.
 * @category keystore
 * @param password - User-supplied password.
 * @param nonce - Randomly generated nonce.
 * @param kdf - Key derivation function.
 * @param kdfParams - KDF parameters.
 * @returns Secret key derived from password.
 */
async function deriveKey(
  password: string | Uint8Array,
  nonce: string | Uint8Array,
  kdf: Keystore['crypto']['kdf'],
  kdfParams: Omit<Keystore['crypto']['kdf_params'], 'salt'>,
): Promise<Uint8Array> {
  return DERIVED_KEY_FUNCTIONS[kdf](password, nonce, kdfParams);
}

/**
 * Recover plaintext private key from secret-storage key object.
 * @category keystore
 * @param password - Keystore object password.
 * @param keystore - Keystore object.
 * @returns Plaintext private key.
 */
export async function recover(
  password: string | Uint8Array,
  { crypto }: Keystore,
): Promise<string> {
  const salt = Buffer.from(crypto.kdf_params.salt, 'hex');
  return Buffer.from(decrypt(
    Buffer.from(crypto.ciphertext, 'hex'),
    await deriveKey(password, salt, crypto.kdf, crypto.kdf_params),
    Buffer.from(crypto.cipher_params.nonce, 'hex'),
    crypto.symmetric_alg,
  )).toString('hex');
}

/**
 * Export private key to keystore secret-storage format.
 * @category keystore
 * @param name - Key name.
 * @param password - User-supplied password.
 * @param privateKey - Private key as hex-string or a Buffer.
 * @param nonce - Randomly generated 24byte nonce.
 * @param salt - Randomly generated 16byte salt.
 * @param options - Encryption parameters.
 */
export async function dump(
  name: string,
  password: string | Uint8Array,
  privateKey: string | Uint8Array,
  nonce: Uint8Array = nacl.randomBytes(24),
  salt: Uint8Array = nacl.randomBytes(16),
  options?: Partial<Keystore['crypto']>,
): Promise<Keystore> {
  const opt = { ...CRYPTO_DEFAULTS, ...options };
  const derivedKey = await deriveKey(password, salt, opt.kdf, opt.kdf_params);
  const payload = typeof privateKey === 'string' ? Buffer.from(privateKey, 'hex') : privateKey;
  return {
    name,
    version: 1,
    public_key: getAddressFromPriv(payload),
    id: uuid(),
    crypto: {
      secret_type: opt.secret_type,
      symmetric_alg: opt.symmetric_alg,
      ciphertext: Buffer.from(
        encrypt(payload, derivedKey, nonce, opt.symmetric_alg),
      ).toString('hex'),
      cipher_params: { nonce: Buffer.from(nonce).toString('hex') },
      kdf: opt.kdf,
      kdf_params: {
        ...opt.kdf_params,
        salt: Buffer.from(salt).toString('hex'),
      },
    },
  };
}
