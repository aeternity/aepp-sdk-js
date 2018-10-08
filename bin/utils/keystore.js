import crypto from 'crypto'
import createKeccakHash from 'keccak'
import scrypt from 'scrypt-js'
const OPTIONS = {

  // Symmetric cipher for private key encryption
  cipher: "aes-128-ctr",

  // Initialization vector size in bytes
  ivBytes: 16,

  // ECDSA private key size in bytes
  keyBytes: 32,

  // Key derivation function parameters
  pbkdf2: {
    c: 262144,
    dklen: 32,
    hash: "sha256",
    prf: "hmac-sha256"
  },
  scrypt: {
    memory: 280000000,
    dklen: 32,
    n: 262144,
    r: 1,
    p: 8
  }
}

function keccak256(buffer) {
  return createKeccakHash("keccak256").update(buffer).digest();
}

/**
 * Check whether a string is valid hex.
 * @param {string} str String to validate.
 * @return {boolean} True if the string is valid hex, false otherwise.
 */
function isHex (str) {
  if (str.length % 2 === 0 && str.match(/^[0-9a-f]+$/i)) return true;
  return false;
}

/**
 * Check whether a string is valid base-64.
 * @param {string} str String to validate.
 * @return {boolean} True if the string is valid base-64, false otherwise.
 */
function isBase64 (str) {
  let index;
  if (str.length % 4 > 0 || str.match(/[^0-9a-z+\/=]/i)) return false;
  index = str.indexOf("=");
  if (index === -1 || str.slice(index).match(/={1,2}/)) return true;
  return false;
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
  if (!str || str.constructor !== String) return str;
  if (!enc && isHex(str)) enc = "hex";
  if (!enc && isBase64(str)) enc = "base64";
  return Buffer.from(str, enc);
}

/**
 * Check if the selected cipher is available.
 * @param {string} algo Encryption algorithm.
 * @return {boolean} If available true, otherwise false.
 */
function isCipherAvailable (cipher) {
  return crypto.getCiphers().some(function (name) { return name === cipher; });
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
  let cipher, ciphertext;
  algo = algo || OPTIONS.cipher;
  if (!isCipherAvailable(algo)) throw new Error(algo + " is not available");
  cipher = crypto.createCipheriv(algo, str2buf(key), str2buf(iv));
  ciphertext = cipher.update(str2buf(plaintext));
  return Buffer.concat([ciphertext, cipher.final()]);
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
  let decipher, plaintext;
  algo = algo || OPTIONS.cipher;
  if (!isCipherAvailable(algo)) throw new Error(algo + " is not available");
  decipher = crypto.createDecipheriv(algo, str2buf(key), str2buf(iv));
  plaintext = decipher.update(str2buf(ciphertext));
  return Buffer.concat([plaintext, decipher.final()]);
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
    ])).toString("hex");
  }
}

function deriveKeyUsingScryptInNode (password, salt, options, cb) {
  return scrypt(password, {
    N: options.kdfparams.n || OPTIONS.scrypt.n,
    r: options.kdfparams.r || OPTIONS.scrypt.r,
    p: options.kdfparams.p || OPTIONS.scrypt.p
  }, options.kdfparams.dklen || OPTIONS.scrypt.dklen, salt);
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
function deriveKey (password, salt, options, cb) {
  let prf
  if (typeof password === "undefined" || password === null || !salt) {
    throw new Error("Must provide password and salt to derive a key");
  }
  options = options || {};
  options.kdfparams = options.kdfparams || {};

  // convert strings to buffers
  password = str2buf(password, "utf8");
  salt = str2buf(salt);

  // use scrypt as key derivation function
  if (options.kdf === "scrypt") {
    return deriveKeyUsingScryptInNode(password, salt, options, cb);
  }

  // use default key derivation function (PBKDF2)
  prf = options.kdfparams.prf || OPTIONS.pbkdf2.prf;
  if (prf === "hmac-sha256") prf = "sha256";

    return this.crypto.pbkdf2Sync(
      password,
      salt,
      options.kdfparams.c || OPTIONS.pbkdf2.c,
      options.kdfparams.dklen || OPTIONS.pbkdf2.dklen,
      prf
    );
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
  let ciphertext, keyObject, algo;
  options = options || {};
  options.kdfparams = options.kdfparams || {};
  algo = options.cipher || OPTIONS.cipher;

  // encrypt using first 16 bytes of derived key
  ciphertext = this.encrypt(privateKey, derivedKey.slice(0, 16), iv, algo).toString("hex");

  keyObject = {
    address: this.privateKeyToAddress(privateKey).slice(2),
    crypto: {
      cipher: options.cipher || OPTIONS.cipher,
      ciphertext: ciphertext,
      cipherparams: { iv: iv.toString("hex") },
      mac: getMAC(derivedKey, ciphertext)
    },
    id: 'uuid.v4()', // use uuid to generate ID
    version: 3
  };

  if (options.kdf === "scrypt") {
    keyObject.crypto.kdf = "scrypt";
    keyObject.crypto.kdfparams = {
      dklen: options.kdfparams.dklen || OPTIONS.scrypt.dklen,
      n: options.kdfparams.n || OPTIONS.scrypt.n,
      r: options.kdfparams.r || OPTIONS.scrypt.r,
      p: options.kdfparams.p || OPTIONS.scrypt.p,
      salt: salt.toString("hex")
    };

  } else {
    keyObject.crypto.kdf = "pbkdf2";
    keyObject.crypto.kdfparams = {
      c: options.kdfparams.c || OPTIONS.pbkdf2.c,
      dklen: options.kdfparams.dklen || OPTIONS.pbkdf2.dklen,
      prf: options.kdfparams.prf || OPTIONS.pbkdf2.prf,
      salt: salt.toString("hex")
    };
  }
  return keyObject;
}

function dump() {}
function recover() {}



