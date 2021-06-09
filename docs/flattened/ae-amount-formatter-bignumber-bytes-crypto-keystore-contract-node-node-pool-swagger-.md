## utils
 
<a id="module_@aeternity/aepp-sdk/es/ae"></a>

### ae
**Module Path:** @aeternity/aepp-sdk/es/ae 

Ae module

**Example**  
```js
import Ae from '@aeternity/aepp-sdk/es/ae'
```

        

<a id="exp_module_@aeternity/aepp-sdk/es/ae--Ae"></a>

#### Ae

**Type Sig:** Ae([options]) ⇒ `Object` 

Basic Ae Stamp

Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

Ae objects are the composition of three basic building blocks:
Only by providing the joint functionality of those three, most more advanced
operations, i.e. the ones with actual use value on the chain, become
available.

**Kind**: Exported function  
**Returns**: `Object` - Ae instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="module_@aeternity/aepp-sdk/es/ae--Ae+destroyInstance"></a>

##### destroyInstance
**Type Sig:** ae.destroyInstance() ⇒ `void`
Remove all listeners for RPC

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
<a id="module_@aeternity/aepp-sdk/es/ae--Ae+send"></a>

##### send
**Type Sig:** ae.send(tx, [options]) ⇒ `Object`
Sign and post a transaction to the chain

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(tx: String, options: Object) => Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| tx | `String` |  | Transaction |
| [options] | `Object` | <code>{}</code> | options - Options |
| [options.verify] | `Object` |  | verify - Verify transaction before broadcast, throw error if not valid |

<a id="module_@aeternity/aepp-sdk/es/ae--Ae+spend"></a>

##### spend
**Type Sig:** ae.spend(amount, recipientIdOrName, [options]) ⇒ `Object`
Send tokens to another account

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(amount: Number|String, recipientIdOrName: String, options?: Object) => Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| amount | `Number` \| `String` | Amount to spend |
| recipientIdOrName | `String` | Address or name of recipient account |
| [options] | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/ae--Ae+transferFunds"></a>

##### transferFunds
**Type Sig:** ae.transferFunds(fraction, recipientIdOrName, [options]) ⇒ `Object`
Send a fraction of token balance to another account

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(fraction: Number|String, recipientIdOrName: String, options?: Object) => Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| fraction | `Number` \| `String` | Fraction of balance to spend (between 0 and 1) |
| recipientIdOrName | `String` | Address or name of recipient account |
| [options] | `Object` | Options |

,
<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter"></a>

### utils/amount-formatter
**Module Path:** @aeternity/aepp-sdk/es/utils/amount-formatter 

Amount Formatter

**Example**  
```js
import { format, toAettos, AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter'
```


<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.AE_AMOUNT_FORMATS"></a>

#### utils/amount-formatter.AE\_AMOUNT\_FORMATS
**Module Path:** @aeternity/aepp-sdk/es/utils/amount-formatter.AE\_AMOUNT\_FORMATS 

AE amount formats

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  
<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.DENOMINATION_MAGNITUDE"></a>

#### utils/amount-formatter.DENOMINATION\_MAGNITUDE
**Module Path:** @aeternity/aepp-sdk/es/utils/amount-formatter.DENOMINATION\_MAGNITUDE 

DENOMINATION_MAGNITUDE

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  
<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.toAe"></a>

#### utils/amount-formatter.toAe ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/amount-formatter.toAe ⇒ `String` 

Convert amount to AE

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | `String` \| `Number` \| `BigNumber` |  | amount to convert |
| [options] | `Object` | <code>{}</code> | options |
| [options.denomination] | `String` | <code>&#x27;aettos&#x27;</code> | denomination of amount, can be ['ae', 'aettos'] |

<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.toAettos"></a>

#### utils/amount-formatter.toAettos ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/amount-formatter.toAettos ⇒ `String` 

Convert amount to aettos

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | `String` \| `Number` \| `BigNumber` |  | amount to convert |
| [options] | `Object` | <code>{}</code> | options |
| [options.denomination] | `String` | <code>&#x27;ae&#x27;</code> | denomination of amount, can be ['ae', 'aettos'] |

<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.formatAmount"></a>

#### utils/amount-formatter.formatAmount ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/amount-formatter.formatAmount ⇒ `String` 

Convert amount from one to other denomination

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | `String` \| `Number` \| `BigNumber` |  | amount to convert |
| [options] | `Object` | <code>{}</code> | options |
| [options.denomination] | `String` | <code>&#x27;aettos&#x27;</code> | denomination of amount, can be ['ae', 'aettos'] |
| [options.targetDenomination] | `String` | <code>&#x27;aettos&#x27;</code> | target denomination, can be ['ae', 'aettos'] |

,
<a id="module_@aeternity/aepp-sdk/es/utils/bignumber"></a>

### utils/bignumber
**Module Path:** @aeternity/aepp-sdk/es/utils/bignumber 

Big Number Helpers

**Example**  
```js
import { parseBigNumber, asBigNumber, isBigNumber, ceil } from '@aeternity/aepp-sdk/es/utils/bignumber'
```


<a id="module_@aeternity/aepp-sdk/es/utils/bignumber.parseBigNumber"></a>

#### utils/bignumber.parseBigNumber(number) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/bignumber.parseBigNumber(number) ⇒ `String` 

Convert number to string

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bignumber`](#module_@aeternity/aepp-sdk/es/utils/bignumber)  

| Param | Type | Description |
| --- | --- | --- |
| number | `String` \| `Number` \| `BigNumber` | number to convert |

<a id="module_@aeternity/aepp-sdk/es/utils/bignumber.asBigNumber"></a>

#### utils/bignumber.asBigNumber(number) ⇒ `BigNumber`
**Module Path:** @aeternity/aepp-sdk/es/utils/bignumber.asBigNumber(number) ⇒ `BigNumber` 

Convert number to BigNumber instance

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bignumber`](#module_@aeternity/aepp-sdk/es/utils/bignumber)  

| Param | Type | Description |
| --- | --- | --- |
| number | `String` \| `Number` \| `BigNumber` | number to convert |

<a id="module_@aeternity/aepp-sdk/es/utils/bignumber.isBigNumber"></a>

#### utils/bignumber.isBigNumber(number) ⇒ `Boolean`
**Module Path:** @aeternity/aepp-sdk/es/utils/bignumber.isBigNumber(number) ⇒ `Boolean` 

Check if value is BigNumber, Number or number string representation

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bignumber`](#module_@aeternity/aepp-sdk/es/utils/bignumber)  

| Param | Type | Description |
| --- | --- | --- |
| number | `String` \| `Number` \| `BigNumber` | number to convert |

<a id="module_@aeternity/aepp-sdk/es/utils/bignumber.ceil"></a>

#### utils/bignumber.ceil(bigNumber) ⇒ `BigNumber`
**Module Path:** @aeternity/aepp-sdk/es/utils/bignumber.ceil(bigNumber) ⇒ `BigNumber` 

BigNumber ceil operation

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bignumber`](#module_@aeternity/aepp-sdk/es/utils/bignumber)  

| Param | Type |
| --- | --- |
| bigNumber | `String` \| `Number` \| `BigNumber` | 

,
<a id="module_@aeternity/aepp-sdk/es/utils/bytes"></a>

### utils/bytes
**Module Path:** @aeternity/aepp-sdk/es/utils/bytes 

Bytes module

**Example**  
```js
import * as Crypto from '@aeternity/aepp-sdk/es/utils/bytes'
```


<a id="module_@aeternity/aepp-sdk/es/utils/bytes.leftPad"></a>

#### utils/bytes.leftPad(length, inputBuffer) ⇒
**Module Path:** @aeternity/aepp-sdk/es/utils/bytes.leftPad(length, inputBuffer) ⇒ 

Left pad the input data with 0 bytes

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: the padded data  

| Param | Description |
| --- | --- |
| length | to pad to |
| inputBuffer | data to pad |

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.rightPad"></a>

#### utils/bytes.rightPad(length, inputBuffer) ⇒
**Module Path:** @aeternity/aepp-sdk/es/utils/bytes.rightPad(length, inputBuffer) ⇒ 

Right pad the input data with 0 bytes

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: the padded data  

| Param | Description |
| --- | --- |
| length | to pad to |
| inputBuffer | data to pad |

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.bigNumberToByteArray"></a>

#### utils/bytes.bigNumberToByteArray(x) ⇒
**Module Path:** @aeternity/aepp-sdk/es/utils/bytes.bigNumberToByteArray(x) ⇒ 

Convert bignumber to byte array

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: Buffer  

| Param | Description |
| --- | --- |
| x | bignumber instance |

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.str2buf"></a>

#### utils/bytes.str2buf(str, [enc]) ⇒ `buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/bytes.str2buf(str, [enc]) ⇒ `buffer` 

Convert a string to a Buffer.  If encoding is not specified, hex-encoding
will be used if the input is valid hex.  If the input is valid base64 but
not valid hex, base64 will be used.  Otherwise, utf8 will be used.

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: `buffer` - Buffer (bytearray) containing the input data.  

| Param | Type | Description |
| --- | --- | --- |
| str | `string` | String to be converted. |
| [enc] | `string` | Encoding of the input string (optional). |

,
<a id="module_@aeternity/aepp-sdk/es/utils/crypto"></a>

### utils/crypto
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto 

Crypto module

**Example**  
```js
import * as Crypto from '@aeternity/aepp-sdk/es/utils/crypto'
```

    
    

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decode"></a>

#### utils/crypto.decode ⇒ `Array`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.decode ⇒ `Array` 

RLP decode

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Array` - Array of Buffers containing the original message  
**rtype**: `(data: Any) => Buffer[]`

| Param | Type | Description |
| --- | --- | --- |
| data | `Buffer` \| `String` \| `Integer` \| `Array` | Data to decode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.formatAddress"></a>

#### utils/crypto.formatAddress(format, address) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.formatAddress(format, address) ⇒ `String` 

Format account address

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Formatted address  
**rtype**: `(format: String, address: String) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| format | `String` | Format type |
| address | `String` | Base58check account address |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.getAddressFromPriv"></a>

#### utils/crypto.getAddressFromPriv(secret) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.getAddressFromPriv(secret) ⇒ `String` 

Generate address from secret key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Public key  
**rtype**: `(secret: String) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| secret | `String` | Private key |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.isAddressValid"></a>

#### utils/crypto.isAddressValid(address, prefix) ⇒ `Boolean`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.isAddressValid(address, prefix) ⇒ `Boolean` 

Check if address is valid

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Boolean` - valid  
**rtype**: `(input: String) => valid: Boolean`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Address |
| prefix | `String` | Transaction prefix. Default: 'ak' |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.addressToHex"></a>

#### utils/crypto.addressToHex(base58CheckAddress) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.addressToHex(base58CheckAddress) ⇒ `String` 

Convert base58Check address to hex string

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Hex string  
**rtype**: `(base58CheckAddress: String) => hexAddress: String`

| Param | Type | Description |
| --- | --- | --- |
| base58CheckAddress | `String` | Address |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.addressFromDecimal"></a>

#### utils/crypto.addressFromDecimal(decimalAddress) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.addressFromDecimal(decimalAddress) ⇒ `String` 

Parse decimal address and return base58Check encoded address with prefix 'ak'

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - address  
**rtype**: `(input: String) => address: String`

| Param | Type | Description |
| --- | --- | --- |
| decimalAddress | `String` | Address |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.hash"></a>

#### utils/crypto.hash(input) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.hash(input) ⇒ `Buffer` 

Calculate 256bits Blake2b hash of `input`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Hash  
**rtype**: `(input: String) => hash: String`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` \| `Buffer` | Data to hash |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.sha256hash"></a>

#### utils/crypto.sha256hash(input) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.sha256hash(input) ⇒ `String` 

Calculate SHA256 hash of `input`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Hash  
**rtype**: `(input: String) => hash: String`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` | Data to hash |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.salt"></a>

#### utils/crypto.salt() ⇒ `Number`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.salt() ⇒ `Number` 

Generate a random salt (positive integer)

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Number` - random salt  
**rtype**: `() => salt: Number`
<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeBase64Check"></a>

#### utils/crypto.encodeBase64Check(input) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encodeBase64Check(input) ⇒ `Buffer` 

Base64check encode given `input`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Base64check encoded data  
**rtype**: `(input: String|buffer) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` | Data to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decodeBase64Check"></a>

#### utils/crypto.decodeBase64Check(str) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.decodeBase64Check(str) ⇒ `Buffer` 

Base64check decode given `str`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Base64check decoded data  
**rtype**: `(str: String) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| str | `String` | Data to decode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeBase58Check"></a>

#### utils/crypto.encodeBase58Check(input) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encodeBase58Check(input) ⇒ `String` 

Base58 encode given `input`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Base58 encoded data  
**rtype**: `(input: String) => String`

| Param | Type | Description |
| --- | --- | --- |
| input | `String` \| `Buffer` | Data to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decodeBase58Check"></a>

#### utils/crypto.decodeBase58Check(str) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.decodeBase58Check(str) ⇒ `Buffer` 

Base58 decode given `str`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Base58 decoded data  
**rtype**: `(str: String) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| str | `String` | Data to decode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.hexStringToByte"></a>

#### utils/crypto.hexStringToByte(str) ⇒ `Uint8Array`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.hexStringToByte(str) ⇒ `Uint8Array` 

Conver hex string to Uint8Array

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Uint8Array` - - converted data  
**rtype**: `(str: String) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| str | `String` | Data to conver |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeUnsigned"></a>

#### utils/crypto.encodeUnsigned(value) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encodeUnsigned(value) ⇒ `Buffer` 

Converts a positive integer to the smallest possible
representation in a binary digit representation

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - - Encoded data  
**rtype**: `(value: Number) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| value | `Number` | Value to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeContractAddress"></a>

#### utils/crypto.encodeContractAddress(owner, nonce) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encodeContractAddress(owner, nonce) ⇒ `String` 

Compute contract address

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - - Contract address  
**rtype**: `(owner: String, nonce: Number) => String`

| Param | Type | Description |
| --- | --- | --- |
| owner | `String` | Address of contract owner |
| nonce | `Number` | Round when contract was created |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.generateKeyPairFromSecret"></a>

#### utils/crypto.generateKeyPairFromSecret(secret) ⇒ `Object`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.generateKeyPairFromSecret(secret) ⇒ `Object` 

Generate keyPair from secret key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - - Object with Private(privateKey) and Public(publicKey) keys  
**rtype**: `(secret: Uint8Array) => KeyPair`

| Param | Type | Description |
| --- | --- | --- |
| secret | `Uint8Array` | secret key |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.generateKeyPair"></a>

#### utils/crypto.generateKeyPair(raw) ⇒ `Object`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.generateKeyPair(raw) ⇒ `Object` 

Generate a random ED25519 keypair

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - Key pair  
**rtype**: `(raw: Boolean) => {publicKey: String, secretKey: String} | {publicKey: Buffer, secretKey: Buffer}`

| Param | Type | Description |
| --- | --- | --- |
| raw | `Boolean` | Whether to return raw (binary) keys |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encryptPublicKey"></a>

#### utils/crypto.encryptPublicKey(password, binaryKey) ⇒ `Uint8Array`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encryptPublicKey(password, binaryKey) ⇒ `Uint8Array` 

Encrypt given public key using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Uint8Array` - Encrypted key  
**rtype**: `(password: String, binaryKey: Buffer) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to encrypt with |
| binaryKey | `Buffer` | Key to encrypt |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encryptPrivateKey"></a>

#### utils/crypto.encryptPrivateKey(password, binaryKey) ⇒ `Uint8Array`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encryptPrivateKey(password, binaryKey) ⇒ `Uint8Array` 

Encrypt given private key using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Uint8Array` - Encrypted key  
**rtype**: `(password: String, binaryKey: Buffer) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to encrypt with |
| binaryKey | `Buffer` | Key to encrypt |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encryptKey"></a>

#### utils/crypto.encryptKey(password, binaryData) ⇒ `Uint8Array`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encryptKey(password, binaryData) ⇒ `Uint8Array` 

Encrypt given data using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Uint8Array` - Encrypted data  
**rtype**: `(password: String, binaryData: Buffer) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to encrypt with |
| binaryData | `Buffer` | Data to encrypt |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decryptKey"></a>

#### utils/crypto.decryptKey(password, encrypted) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.decryptKey(password, encrypted) ⇒ `Buffer` 

Decrypt given data using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Decrypted data  
**rtype**: `(password: String, encrypted: String) => Uint8Array`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to decrypt with |
| encrypted | `String` | Data to decrypt |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.sign"></a>

#### utils/crypto.sign(data, privateKey) ⇒ `Buffer` \| `Uint8Array`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.sign(data, privateKey) ⇒ `Buffer` \| `Uint8Array` 

Generate signature

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` \| `Uint8Array` - Signature  
**rtype**: `(data: String|Buffer, privateKey: Buffer) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| data | `String` \| `Buffer` | Data to sign |
| privateKey | `String` \| `Buffer` | Key to sign with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.verify"></a>

#### utils/crypto.verify(str, signature, publicKey) ⇒ `Boolean`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.verify(str, signature, publicKey) ⇒ `Boolean` 

Verify that signature was signed by public key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Boolean` - Valid?  
**rtype**: `(str: String, signature: Buffer, publicKey: Buffer) => Boolean`

| Param | Type | Description |
| --- | --- | --- |
| str | `String` \| `Buffer` | Data to verify |
| signature | `Buffer` | Signature to verify |
| publicKey | `Buffer` | Key to verify against |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.prepareTx"></a>

#### utils/crypto.prepareTx(signature, data) ⇒ `Transaction`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.prepareTx(signature, data) ⇒ `Transaction` 

Prepare a transaction for posting to the blockchain

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Transaction` - Transaction  
**rtype**: `(signature: Buffer | String, data: Buffer) => Transaction`

| Param | Type | Description |
| --- | --- | --- |
| signature | `Buffer` | Signature of `data` |
| data | `Buffer` | Transaction data |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.aeEncodeKey"></a>

#### utils/crypto.aeEncodeKey(binaryKey) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.aeEncodeKey(binaryKey) ⇒ `String` 

æternity readable public keys are the base58-encoded public key, prepended
with 'ak_'

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Encoded key  
**rtype**: `(binaryKey: Buffer) => String`

| Param | Type | Description |
| --- | --- | --- |
| binaryKey | `Buffer` | Key to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.generateSaveWallet"></a>

#### utils/crypto.generateSaveWallet(password) ⇒ `Object`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.generateSaveWallet(password) ⇒ `Object` 

Generate a new key pair using [generateKeyPair](generateKeyPair) and encrypt it using `password`

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - Encrypted key pair  
**rtype**: `(password: String) => {publicKey: Uint8Array, secretKey: Uint8Array}`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to encrypt with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decryptPrivateKey"></a>

#### utils/crypto.decryptPrivateKey(password) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.decryptPrivateKey(password) ⇒ `Buffer` 

Decrypt an encrypted private key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Decrypted key  
**rtype**: `(password: String, encrypted: Buffer) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to decrypt with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decryptPubKey"></a>

#### utils/crypto.decryptPubKey(password) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.decryptPubKey(password) ⇒ `Buffer` 

Decrypt an encrypted public key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Decrypted key  
**rtype**: `(password: String, encrypted: Buffer) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Password to decrypt with |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.assertedType"></a>

#### utils/crypto.assertedType(data, type, omitError) ⇒ `String` \| `Boolean`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.assertedType(data, type, omitError) ⇒ `String` \| `Boolean` 

Assert encoded type and return its payload

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` \| `Boolean` - Payload  
**rtype**: `(data: String, type: String) => String, throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| data | `String` | ae data |
| type | `String` | Prefix |
| omitError | `Boolean` | Return false instead of throwing the error if data doesn't match expected type |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decodeTx"></a>

#### utils/crypto.decodeTx(txHash) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.decodeTx(txHash) ⇒ `Buffer` 

Decode a transaction

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Buffer` - Decoded transaction  
**rtype**: `(txHash: String) => Buffer`

| Param | Type | Description |
| --- | --- | --- |
| txHash | `String` | Transaction hash |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encodeTx"></a>

#### utils/crypto.encodeTx(txData) ⇒ `String`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encodeTx(txData) ⇒ `String` 

Encode a transaction

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `String` - Encoded transaction  
**rtype**: `(txData: Transaction) => String`

| Param | Type | Description |
| --- | --- | --- |
| txData | `Transaction` | Transaction to encode |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.isValidKeypair"></a>

#### utils/crypto.isValidKeypair(privateKey, publicKey) ⇒ `Boolean`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.isValidKeypair(privateKey, publicKey) ⇒ `Boolean` 

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

#### utils/crypto.envKeypair(env, [force]) ⇒ `Object`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.envKeypair(env, [force]) ⇒ `Object` 

Obtain key pair from `env`

Designed to be used with `env` from nodejs. Assumes enviroment variables
`WALLET_PRIV` and `WALLET_PUB`.

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**Returns**: `Object` - Key pair  
**rtype**: `(env: Object) => {publicKey: String, secretKey: String}, throws: Error`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| env | `Object` |  | Environment |
| [force] | `Boolean` | <code>false</code> | Force throwing error |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.encryptData"></a>

#### utils/crypto.encryptData(msg, publicKey) ⇒ `Object`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.encryptData(msg, publicKey) ⇒ `Object` 

This function encrypts a message using base58check encoded and 'ak' prefixed
publicKey such that only the corresponding secretKey will
be able to decrypt

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**rtype**: `(msg: String, publicKey: String) => Object`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Buffer` | Data to encode |
| publicKey | `String` | Public key |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto.decryptData"></a>

#### utils/crypto.decryptData(secretKey, encryptedData) ⇒ `Buffer` \| `null`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto.decryptData(secretKey, encryptedData) ⇒ `Buffer` \| `null` 

This function decrypt a message using secret key

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**rtype**: `(secretKey: String, encryptedData: Object) => Buffer|null`

| Param | Type | Description |
| --- | --- | --- |
| secretKey | `String` | Secret key |
| encryptedData | `Object` | Encrypted data |

<a id="module_@aeternity/aepp-sdk/es/utils/crypto..Transaction"></a>

#### utils/crypto~Transaction : `Array`
**Module Path:** @aeternity/aepp-sdk/es/utils/crypto~Transaction : `Array` 

**Kind**: inner typedef of [`@aeternity/aepp-sdk/es/utils/crypto`](#module_@aeternity/aepp-sdk/es/utils/crypto)  
**rtype**: `Transaction: [tag: Buffer, version: Buffer, [signature: Buffer], data: Buffer]`
,
<a id="module_@aeternity/aepp-sdk/es/utils/keystore"></a>

### utils/keystore
**Module Path:** @aeternity/aepp-sdk/es/utils/keystore 

KeyStore module

**Example**  
```js
import * as Keystore from '@aeternity/aepp-sdk/es/utils/keystore'
```
**Example**  
```js
const { Keystore } = require('@aeternity/aepp-sdk')
```

    
    

<a id="module_@aeternity/aepp-sdk/es/utils/keystore.recover"></a>

#### utils/keystore.recover(password, keyObject) ⇒ `Buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/keystore.recover(password, keyObject) ⇒ `Buffer` 

Recover plaintext private key from secret-storage key object.

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/keystore`](#module_@aeternity/aepp-sdk/es/utils/keystore)  
**Returns**: `Buffer` - Plaintext private key.  

| Param | Type | Description |
| --- | --- | --- |
| password | `String` | Keystore object password. |
| keyObject | `Object` | Keystore object. |

<a id="module_@aeternity/aepp-sdk/es/utils/keystore.dump"></a>

#### utils/keystore.dump(name, password, privateKey, nonce, salt, [options]) ⇒ `Object`
**Module Path:** @aeternity/aepp-sdk/es/utils/keystore.dump(name, password, privateKey, nonce, salt, [options]) ⇒ `Object` 

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

#### utils/keystore~str2buf(str, [enc]) ⇒ `buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/keystore~str2buf(str, [enc]) ⇒ `buffer` 

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

#### utils/keystore~encrypt(plaintext, key, nonce, [algo]) ⇒ `buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/keystore~encrypt(plaintext, key, nonce, [algo]) ⇒ `buffer` 

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

#### utils/keystore~decrypt(ciphertext, key, nonce, [algo]) ⇒ `buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/keystore~decrypt(ciphertext, key, nonce, [algo]) ⇒ `buffer` 

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

#### utils/keystore~deriveKey(password, nonce, [options]) ⇒ `buffer`
**Module Path:** @aeternity/aepp-sdk/es/utils/keystore~deriveKey(password, nonce, [options]) ⇒ `buffer` 

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

#### utils/keystore~marshal(name, derivedKey, privateKey, nonce, salt, [options]) ⇒ `Object`
**Module Path:** @aeternity/aepp-sdk/es/utils/keystore~marshal(name, derivedKey, privateKey, nonce, salt, [options]) ⇒ `Object` 

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

,
<a id="module_@aeternity/aepp-sdk/es/contract"></a>

### contract
**Module Path:** @aeternity/aepp-sdk/es/contract 

Contract Base module

**Example**  
```js
import ContractBase from '@aeternity/aepp-sdk/es/contract'
```


<a id="exp_module_@aeternity/aepp-sdk/es/contract--ContractBase"></a>

#### ContractBase

**Type Sig:** ContractBase([options]) ⇒ `Object` 

Basic Contract Stamp

This stamp include api call's related to contract functionality.
Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

**Kind**: Exported function  
**Returns**: `Object` - Contract instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractGetACI"></a>

##### contractGetACI
**Type Sig:** contractBase.contractGetACI(source, [options]) ⇒ `Object`
Get contract ACI

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `Object` - - Contract aci object  
**Category**: async  
**rtype**: `(source: String, options: Array) => aciObject: Promise[Object]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEncodeCallDataAPI"></a>

##### contractEncodeCallDataAPI
**Type Sig:** contractBase.contractEncodeCallDataAPI(source, name, args, [options]) ⇒ `String`
Encode contract data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Contract encoded data  
**Category**: async  
**rtype**: `(source: String, name: String, args: Array, options: Array) => callData: Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| name | `String` |  | Function name |
| args | `Array` |  | Function argument's |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeDataAPI"></a>

##### contractDecodeDataAPI
**Type Sig:** contractBase.contractDecodeDataAPI(type, data) ⇒ `String`
Decode data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call result  
**Category**: async  
**rtype**: `(type: String, data: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Contract call result type |
| data | `String` | Encoded contract call result |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallResultAPI"></a>

##### contractDecodeCallResultAPI
**Type Sig:** contractBase.contractDecodeCallResultAPI(source, fn, callValue, callResult, [options]) ⇒ `String`
Decode contract call result data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call result  
**Category**: async  
**rtype**: `(source: String, fn: String, callValue: String, callResult: String, options: Array) => decodedResult: Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source |
| fn | `String` |  | Fn name |
| callValue | `String` |  | result data (cb_das...) |
| callResult | `String` |  | contract call result status('ok', 'revert', ...) |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallDataBySourceAPI"></a>

##### contractDecodeCallDataBySourceAPI
**Type Sig:** contractBase.contractDecodeCallDataBySourceAPI(source, function, callData, [options]) ⇒ `String`
Decode call data by source

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call data  
**Category**: async  
**rtype**: `(source: String, function: String, callData: String, options: Array) => decodedResult: Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | contract source |
| function | `String` |  | function name |
| callData | `String` |  | Encoded contract call data |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallDataByCodeAPI"></a>

##### contractDecodeCallDataByCodeAPI
**Type Sig:** contractBase.contractDecodeCallDataByCodeAPI(code, callData, backend) ⇒ `String`
Decode call data by bytecode

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call data  
**Category**: async  
**rtype**: `(code: String, callData: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | contract byte code |
| callData | `String` | Encoded contract call data |
| backend | `String` | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+compileContractAPI"></a>

##### compileContractAPI
**Type Sig:** contractBase.compileContractAPI(code, [options]) ⇒ `Object`
Compile contract

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `Object` - Object which contain bytecode of contract  
**Category**: async  
**rtype**: `(code: String, options?: Object) => compiledContract: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | `String` |  | Contract source code |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+setCompilerUrl"></a>

##### setCompilerUrl
**Type Sig:** contractBase.setCompilerUrl(url) ⇒ `void`
Set compiler url

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Category**: async  
**rtype**: `(url: String) => void`

| Param | Type | Description |
| --- | --- | --- |
| url | `String` | Compiler url |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+getCompilerVersion"></a>

##### getCompilerVersion
**Type Sig:** contractBase.getCompilerVersion() ⇒ `String`
Get Compiler Version

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - Compiler version  
**Category**: async  
**rtype**: `() => String`
,
<a id="module_@aeternity/aepp-sdk/es/node"></a>

### node
**Module Path:** @aeternity/aepp-sdk/es/node 

Node module

**Example**  
```js
import Node from '@aeternity/aepp-sdk/es/node'
```

        
            
        
            

<a id="exp_module_@aeternity/aepp-sdk/es/node--Node"></a>

#### Node

**Type Sig:** Node([options]) ⇒ `Object` 

[Swagger](Swagger) based Node remote API Stamp

**Kind**: Exported function  
**Returns**: `Object` - Node client  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Options |
| options.url | `String` |  | Base URL for Node |
| options.internalUrl | `String` |  | Base URL for internal requests |
| options.axiosConfig | `String` |  | Object with axios configuration. Example { config: {}, errorHandler: (err) => throw err } |

**Example**  
```js
Node({url: 'https://testnet.aeternity.io'})
```
<a id="module_@aeternity/aepp-sdk/es/node--Node.getNetworkId"></a>

##### getNetworkId
**Type Sig:** Node.getNetworkId() ⇒ `String`
Obtain networkId from account or node

**Kind**: static method of [`Node`](#exp_module_@aeternity/aepp-sdk/es/node--Node)  
**Returns**: `String` - NetworkId  
**Category**: async  
**rtype**: `() => networkId: String`
<a id="module_@aeternity/aepp-sdk/es/node--Node..loader"></a>

##### loader
**Type Sig:** Node~loader(options) ⇒ `function`
Node specific loader for `urlFor`

**Kind**: inner method of [`Node`](#exp_module_@aeternity/aepp-sdk/es/node--Node)  
**Returns**: `function` - Implementation for [urlFor](urlFor)  
**rtype**: `({url: String, internalUrl?: String}) => (path: String, definition: Object) => tx: String`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| options.url | `String` | Base URL for Node |
| options.internalUrl | `String` | Base URL for internal requests |

<a id="module_@aeternity/aepp-sdk/es/node--Node..getConsensusProtocolVersion"></a>

##### getConsensusProtocolVersion
**Type Sig:** Node~getConsensusProtocolVersion(protocols, height) ⇒ `Number`
get consensus protocol version

**Kind**: inner method of [`Node`](#exp_module_@aeternity/aepp-sdk/es/node--Node)  
**Returns**: `Number` - version Protocol version  

| Param | Type | Description |
| --- | --- | --- |
| protocols | `Array` | Array of protocols |
| height | `Number` | Height |

<a id="module_@aeternity/aepp-sdk/es/node--Node..remoteSwag"></a>

##### remoteSwag
**Type Sig:** Node~remoteSwag(url, axiosConfig) ⇒ `Object`
Obtain Swagger configuration from Node node

**Kind**: inner method of [`Node`](#exp_module_@aeternity/aepp-sdk/es/node--Node)  
**Returns**: `Object` - Swagger configuration  
**Category**: async  
**rtype**: `(url: String) => swagger: Object`

| Param | Type | Description |
| --- | --- | --- |
| url | `String` | Node base URL |
| axiosConfig | `Object` | Axios configuration object |

,
<a id="module_@aeternity/aepp-sdk/es/node-pool"></a>

### node-pool
**Module Path:** @aeternity/aepp-sdk/es/node-pool 

NodePool module

**Example**  
```js
import NodePool from '@aeternity/aepp-sdk/es/node-pool'
```


<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--exports.NodePool"></a>

#### NodePool

**Type Sig:** NodePool([options]) ⇒ `Object` 

Node Pool Stamp
This stamp allow you to make basic manipulation(add, remove, select) on list of nodes

**Kind**: Exported function  
**Returns**: `Object` - NodePool instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.nodes] | `Array` |  | Array with Node instances |

<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--addNode"></a>

#### addNode

**Type Sig:** addNode(name, nodeInstance, select) ⇒ `Void` 

Add Node

**Kind**: Exported function  
**rtype**: `(name: String, nodeInstance: Object, select: Boolean) => Void`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Node name |
| nodeInstance | `Object` | Node instance |
| select | `Boolean` | Select this node as current |

**Example**  
```js
nodePool.addNode('testNode', awaitNode({ url, internalUrl }), true) // add and select new node with name 'testNode'
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--selectNode"></a>

#### selectNode

**Type Sig:** selectNode(name) ⇒ `Void` 

Select Node

**Kind**: Exported function  
**rtype**: `(name: String) => Void`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Node name |

**Example**  
```js
nodePool.selectNode('testNode')
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--getNetworkId"></a>

#### getNetworkId

**Type Sig:** getNetworkId() ⇒ `String` 

Get NetworkId of current Node

**Kind**: Exported function  
**rtype**: `() => String`
**Example**  
```js
nodePool.getNetworkId()
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--isNodeConnected"></a>

#### isNodeConnected

**Type Sig:** isNodeConnected() ⇒ `Boolean` 

Check if you have selected node

**Kind**: Exported function  
**rtype**: `() => Boolean`
**Example**  
```js
nodePool.isNodeConnected()
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--getNodeInfo"></a>

#### getNodeInfo

**Type Sig:** getNodeInfo() ⇒ `Object` 

Get information about node

**Kind**: Exported function  
**rtype**: `() => Object`
**Example**  
```js
nodePool.getNodeInfo() // { name, version, networkId, protocol, ... }
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--getNodesInPool"></a>

#### getNodesInPool

**Type Sig:** getNodesInPool() ⇒ `Array.&lt;Object&gt;` 

Get array of available nodes

**Kind**: Exported function  
**rtype**: `() => Object[]`
**Example**  
```js
nodePool.getNodesInPool()
```
,
<a id="module_@aeternity/aepp-sdk/es/utils/swagger"></a>

### utils/swagger
**Module Path:** @aeternity/aepp-sdk/es/utils/swagger 

Swagger module

**Example**  
```js
import Swagger from '@aeternity/aepp-sdk/es/utils/swagger'
```

        
        

<a id="exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger"></a>

#### Swagger

**Type Sig:** Swagger(options) ⇒ `Object` 

Swagger Stamp

**Kind**: Exported function  
**Returns**: `Object` - Account instance  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | Initializer object |
| options.swag | `Object` | Swagger definition |
| options.axiosConfig | `Object` | Object with axios configuration. Example { config: {}, errorHandler: (err) => throw err } |

**Example**  
```js
Swagger({swag})
```
<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.expandPath"></a>

##### expandPath
**Type Sig:** Swagger.expandPath(s) ⇒ `String`
Perform path string interpolation

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `String` - Converted string  
**rtype**: `(path: String, replacements: Object) => String`

| Param | Type | Description |
| --- | --- | --- |
| s | `String` | String to convert |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.conform"></a>

##### conform
**Type Sig:** Swagger.conform(value, spec, types) ⇒ `Object`
Conform `value` against its `spec`

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Conformed value  
**rtype**: `(value: Any, spec: Object, types: Object) => Any, throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| value | `Object` | Value to conform (validate and transform) |
| spec | `Object` | Specification object |
| types | `Object` | Types specification |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.traverseKeys"></a>

##### traverseKeys
**Type Sig:** Swagger.traverseKeys(fn, o) ⇒ `Object`
Key traversal metafunction

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Transformed object  
**rtype**: `(fn: (s: String) => String) => (o: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| fn | `function` | Key transformation function |
| o | `Object` | Object to traverse |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.snakizeKeys"></a>

##### snakizeKeys
**Type Sig:** Swagger.snakizeKeys(o) ⇒ `Object`
snake_case key traversal

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Transformed object  
**rtype**: `(o: Object) => Object`
**See**: pascalToSnake  

| Param | Type | Description |
| --- | --- | --- |
| o | `Object` | Object to traverse |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.pascalizeKeys"></a>

##### pascalizeKeys
**Type Sig:** Swagger.pascalizeKeys(o) ⇒ `Object`
PascalCase key traversal

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Transformed object  
**rtype**: `(o: Object) => Object`
**See**: snakeToPascal  

| Param | Type | Description |
| --- | --- | --- |
| o | `Object` | Object to traverse |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.assertOne"></a>

##### assertOne
**Type Sig:** Swagger.assertOne(coll) ⇒ `Object`
Assert that `coll` is a sequence with a length of 1 and extract the only element

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**rtype**: `(coll: [...Any]) => Any, throws: Error`

| Param | Type |
| --- | --- |
| coll | `Array.&lt;Object&gt;` | 

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.operation"></a>

##### operation
**Type Sig:** Swagger.operation(path, method, definition, types) ⇒ `function`
Generate callable operation

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**rtype**: `(path: String, method: String, definition: Object, types: Object) => (instance: Swagger, url: String) => Promise[Any], throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| path | `String` | Path to call in URL |
| method | `String` | HTTP method |
| definition | `Object` | Complex definition |
| types | `Object` | Swagger types |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.debugSwagger"></a>

##### debugSwagger
**Type Sig:** Swagger.debugSwagger(bool) ⇒ `Stamp`
Reconfigure Swagger to (not) spill debugging logs

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Stamp` - Reconfigured Swagger Stamp  
**rtype**: `(bool: Boolean) => Stamp`

| Param | Type | Description |
| --- | --- | --- |
| bool | `boolean` | Whether to debug |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..conformTypes"></a>

##### Swagger~conformTypes
**Type Sig:** Swagger~conformTypes

Per-type [conform](conform) dispatcher

**Kind**: inner constant of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**rtype**: `[(dispatch(value: String, spec: Object, types: Object) => Any, throws: Error)...]`
<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..lookupType"></a>

##### lookupType
**Type Sig:** Swagger~lookupType(path, spec, types) ⇒ `Object`
Lookup type

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Looked up type definition  
**rtype**: `(path: [String...], spec: Object, types: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| path | `Array.&lt;String&gt;` | Path to look up |
| spec | `Object` |  |
| types | `Object` |  |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..extendingErrorPath"></a>

##### extendingErrorPath
**Type Sig:** Swagger~extendingErrorPath(key, fn) ⇒ `Any`
Intercept errors thrown by `fn()`, extending them with information from `key`

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Any` - Execution result  
**rtype**: `(key: String, fn: Function) => Any`

| Param | Type | Description |
| --- | --- | --- |
| key | `String` | Information to attach |
| fn | `function` | Thunk |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..TypeError"></a>

##### TypeError
**Type Sig:** Swagger~TypeError(msg, spec, value) ⇒ `Error`
Construct Error with additional type information (not thrown)

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Error` - Enhanced Error  
**rtype**: `(msg: String, spec: String, value: String) => Error`

| Param | Type | Description |
| --- | --- | --- |
| msg | `String` | Error message |
| spec | `String` |  |
| value | `String` |  |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..conformDispatch"></a>

##### conformDispatch
**Type Sig:** Swagger~conformDispatch(spec) ⇒ `String`
[conform](conform) dispatcher

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `String` - Value to dispatch on  
**rtype**: `(spec: Object) => String, throws: Error`

| Param | Type |
| --- | --- |
| spec | `Object` | 

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..classifyParameters"></a>

##### classifyParameters
**Type Sig:** Swagger~classifyParameters(parameters) ⇒ `Array.&lt;Object&gt;`
Classify given `parameters`

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Array.&lt;Object&gt;` - Classified parameters  
**rtype**: `(parameters: [{required: Boolean, in: String}...]) => {pathArgs: [...Object], queryArgs: [...Object], bodyArgs: [...Object], req: [...Object], opts: [...Object]}`

| Param | Type | Description |
| --- | --- | --- |
| parameters | `Array.&lt;Object&gt;` | Parameters to classify |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..pascalizeParameters"></a>

##### pascalizeParameters
**Type Sig:** Swagger~pascalizeParameters(parameters) ⇒ `Array.&lt;Object&gt;`
Convert `name` attributes in `parameters` from snake_case to PascalCase

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Array.&lt;Object&gt;` - Pascalized parameters  
**rtype**: `(parameters: [{name: String}...]) => [{name: String}...]`

| Param | Type | Description |
| --- | --- | --- |
| parameters | `Array.&lt;Object&gt;` | Parameters to pascalize |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..operationSignature"></a>

##### operationSignature
**Type Sig:** Swagger~operationSignature(name, req, opts) ⇒ `String`
Obtain readable signature for operation

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `String` - Signature  
**rtype**: `(name: String, req: [...Object], opts: [...Object]) => Object`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Name of operation |
| req | `Array.&lt;Object&gt;` | Required parameters to operation |
| opts | `Array.&lt;Object&gt;` | Optional parameters to operation |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..destructureClientError"></a>

##### destructureClientError
**Type Sig:** Swagger~destructureClientError(error) ⇒ `String`
Destructure HTTP client `error`

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**rtype**: `(error: Error) => String`

| Param | Type |
| --- | --- |
| error | `Error` | 

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..resolveRef"></a>

##### resolveRef
**Type Sig:** Swagger~resolveRef(ref, swag) ⇒ `Object`
Resolve reference

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Resolved reference definition  
**rtype**: `(ref: String, swag: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| ref | `String` | Reference to resolve |
| swag | `Object` |  |

,
