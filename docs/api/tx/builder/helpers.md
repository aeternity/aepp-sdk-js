<a id="module_@aeternity/aepp-sdk/es/tx/builder/helpers"></a>

### @aeternity/aepp-sdk/es/tx/builder/helpers
JavaScript-based Transaction builder helper function's

**Example**  
```js
import { TxBuilderHelper } from '@aeternity/aepp-sdk'
```

* [@aeternity/aepp-sdk/es/tx/builder/helpers](#module_@aeternity/aepp-sdk/es/tx/builder/helpers)
    * [exports.buildContractId(ownerId, nonce)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildContractId) ⇒ `string` ⏏
    * [exports.buildHash(prefix, data, options)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildHash) ⇒ `String` ⏏
    * [exports.formatSalt(salt)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.formatSalt) ⇒ `string` ⏏
    * [exports.produceNameId(name)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.produceNameId) ⇒ `String` ⏏
    * [exports.decode(data, type)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.decode) ⇒ `Buffer` ⏏
    * [exports.encode(data, type)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.encode) ⇒ `String` ⏏
    * [exports.writeId(hashId)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeId) ⇒ `Buffer` ⏏
    * [exports.readId(buf)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readId) ⇒ `String` ⏏
    * [exports.writeInt(val)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeInt) ⇒ `Buffer` ⏏
    * [exports.readInt(buf)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readInt) ⇒ `String` ⏏
    * [exports.buildPointers(pointers)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildPointers) ⇒ `Array` ⏏
    * [exports.readPointers(pointers)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readPointers) ⇒ `Array` ⏏
    * [exports.ensureNameValid(name)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.ensureNameValid) ⇒ ⏏
    * [exports.isNameValid(name)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.isNameValid) ⇒ ⏏
    * [exports.validatePointers(pointers)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.validatePointers) ⇒ `Boolean` ⏏
    * [exports.getMinimumNameFee(domain)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.getMinimumNameFee) ⇒ `String` ⏏
    * [exports.computeBidFee(domain, startFee, [increment])](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.computeBidFee) ⇒ `String` ⏏
    * [exports.computeAuctionEndBlock(domain, claimHeight)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.computeAuctionEndBlock) ⇒ `String` ⏏
    * [exports.isAuctionName(name)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.isAuctionName) ⇒ `Boolean` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildContractId"></a>

#### exports.buildContractId(ownerId, nonce) ⇒ `string` ⏏
Build a contract public key

**Kind**: Exported function  
**Returns**: `string` - Contract public key  

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | The public key of the owner account |
| nonce | `number` | the nonce of the transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildHash"></a>

#### exports.buildHash(prefix, data, options) ⇒ `String` ⏏
Build hash

**Kind**: Exported function  
**Returns**: `String` - Transaction hash  

| Param | Type | Description |
| --- | --- | --- |
| prefix | `String` | Transaction hash prefix |
| data | `Buffer` | Rlp encoded transaction buffer |
| options | `Object` |  |
| options.raw | `Boolean` |  |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.formatSalt"></a>

#### exports.formatSalt(salt) ⇒ `string` ⏏
Format the salt into a 64-byte hex string

**Kind**: Exported function  
**Returns**: `string` - Zero-padded hex string of salt  

| Param | Type |
| --- | --- |
| salt | `number` | 

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.produceNameId"></a>

#### exports.produceNameId(name) ⇒ `String` ⏏
Encode a domain name

**Kind**: Exported function  
**Returns**: `String` - `nm_` prefixed encoded domain name  

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Name to encode |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.decode"></a>

#### exports.decode(data, type) ⇒ `Buffer` ⏏
Decode data using the default encoding/decoding algorithm

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer of decoded Base58check or Base64check data  

| Param | Type | Description |
| --- | --- | --- |
| data | `string` | An encoded and prefixed string (ex tx_..., sg_..., ak_....) |
| type | `string` | Prefix of Transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.encode"></a>

#### exports.encode(data, type) ⇒ `String` ⏏
Encode data using the default encoding/decoding algorithm

**Kind**: Exported function  
**Returns**: `String` - Encoded string Base58check or Base64check data  

| Param | Type | Description |
| --- | --- | --- |
| data | `Buffer` \| `String` | An decoded data |
| type | `string` | Prefix of Transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeId"></a>

#### exports.writeId(hashId) ⇒ `Buffer` ⏏
Utility function to create and _id type

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer Buffer with ID tag and decoded HASh  

| Param | Type | Description |
| --- | --- | --- |
| hashId | `string` | Encoded hash |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readId"></a>

#### exports.readId(buf) ⇒ `String` ⏏
Utility function to read and _id type

**Kind**: Exported function  
**Returns**: `String` - Encoided hash string with prefix  

| Param | Type | Description |
| --- | --- | --- |
| buf | `Buffer` | Data |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeInt"></a>

#### exports.writeInt(val) ⇒ `Buffer` ⏏
Utility function to convert int to bytes

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer Buffer from number(BigEndian)  

| Param | Type | Description |
| --- | --- | --- |
| val | `Number` \| `String` \| `BigNumber` | Value |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readInt"></a>

#### exports.readInt(buf) ⇒ `String` ⏏
Utility function to convert bytes to int

**Kind**: Exported function  
**Returns**: `String` - Buffer Buffer from number(BigEndian)  

| Param | Type | Description |
| --- | --- | --- |
| buf | `Buffer` | Value |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildPointers"></a>

#### exports.buildPointers(pointers) ⇒ `Array` ⏏
Helper function to build pointers for name update TX

**Kind**: Exported function  
**Returns**: `Array` - Serialized pointers array  

| Param | Type | Description |
| --- | --- | --- |
| pointers | `Array` | Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ]) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readPointers"></a>

#### exports.readPointers(pointers) ⇒ `Array` ⏏
Helper function to read pointers from name update TX

**Kind**: Exported function  
**Returns**: `Array` - Deserialize pointer array  

| Param | Type | Description |
| --- | --- | --- |
| pointers | `Array` | Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ]) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.ensureNameValid"></a>

#### exports.ensureNameValid(name) ⇒ ⏏
Ensure that name is valid

**Kind**: Exported function  
**Returns**: void  
**Throws**:

- Error


| Param | Type |
| --- | --- |
| name | `string` | 

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.isNameValid"></a>

#### exports.isNameValid(name) ⇒ ⏏
Is name valid

**Kind**: Exported function  
**Returns**: Boolean  

| Param | Type |
| --- | --- |
| name | `string` | 

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.validatePointers"></a>

#### exports.validatePointers(pointers) ⇒ `Boolean` ⏏
Validate name pointers array

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| pointers | `Array.&lt;String&gt;` | Pointers array. Allowed values is: account(ak_), oracle(ok_), contract(ct_), channel(ch_) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.getMinimumNameFee"></a>

#### exports.getMinimumNameFee(domain) ⇒ `String` ⏏
Get the minimum name fee for a domain

**Kind**: Exported function  
**Returns**: `String` - the minimum fee for the domain auction  

| Param | Type | Description |
| --- | --- | --- |
| domain | `String` | the domain name to get the fee for |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.computeBidFee"></a>

#### exports.computeBidFee(domain, startFee, [increment]) ⇒ `String` ⏏
Compute bid fee for AENS auction

**Kind**: Exported function  
**Returns**: `String` - Bid fee  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| domain | `String` |  | the domain name to get the fee for |
| startFee | `Number` \| `String` |  | Auction start fee |
| [increment] | `Number` | <code>0.5</code> | Bid multiplier(In percentage, must be between 0 and 1) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.computeAuctionEndBlock"></a>

#### exports.computeAuctionEndBlock(domain, claimHeight) ⇒ `String` ⏏
Compute auction end height

**Kind**: Exported function  
**Returns**: `String` - Auction end height  

| Param | Type | Description |
| --- | --- | --- |
| domain | `String` | the domain name to get the fee for |
| claimHeight | `Number` \| `String` | Auction starting height |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.isAuctionName"></a>

#### exports.isAuctionName(name) ⇒ `Boolean` ⏏
Is name accept going to auction

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Transaction abiVersion |

