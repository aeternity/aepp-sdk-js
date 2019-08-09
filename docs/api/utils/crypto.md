<a id="module_@aeternity/aepp-sdk/es/utils/crypto"></a>

## @aeternity/aepp-sdk/es/utils/crypto
Crypto module

**Example**  
```js
import * as Crypto from '@aeternity/aepp-sdk/es/utils/crypto'
```

* [@aeternity/aepp-sdk/es/utils/crypto](#module_@aeternity/aepp-sdk/es/utils/crypto)
    * _static_
        * [.decode](#module_@aeternity/aepp-sdk/es/utils/crypto.decode) ⇒ `Array`
        * [.isBase64(str)](#module_@aeternity/aepp-sdk/es/utils/crypto.isBase64) ⇒ `boolean`
        * [.formatAddress(format, address)](#module_@aeternity/aepp-sdk/es/utils/crypto.formatAddress) ⇒ `String`
        * [.isAddressValid(address)](#module_@aeternity/aepp-sdk/es/utils/crypto.isAddressValid) ⇒ `Boolean`
        * [.addressToHex(base58CheckAddress)](#module_@aeternity/aepp-sdk/es/utils/crypto.addressToHex) ⇒ `String`
        * [.addressFromDecimal(decimalAddress)](#module_@aeternity/aepp-sdk/es/utils/crypto.addressFromDecimal) ⇒ `String`
        * [.hash(input)](#module_@aeternity/aepp-sdk/es/utils/crypto.hash) ⇒ `Buffer`
        * [.nameId(input)](#module_@aeternity/aepp-sdk/es/utils/crypto.nameId) ⇒ `Buffer`
        * [.sha256hash(input)](#module_@aeternity/aepp-sdk/es/utils/crypto.sha256hash) ⇒ `String`
        * [.salt()](#module_@aeternity/aepp-sdk/es/utils/crypto.salt) ⇒ `Number`
        * [.encodeBase64Check(input)](#module_@aeternity/aepp-sdk/es/utils/crypto.encodeBase64Check) ⇒ `Buffer`
        * [.decodeBase64Check(str)](#module_@aeternity/aepp-sdk/es/utils/crypto.decodeBase64Check) ⇒ `Buffer`
        * [.encodeBase58Check(input)](#module_@aeternity/aepp-sdk/es/utils/crypto.encodeBase58Check) ⇒ `String`
        * [.decodeBase58Check(str)](#module_@aeternity/aepp-sdk/es/utils/crypto.decodeBase58Check) ⇒ `Buffer`
        * [.hexStringToByte(str)](#module_@aeternity/aepp-sdk/es/utils/crypto.hexStringToByte) ⇒ `Uint8Array`
        * [.encodeUnsigned(value)](#module_@aeternity/aepp-sdk/es/utils/crypto.encodeUnsigned) ⇒ `Buffer`
        * [.encodeContractAddress(owner, nonce)](#module_@aeternity/aepp-sdk/es/utils/crypto.encodeContractAddress) ⇒ `String`
        * [.generateKeyPairFromSecret(secret)](#module_@aeternity/aepp-sdk/es/utils/crypto.generateKeyPairFromSecret) ⇒ `Object`
        * [.generateKeyPair(raw)](#module_@aeternity/aepp-sdk/es/utils/crypto.generateKeyPair) ⇒ `Object`
        * [.encryptPublicKey(password, binaryKey)](#module_@aeternity/aepp-sdk/es/utils/crypto.encryptPublicKey) ⇒ `Uint8Array`
        * [.encryptPrivateKey(password, binaryKey)](#module_@aeternity/aepp-sdk/es/utils/crypto.encryptPrivateKey) ⇒ `Uint8Array`
        * [.encryptKey(password, binaryData)](#module_@aeternity/aepp-sdk/es/utils/crypto.encryptKey) ⇒ `Uint8Array`
        * [.decryptKey(password, encrypted)](#module_@aeternity/aepp-sdk/es/utils/crypto.decryptKey) ⇒ `Buffer`
        * [.sign(data, privateKey)](#module_@aeternity/aepp-sdk/es/utils/crypto.sign) ⇒ `Buffer`
        * [.verify(str, signature, publicKey)](#module_@aeternity/aepp-sdk/es/utils/crypto.verify) ⇒ `Boolean`
        * [.prepareTx(signature, data)](#module_@aeternity/aepp-sdk/es/utils/crypto.prepareTx) ⇒ `Transaction`
        * [.aeEncodeKey(binaryKey)](#module_@aeternity/aepp-sdk/es/utils/crypto.aeEncodeKey) ⇒ `String`
        * [.generateSaveWallet(password)](#module_@aeternity/aepp-sdk/es/utils/crypto.generateSaveWallet) ⇒ `Object`
        * [.decryptPrivateKey(password)](#module_@aeternity/aepp-sdk/es/utils/crypto.decryptPrivateKey) ⇒ `Buffer`
        * [.decryptPubKey(password)](#module_@aeternity/aepp-sdk/es/utils/crypto.decryptPubKey) ⇒ `Buffer`
        * [.assertedType(data, type, forceError)](#module_@aeternity/aepp-sdk/es/utils/crypto.assertedType) ⇒ `String` \| `Boolean`
        * [.decodeTx(password)](#module_@aeternity/aepp-sdk/es/utils/crypto.decodeTx) ⇒ `Array`
        * [.encodeTx(txData)](#module_@aeternity/aepp-sdk/es/utils/crypto.encodeTx) ⇒ `String`
        * [.isValidKeypair(privateKey, publicKey)](#module_@aeternity/aepp-sdk/es/utils/crypto.isValidKeypair) ⇒ `Boolean`
        * [.envKeypair(env)](#module_@aeternity/aepp-sdk/es/utils/crypto.envKeypair) ⇒ `Object`
        * [.deserialize(binary, opts)](#module_@aeternity/aepp-sdk/es/utils/crypto.deserialize) ⇒ `Object`
    * _inner_
        * [~Transaction](#module_@aeternity/aepp-sdk/es/utils/crypto..Transaction) : `Array`

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decode"></a>

### @aeternity/aepp-sdk/es/utils/crypto.decode ⇒ `Array`
RLP decode

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Array` - Array of Buffers containing the original message  
**rtype**: `(data: Any) => Buffer[]`

| Param | Type | Description |
| --- | --- | --- |
| data | `Buffer` \| `String` \| `Integer` \| `Array` | Data to decode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.isBase64"></a>

### @aeternity/aepp-sdk/es/utils/crypto.isBase64(str) ⇒ `boolean`
Check whether a string is valid base-64.

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `boolean` - True if the string is valid base-64, false otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| str | `string` | String to validate. |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.formatAddress"></a>

### @aeternity/aepp-sdk/es/utils/crypto.formatAddress(format, address) ⇒ `String`
Format account address

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Formatted address  
**rtype**: `(format: String, address: String) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| format | `String` | Format type |
| address | `String` | Base58check account address |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.isAddressValid"></a>

### @aeternity/aepp-sdk/es/utils/crypto.isAddressValid(address) ⇒ `Boolean`
Check if address is valid

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Boolean` - valid  
**rtype**: `(input: String) => valid: Boolean`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Address |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.addressToHex"></a>

### @aeternity/aepp-sdk/es/utils/crypto.addressToHex(base58CheckAddress) ⇒ `String`
Convert base58Check address to hex string

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Hex string  
**rtype**: `(base58CheckAddress: String) => hexAddress: String`

| Param | Type | Description |
| --- | --- | --- |
| base58CheckAddress | `String` | Address |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.addressFromDecimal"></a>

### @aeternity/aepp-sdk/es/utils/crypto.addressFromDecimal(decimalAddress) ⇒ `String`
Parse decimal address and return base58Check encoded address with prefix 'ak'

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - address  
**rtype**: `(input: String) => address: String`

| Param | Type | Description |
| --- | --- | --- |
| decimalAddress | `String` | Address |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.hash"></a>

### @aeternity/aepp-sdk/es/utils/crypto.hash(input) ⇒ `Buffer`
Calculate 256bits Blake2b hash of `input`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Hash  
**rtype**: `(input: String) => hash: String`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` \| `Buffer` | Data to hash |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.nameId"></a>

### @aeternity/aepp-sdk/es/utils/crypto.nameId(input) ⇒ `Buffer`
Calculate 256bits Blake2b nameId of `input`
as defined in https://github.com/aeternity/protocol/blob/master/AENS.md#hashing

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Hash  
**rtype**: `(input: String) => hash: String`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` | Data to hash |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.sha256hash"></a>

### @aeternity/aepp-sdk/es/utils/crypto.sha256hash(input) ⇒ `String`
Calculate SHA256 hash of `input`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Hash  
**rtype**: `(input: String) => hash: String`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` | Data to hash |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.salt"></a>

### @aeternity/aepp-sdk/es/utils/crypto.salt() ⇒ `Number`
Generate a random salt (positive integer)

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Number` - random salt  
**rtype**: `() => salt: Number`
<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeBase64Check"></a>

### @aeternity/aepp-sdk/es/utils/crypto.encodeBase64Check(input) ⇒ `Buffer`
Base64check encode given `input`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Base64check encoded data  
**rtype**: `(input: String|buffer) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` | Data to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decodeBase64Check"></a>

### @aeternity/aepp-sdk/es/utils/crypto.decodeBase64Check(str) ⇒ `Buffer`
Base64check decode given `str`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Base64check decoded data  
**rtype**: `(str: String) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| str | `String` | Data to decode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeBase58Check"></a>

### @aeternity/aepp-sdk/es/utils/crypto.encodeBase58Check(input) ⇒ `String`
Base58 encode given `input`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Base58 encoded data  
**rtype**: `(input: String) => String`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` | Data to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decodeBase58Check"></a>

### @aeternity/aepp-sdk/es/utils/crypto.decodeBase58Check(str) ⇒ `Buffer`
Base58 decode given `str`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Base58 decoded data  
**rtype**: `(str: String) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| str | `String` | Data to decode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.hexStringToByte"></a>

### @aeternity/aepp-sdk/es/utils/crypto.hexStringToByte(str) ⇒ `Uint8Array`
Conver hex string to Uint8Array

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Uint8Array` - - converted data  
**rtype**: `(str: String) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| str | `String` | Data to conver |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeUnsigned"></a>

### @aeternity/aepp-sdk/es/utils/crypto.encodeUnsigned(value) ⇒ `Buffer`
Converts a positive integer to the smallest possible
representation in a binary digit representation

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - - Encoded data  
**rtype**: `(value: Number) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| value | `Number` | Value to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeContractAddress"></a>

### @aeternity/aepp-sdk/es/utils/crypto.encodeContractAddress(owner, nonce) ⇒ `String`
Compute contract address

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - - Contract address  
**rtype**: `(owner: String, nonce: Number) => String`

| Param | Type | Description |
| --- | --- | --- |
| owner | `String` | Address of contract owner |
| nonce | `Number` | Round when contract was created |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.generateKeyPairFromSecret"></a>

### @aeternity/aepp-sdk/es/utils/crypto.generateKeyPairFromSecret(secret) ⇒ `Object`
Generate keyPair from secret key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - - Object with Private(privateKey) and Public(publicKey) keys  
**rtype**: `(secret: Uint8Array) => KeyPair`

| Param | Type | Description |
| --- | --- | --- |
| secret | `Uint8Array` | secret key |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.generateKeyPair"></a>

### @aeternity/aepp-sdk/es/utils/crypto.generateKeyPair(raw) ⇒ `Object`
Generate a random ED25519 keypair

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - Key pair  
**rtype**: `(raw: Boolean) => {publicKey: String, secretKey: String} | {publicKey: Buffer, secretKey: Buffer}`

| Param | Type | Description |
| --- | --- | --- |
| raw | `Boolean` | Whether to return raw (binary) keys |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encryptPublicKey"></a>

### @aeternity/aepp-sdk/es/utils/crypto.encryptPublicKey(password, binaryKey) ⇒ `Uint8Array`
Encrypt given public key using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Uint8Array` - Encrypted key  
**rtype**: `(password: String, binaryKey: Buffer) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to encrypt with |
| binaryKey | `Buffer` | Key to encrypt |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encryptPrivateKey"></a>

### @aeternity/aepp-sdk/es/utils/crypto.encryptPrivateKey(password, binaryKey) ⇒ `Uint8Array`
Encrypt given private key using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Uint8Array` - Encrypted key  
**rtype**: `(password: String, binaryKey: Buffer) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to encrypt with |
| binaryKey | `Buffer` | Key to encrypt |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encryptKey"></a>

### @aeternity/aepp-sdk/es/utils/crypto.encryptKey(password, binaryData) ⇒ `Uint8Array`
Encrypt given data using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Uint8Array` - Encrypted data  
**rtype**: `(password: String, binaryData: Buffer) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to encrypt with |
| binaryData | `Buffer` | Data to encrypt |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decryptKey"></a>

### @aeternity/aepp-sdk/es/utils/crypto.decryptKey(password, encrypted) ⇒ `Buffer`
Decrypt given data using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Decrypted data  
**rtype**: `(password: String, encrypted: String) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to decrypt with |
| encrypted | `String` | Data to decrypt |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.sign"></a>

### @aeternity/aepp-sdk/es/utils/crypto.sign(data, privateKey) ⇒ `Buffer`
Generate signature

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Signature  
**rtype**: `(data: String|Buffer, privateKey: Buffer) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| data | `String` \| `Buffer` | Data to sign |
| privateKey | `String` \| `Buffer` | Key to sign with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.verify"></a>

### @aeternity/aepp-sdk/es/utils/crypto.verify(str, signature, publicKey) ⇒ `Boolean`
Verify that signature was signed by public key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Boolean` - Valid?  
**rtype**: `(str: String, signature: Buffer, publicKey: Buffer) => Boolean`

| Param | Type | Description |
| --- | --- | --- |
| str | `String` | Data to verify |
| signature | `Buffer` | Signature to verify |
| publicKey | `Buffer` | Key to verify against |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.prepareTx"></a>

### @aeternity/aepp-sdk/es/utils/crypto.prepareTx(signature, data) ⇒ `Transaction`
Prepare a transaction for posting to the blockchain

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Transaction` - Transaction  
**rtype**: `(signature: Buffer | String, data: Buffer) => Transaction`

| Param | Type | Description |
| --- | --- | --- |
| signature | `Buffer` | Signature of `data` |
| data | `Buffer` | Transaction data |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.aeEncodeKey"></a>

### @aeternity/aepp-sdk/es/utils/crypto.aeEncodeKey(binaryKey) ⇒ `String`
æternity readable public keys are the base58-encoded public key, prepended
with 'ak_'

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Encoded key  
**rtype**: `(binaryKey: Buffer) => String`

| Param | Type | Description |
| --- | --- | --- |
| binaryKey | `Buffer` | Key to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.generateSaveWallet"></a>

### @aeternity/aepp-sdk/es/utils/crypto.generateSaveWallet(password) ⇒ `Object`
Generate a new key pair using [generateKeyPair](generateKeyPair) and encrypt it using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - Encrypted key pair  
**rtype**: `(password: String) => {publicKey: Uint8Array, secretKey: Uint8Array}`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to encrypt with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decryptPrivateKey"></a>

### @aeternity/aepp-sdk/es/utils/crypto.decryptPrivateKey(password) ⇒ `Buffer`
Decrypt an encrypted private key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Decrypted key  
**rtype**: `(password: String, encrypted: Buffer) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to decrypt with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decryptPubKey"></a>

### @aeternity/aepp-sdk/es/utils/crypto.decryptPubKey(password) ⇒ `Buffer`
Decrypt an encrypted public key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Decrypted key  
**rtype**: `(password: String, encrypted: Buffer) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to decrypt with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.assertedType"></a>

### @aeternity/aepp-sdk/es/utils/crypto.assertedType(data, type, forceError) ⇒ `String` \| `Boolean`
Assert base58 encoded type and return its payload

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` \| `Boolean` - Payload  
**rtype**: `(data: String, type: String) => String, throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| data | `String` | ae data |
| type | `String` | Prefix |
| forceError |  |  |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decodeTx"></a>

### @aeternity/aepp-sdk/es/utils/crypto.decodeTx(password) ⇒ `Array`
Decode a transaction

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Array` - Decoded transaction  
**rtype**: `(txHash: String) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to decrypt with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeTx"></a>

### @aeternity/aepp-sdk/es/utils/crypto.encodeTx(txData) ⇒ `String`
Encode a transaction

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Encoded transaction  
**rtype**: `(txData: Transaction) => String`

| Param | Type | Description |
| --- | --- | --- |
| txData | `Transaction` | Transaction to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.isValidKeypair"></a>

### @aeternity/aepp-sdk/es/utils/crypto.isValidKeypair(privateKey, publicKey) ⇒ `Boolean`
Check key pair for validity

Sign a message, and then verifying that signature

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Boolean` - Valid?  
**rtype**: `(privateKey: Buffer, publicKey: Buffer) => Boolean`

| Param | Type | Description |
| --- | --- | --- |
| privateKey | `Buffer` | Private key to verify |
| publicKey | `Buffer` | Public key to verify |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.envKeypair"></a>

### @aeternity/aepp-sdk/es/utils/crypto.envKeypair(env) ⇒ `Object`
Obtain key pair from `env`

Designed to be used with `env` from nodejs. Assumes enviroment variables
`WALLET_PRIV` and `WALLET_PUB`.

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - Key pair  
**rtype**: `(env: Object) => {publicKey: String, secretKey: String}, throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| env | `Object` | Environment |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.deserialize"></a>

### @aeternity/aepp-sdk/es/utils/crypto.deserialize(binary, opts) ⇒ `Object`
Deserialize `binary` state channel transaction

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - Channel data  
**rtype**: `(binary: String) => Object`

| Param | Type | Description |
| --- | --- | --- |
| binary | `String` | Data to deserialize |
| opts | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto..Transaction"></a>

### @aeternity/aepp-sdk/es/utils/crypto~Transaction : `Array`
**Kind**: inner typedef of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**rtype**: `Transaction: [tag: Buffer, version: Buffer, [signature: Buffer], data: Buffer]`
