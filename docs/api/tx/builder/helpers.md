<a id="module_@aeternity/aepp-sdk/es/tx/builder/helpers"></a>

## @aeternity/aepp-sdk/es/tx/builder/helpers
JavaScript-based Transaction builder helper function's

**Example**  
```js
import TxBuilderHelper from '@aeternity/aepp-sdk/es/tx/builder/helpers'
```

* [@aeternity/aepp-sdk/es/tx/builder/helpers](#module_@aeternity/aepp-sdk/es/tx/builder/helpers)
    * [exports.buildContractId(ownerId, nonce)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildContractId) ⇒ `string` ⏏
    * [exports.buildHash(prefix, data)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildHash) ⇒ `String` ⏏
    * [exports.formatSalt(salt)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.formatSalt) ⇒ `string` ⏏
    * [exports.decode(data, type)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.decode) ⇒ `Buffer` ⏏
    * [exports.encode(data, type)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.encode) ⇒ `String` ⏏
    * [exports.writeId(hashId)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeId) ⇒ `Buffer` ⏏
    * [exports.readId(buf)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readId) ⇒ `String` ⏏
    * [exports.writeInt(val)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeInt) ⇒ `Buffer` ⏏
    * [exports.readInt(buf)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readInt) ⇒ `String` ⏏
    * [exports.buildPointers(pointers)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildPointers) ⇒ `Array` ⏏
    * [exports.readPointers(pointers)](#exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readPointers) ⇒ `Array` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildContractId"></a>

### exports.buildContractId(ownerId, nonce) ⇒ `string` ⏏
Build a contract public key

**Kind**: Exported function  
**Returns**: `string` - Contract public key  

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | The public key of the owner account |
| nonce | `number` | the nonce of the transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildHash"></a>

### exports.buildHash(prefix, data) ⇒ `String` ⏏
Build hash

**Kind**: Exported function  
**Returns**: `String` - Transaction hash  

| Param | Type | Description |
| --- | --- | --- |
| prefix | `String` | Transaction hash prefix |
| data | `Buffer` | Rlp encoded transaction buffer |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.formatSalt"></a>

### exports.formatSalt(salt) ⇒ `string` ⏏
Format the salt into a 64-byte hex string

**Kind**: Exported function  
**Returns**: `string` - Zero-padded hex string of salt  

| Param | Type |
| --- | --- |
| salt | `number` | 

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.decode"></a>

### exports.decode(data, type) ⇒ `Buffer` ⏏
Decode data using the default encoding/decoding algorithm

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer of decoded Base58check or Base64check data  

| Param | Type | Description |
| --- | --- | --- |
| data | `string` | An encoded and prefixed string (ex tx_..., sg_..., ak_....) |
| type | `string` | Prefix of Transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.encode"></a>

### exports.encode(data, type) ⇒ `String` ⏏
Encode data using the default encoding/decoding algorithm

**Kind**: Exported function  
**Returns**: `String` - Encoded string Base58check or Base64check data  

| Param | Type | Description |
| --- | --- | --- |
| data | `Buffer` \| `String` | An decoded data |
| type | `string` | Prefix of Transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeId"></a>

### exports.writeId(hashId) ⇒ `Buffer` ⏏
Utility function to create and _id type

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer Buffer with ID tag and decoded HASh  

| Param | Type | Description |
| --- | --- | --- |
| hashId | `string` | Encoded hash |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readId"></a>

### exports.readId(buf) ⇒ `String` ⏏
Utility function to read and _id type

**Kind**: Exported function  
**Returns**: `String` - Encoided hash string with prefix  

| Param | Type | Description |
| --- | --- | --- |
| buf | `Buffer` | Data |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeInt"></a>

### exports.writeInt(val) ⇒ `Buffer` ⏏
Utility function to convert int to bytes

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer Buffer from number(BigEndian)  

| Param | Type | Description |
| --- | --- | --- |
| val | `Number` \| `String` \| `BigNumber` | Value |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readInt"></a>

### exports.readInt(buf) ⇒ `String` ⏏
Utility function to convert bytes to int

**Kind**: Exported function  
**Returns**: `String` - Buffer Buffer from number(BigEndian)  

| Param | Type | Description |
| --- | --- | --- |
| buf | `Buffer` | Value |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildPointers"></a>

### exports.buildPointers(pointers) ⇒ `Array` ⏏
Helper function to build pointers for name update TX

**Kind**: Exported function  
**Returns**: `Array` - Serialized pointers array  

| Param | Type | Description |
| --- | --- | --- |
| pointers | `Array` | Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ]) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readPointers"></a>

### exports.readPointers(pointers) ⇒ `Array` ⏏
Helper function to read pointers from name update TX

**Kind**: Exported function  
**Returns**: `Array` - Deserialize pointer array  

| Param | Type | Description |
| --- | --- | --- |
| pointers | `Array` | Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ]) |

