<a id="module_@aeternity/aepp-sdk/es/utils/keystore"></a>

## @aeternity/aepp-sdk/es/utils/keystore
KeyStore module
!!!Work only in node.js!!!

**Example**  
```js
import * as Crypto from '@aeternity/aepp-sdk/es/utils/keystore'
```

* [@aeternity/aepp-sdk/es/utils/keystore](#module_@aeternity/aepp-sdk/es/utils/keystore)
    * _static_
        * [.recover(password, keyObject)](#module_@aeternity/aepp-sdk/es/utils/keystore.recover) ⇒ `Buffer`
        * [.dump(name, password, privateKey, nonce, salt, [options])](#module_@aeternity/aepp-sdk/es/utils/keystore.dump) ⇒ `Object`
    * _inner_
        * [~str2buf(str, [enc])](#module_@aeternity/aepp-sdk/es/utils/keystore..str2buf) ⇒ `buffer`
        * [~encrypt(plaintext, key, nonce, [algo])](#module_@aeternity/aepp-sdk/es/utils/keystore..encrypt) ⇒ `buffer`
        * [~decrypt(ciphertext, key, nonce, [algo])](#module_@aeternity/aepp-sdk/es/utils/keystore..decrypt) ⇒ `buffer`
        * [~deriveKey(password, nonce, [options])](#module_@aeternity/aepp-sdk/es/utils/keystore..deriveKey) ⇒ `buffer`
        * [~marshal(name, derivedKey, privateKey, nonce, salt, [options])](#module_@aeternity/aepp-sdk/es/utils/keystore..marshal) ⇒ `Object`

<a id="module_@aeternity/aepp-sdk/es/utils/keystore.recover"></a>

### @aeternity/aepp-sdk/es/utils/keystore.recover(password, keyObject) ⇒ `Buffer`
Recover plaintext private key from secret-storage key object.

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/keystore`](#module_@aeternity/aepp-sdk/es/utils/keystore)  
**Returns**: `Buffer` - Plaintext private key.  

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Keystore object password. |
| keyObject | `Object` | Keystore object. |

<a id="module_@aeternity/aepp-sdk/es/utils/keystore.dump"></a>

### @aeternity/aepp-sdk/es/utils/keystore.dump(name, password, privateKey, nonce, salt, [options]) ⇒ `Object`
Export private key to keystore secret-storage format.

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/keystore`](#module_@aeternity/aepp-sdk/es/utils/keystore)  

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Key name. |
| password | `String` | User-supplied password. |
| privateKey | `String` | Private key. |
| nonce | `Buffer` | Randomly generated 24byte nonce. |
| salt | `Buffer` | Randomly generated 16byte salt. |
| [options] | `Object` | Encryption parameters. |
| [options.kdf] | `String` | Key derivation function (default: pbkdf2). |
| [options.cipher] | `String` | Symmetric cipher (default: constants.cipher). |
| [options.kdfparams] | `Object` | KDF parameters (default: constants.<kdf>). |

<a id="module_@aeternity/aepp-sdk/es/utils/keystore..str2buf"></a>

### @aeternity/aepp-sdk/es/utils/keystore~str2buf(str, [enc]) ⇒ `buffer`
Convert a string to a Buffer.  If encoding is not specified, hex-encoding
will be used if the input is valid hex.  If the input is valid base64 but
not valid hex, base64 will be used.  Otherwise, utf8 will be used.

**Kind**: inner method of [`@aeternity/aepp-sdk/es/utils/keystore`](#module_@aeternity/aepp-sdk/es/utils/keystore)  
**Returns**: `buffer` - Buffer (bytearray) containing the input data.  

| Param | Type | Description |
| --- | --- | --- |
| str | `string` | String to be converted. |
| [enc] | `string` | Encoding of the input string (optional). |

<a id="module_@aeternity/aepp-sdk/es/utils/keystore..encrypt"></a>

### @aeternity/aepp-sdk/es/utils/keystore~encrypt(plaintext, key, nonce, [algo]) ⇒ `buffer`
Symmetric private key encryption using secret (derived) key.

**Kind**: inner method of [`@aeternity/aepp-sdk/es/utils/keystore`](#module_@aeternity/aepp-sdk/es/utils/keystore)  
**Returns**: `buffer` - Encrypted data.  

| Param | Type | Description |
| --- | --- | --- |
| plaintext | `buffer` \| `string` | Data to be encrypted. |
| key | `buffer` \| `string` | Secret key. |
| nonce | `buffer` \| `string` | Randomly generated nonce. |
| [algo] | `string` | Encryption algorithm (default: DEFAULTS.crypto.symmetric_alg). |

<a id="module_@aeternity/aepp-sdk/es/utils/keystore..decrypt"></a>

### @aeternity/aepp-sdk/es/utils/keystore~decrypt(ciphertext, key, nonce, [algo]) ⇒ `buffer`
Symmetric private key decryption using secret (derived) key.

**Kind**: inner method of [`@aeternity/aepp-sdk/es/utils/keystore`](#module_@aeternity/aepp-sdk/es/utils/keystore)  
**Returns**: `buffer` - Decrypted data.  

| Param | Type | Description |
| --- | --- | --- |
| ciphertext | `buffer` \| `Uint8Array` | Data to be decrypted. |
| key | `buffer` \| `Uint8Array` | Secret key. |
| nonce | `buffer` \| `Uint8Array` | Nonce from key-object. |
| [algo] | `string` | Encryption algorithm. |

<a id="module_@aeternity/aepp-sdk/es/utils/keystore..deriveKey"></a>

### @aeternity/aepp-sdk/es/utils/keystore~deriveKey(password, nonce, [options]) ⇒ `buffer`
Derive secret key from password with key derivation function.

**Kind**: inner method of [`@aeternity/aepp-sdk/es/utils/keystore`](#module_@aeternity/aepp-sdk/es/utils/keystore)  
**Returns**: `buffer` - Secret key derived from password.  

| Param | Type | Description |
| --- | --- | --- |
| password | `string` | User-supplied password. |
| nonce | `buffer` \| `Uint8Array` | Randomly generated nonce. |
| [options] | `Object` | Encryption parameters. |
| [options.kdf] | `string` | Key derivation function (default: DEFAULTS.crypto.kdf). |
| [options.kdf_params] | `Object` | KDF parameters (default: DEFAULTS.crypto.kdf_params). |

<a id="module_@aeternity/aepp-sdk/es/utils/keystore..marshal"></a>

### @aeternity/aepp-sdk/es/utils/keystore~marshal(name, derivedKey, privateKey, nonce, salt, [options]) ⇒ `Object`
Assemble key data object in secret-storage format.

**Kind**: inner method of [`@aeternity/aepp-sdk/es/utils/keystore`](#module_@aeternity/aepp-sdk/es/utils/keystore)  

| Param | Type | Description |
| --- | --- | --- |
| name | `buffer` | Key name. |
| derivedKey | `buffer` | Password-derived secret key. |
| privateKey | `buffer` | Private key. |
| nonce | `buffer` | Randomly generated 24byte nonce. |
| salt | `buffer` | Randomly generated 16byte salt. |
| [options] | `Object` | Encryption parameters. |
| [options.kdf] | `string` | Key derivation function (default: argon2id). |
| [options.cipher] | `string` | Symmetric cipher (default: constants.cipher). |
| [options.kdf_params] | `Object` | KDF parameters (default: constants.<kdf>). |

