





  

```js
import crypto from 'crypto'
import createKeccakHash from 'keccak'
import scrypt from 'scrypt'
import nacl from 'tweetnacl'

import { encodeBase58Check } from '../../es/utils/crypto'

const OPTIONS = {

```







Symmetric cipher for private key encryption


  

```js
  cipher: 'aes-128-ctr',

```







Initialization vector size in bytes


  

```js
  ivBytes: 16,

```







ECDSA private key size in bytes


  

```js
  keyBytes: 32,

```







Key derivation function parameters


  

```js
  pbkdf2: {
    c: 262144,
    dklen: 32,
    hash: 'sha256',
    prf: 'hmac-sha256'
  },
  scrypt: {
    memory: 280000000,
    dklen: 32,
    n: 262144,
    r: 8,
    p: 1
  }
}

function keccak256 (buffer) {
  return createKeccakHash('keccak256').update(buffer).digest()
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
 * Check if the selected cipher is available.
 * @param {string} algo Encryption algorithm.
 * @return {boolean} If available true, otherwise false.
 */
function isCipherAvailable (cipher) {
  return crypto.getCiphers().some(function (name) { return name === cipher })
}

/**
 * Symmetric private key encryption using secret (derived) key.
 * @param {buffer|string} plaintext Data to be encrypted.
 * @param {buffer|string} key Secret key.
 * @param {buffer|string} iv Initialization vector.
 * @param {string=} algo Encryption algorithm (default: constants.cipher).
 * @return {buffer} Encrypted data.
 */
function encrypt (plaintext, key, iv, algo) {
  let cipher, ciphertext
  algo = algo || OPTIONS.cipher
  if (!isCipherAvailable(algo)) throw new Error(algo + ' is not available')
  cipher = crypto.createCipheriv(algo, str2buf(key), str2buf(iv))
  ciphertext = cipher.update(str2buf(plaintext))
  return Buffer.concat([ciphertext, cipher.final()])
}

/**
 * Symmetric private key decryption using secret (derived) key.
 * @param {buffer|string} ciphertext Data to be decrypted.
 * @param {buffer|string} key Secret key.
 * @param {buffer|string} iv Initialization vector.
 * @param {string=} algo Encryption algorithm (default: constants.cipher).
 * @return {buffer} Decrypted data.
 */
function decrypt (ciphertext, key, iv, algo) {
  let decipher, plaintext
  algo = algo || OPTIONS.cipher
  if (!isCipherAvailable(algo)) throw new Error(algo + ' is not available')
  decipher = crypto.createDecipheriv(algo, str2buf(key), str2buf(iv))
  plaintext = decipher.update(str2buf(ciphertext))
  return Buffer.concat([plaintext, decipher.final()])
}

/**
 * Calculate message authentication code from secret (derived) key and
 * encrypted text.  The MAC is the keccak-256 hash of the byte array
 * formed by concatenating the second 16 bytes of the derived key with
 * the ciphertext key's contents.
 * @param {buffer|string} derivedKey Secret key derived from password.
 * @param {buffer|string} ciphertext Text encrypted with secret key.
 * @return {string} Hex-encoded MAC.
 */
function getMAC (derivedKey, ciphertext) {
  if (derivedKey !== undefined && derivedKey !== null && ciphertext !== undefined && ciphertext !== null) {
    return keccak256(Buffer.concat([
      str2buf(derivedKey).slice(16, 32),
      str2buf(ciphertext)
    ])).toString('hex')
  }
}

/**
 * Derive secret key from password with key dervation function.
 * @param {string|buffer} password User-supplied password.
 * @param {string|buffer} salt Randomly generated salt.
 * @param {Object=} options Encryption parameters.
 * @param {string=} options.kdf Key derivation function (default: pbkdf2).
 * @param {string=} options.cipher Symmetric cipher (default: constants.cipher).
 * @param {Object=} options.kdfparams KDF parameters (default: constants.<kdf>).
 * @param {function=} cb Callback function (optional).
 * @return {buffer} Secret key derived from password.
 */
async function deriveKey (password, salt, options, cb) {
  if (typeof password === 'undefined' || password === null || !salt) {
    throw new Error('Must provide password and salt to derive a key')
  }
  options = options || {}
  options.kdfparams = options.kdfparams || OPTIONS.scrypt


```







convert strings to buffers


  

```js
  password = str2buf(password)
  salt = str2buf(salt)


```







TODO add support of pbkdf2
use scrypt as key derivation function


  

```js
  return await deriveKeyUsingScrypt(password, salt, options, cb)
}

async function deriveKeyUsingScrypt (password, salt, options) {
  const {n: N, r, p, dklen} = options.kdfparams
  return await scrypt.hash(password, { N, r, p }, dklen, salt)
}

/**
 * Assemble key data object in secret-storage format.
 * @param {buffer} derivedKey Password-derived secret key.
 * @param {buffer} privateKey Private key.
 * @param {buffer} salt Randomly generated salt.
 * @param {buffer} iv Initialization vector.
 * @param {Object=} options Encryption parameters.
 * @param {string=} options.kdf Key derivation function (default: pbkdf2).
 * @param {string=} options.cipher Symmetric cipher (default: constants.cipher).
 * @param {Object=} options.kdfparams KDF parameters (default: constants.<kdf>).
 * @return {Object}
 */
function marshal (derivedKey, privateKey, salt, iv, options) {
  let ciphertext, keyObject, algo
  options = options || {}
  options.kdf = 'scrypt' //Always use SCRYPT
  options.kdfparams = options.kdfparams || OPTIONS.scrypt
  algo = options.cipher || OPTIONS.cipher


```







encrypt using first 16 bytes of derived key


  

```js
  ciphertext = encrypt(privateKey, derivedKey.slice(0, 16), iv, algo).toString('hex')

  keyObject = {
    address: getAddressFromPriv(privateKey),
    crypto: {
      cipher: options.cipher || OPTIONS.cipher,
      ciphertext: ciphertext,
      cipherparams: { iv: iv.toString('hex') },
      mac: getMAC(derivedKey, ciphertext)
    },
    id: 'uuid.v4()', // use uuid to generate ID
    version: 3
  }

  if (options.kdf === 'scrypt') {
    keyObject.crypto.kdf = 'scrypt'
    keyObject.crypto.kdfparams = {
      dklen: options.kdfparams.dklen || OPTIONS.scrypt.dklen,
      n: options.kdfparams.n || OPTIONS.scrypt.n,
      r: options.kdfparams.r || OPTIONS.scrypt.r,
      p: options.kdfparams.p || OPTIONS.scrypt.p,
      salt: salt.toString('hex')
    }

  }
  return keyObject
}

export function getAddressFromPriv (secret) {
  const keys = nacl.sign.keyPair.fromSecretKey(str2buf(secret))
  const publicBuffer = Buffer.from(keys.publicKey)
  return `ak_${encodeBase58Check(publicBuffer)}`
}

/**
 * Recover plaintext private key from secret-storage key object.
 * @param {Object} keyObject Keystore object.
 * @param {function=} cb Callback function (optional).
 * @return {buffer} Plaintext private key.
 */
export async function recover (password, keyObject, cb) {
  const keyObjectCrypto = keyObject.Crypto || keyObject.crypto
  let { ciphertext, chiper: algo } = keyObjectCrypto
  const iv = str2buf(keyObjectCrypto.cipherparams.iv)
  const salt = str2buf(keyObjectCrypto.kdfparams.salt)


```







verify that message authentication codes match, then decrypt


  

```js
  function verifyAndDecrypt (derivedKey, salt, iv, ciphertext, algo) {
    if (getMAC(derivedKey, ciphertext) !== keyObjectCrypto.mac) {
      throw new Error('Wrong password')
    }
    return decrypt(ciphertext, derivedKey.slice(0, 16), iv, algo)
  }

  ciphertext = str2buf(ciphertext)


```







Get derive key using scrypt


  

```js
  const dKey = await deriveKey(password, salt, keyObjectCrypto)


```







Verify deriveKey and decrypt


  

```js
  return verifyAndDecrypt.bind(this)(dKey, salt, iv, ciphertext, algo).toString('hex')
}

/**
 * Export private key to keystore secret-storage format.
 * @param {string|buffer} password User-supplied password.
 * @param {string|buffer} privateKey Private key.
 * @param {string|buffer} salt Randomly generated salt.
 * @param {string|buffer} iv Initialization vector.
 * @param {Object=} options Encryption parameters.
 * @param {string=} options.kdf Key derivation function (default: pbkdf2).
 * @param {string=} options.cipher Symmetric cipher (default: constants.cipher).
 * @param {Object=} options.kdfparams KDF parameters (default: constants.<kdf>).
 * @param {function=} cb Callback function (optional).
 * @return {Object}
 */
export async function dump (
  password,
  privateKey,
  salt = Buffer.from(nacl.randomBytes(128).slice(OPTIONS.keyBytes + OPTIONS.ivBytes)),
  iv = Buffer.from(nacl.randomBytes(128).slice(OPTIONS.keyBytes, OPTIONS.keyBytes + OPTIONS.ivBytes)),
  options
) {

  options = options || {}
  iv = str2buf(iv)
  privateKey = str2buf(privateKey)

  const dKey = await deriveKey(password, salt, options)
  return marshal(dKey, privateKey, salt, iv, options)
}

/**
 * Generate filename for a keystore file.
 * @param {string} address address.
 * @return {string} Keystore filename.
 */
export function generateKeystoreFilename (address) {
  let filename = "UTC--" + new Date().toISOString() + "--" + address


```







Windows does not permit ":" in filenames, replace all with "-"


  

```js
  if (process.platform === "win32") filename = filename.split(":").join("-")

  return filename
}






```




