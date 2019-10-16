<a id="module_@aeternity/aepp-sdk/es/tx/builder"></a>

## @aeternity/aepp-sdk/es/tx/builder
JavaScript-based Transaction builder

**Example**  
```js
import Transaction from '@aeternity/aepp-sdk/es/tx/builder'
```

* [@aeternity/aepp-sdk/es/tx/builder](#module_@aeternity/aepp-sdk/es/tx/builder)
    * [exports.calculateFee(fee, txType, options)](#exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.calculateFee) ⇒ `String` \| `Number` ⏏
    * [exports.validateParams(params, schema, excludeKeys)](#exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.validateParams) ⇒ `Object` ⏏
    * [exports.buildRawTx(params, schema, [options])](#exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildRawTx) ⇒ `Array` ⏏
    * [exports.unpackRawTx(binary, schema)](#exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.unpackRawTx) ⇒ `Object` ⏏
    * [exports.buildTx(params, type, [options])](#exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildTx) ⇒ `Object` ⏏
    * [exports.unpackTx(encodedTx, fromRlpBinary, prefix)](#exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.unpackTx) ⇒ `Object` ⏏
    * [exports.buildTxHash(rawTx)](#exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildTxHash) ⇒ `String` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.calculateFee"></a>

### exports.calculateFee(fee, txType, options) ⇒ `String` \| `Number` ⏏
Calculate fee

**Kind**: Exported function  
**rtype**: `(fee, txType, gas = 0) => String`

| Param | Type | Description |
| --- | --- | --- |
| fee | `String` \| `Number` | fee |
| txType | `String` | Transaction type |
| options | `Options` | Options object |
| options.gas | `String` \| `Number` | Gas amount |
| options.params | `Object` | Tx params |

**Example**  
```js
calculateFee(null, 'spendTx', { gas, params })
```
<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.validateParams"></a>

### exports.validateParams(params, schema, excludeKeys) ⇒ `Object` ⏏
Validate transaction params

**Kind**: Exported function  
**Returns**: `Object` - Object with validation errors  

| Param | Type | Description |
| --- | --- | --- |
| params | `Object` | Object with tx params |
| schema | `Array` | Transaction schema |
| excludeKeys | `Array` | Array of keys to exclude for validation |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildRawTx"></a>

### exports.buildRawTx(params, schema, [options]) ⇒ `Array` ⏏
Build binary transaction

**Kind**: Exported function  
**Returns**: `Array` - Array with binary fields of transaction  
**Throws**:

- `Error` Validation error


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | `Object` |  | Object with tx params |
| schema | `Array` |  | Transaction schema |
| [options] | `Object` | <code>{}</code> | options |
| [options.excludeKeys] | `Object` |  | excludeKeys Array of keys to exclude for validation and build |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.unpackRawTx"></a>

### exports.unpackRawTx(binary, schema) ⇒ `Object` ⏏
Unpack binary transaction

**Kind**: Exported function  
**Returns**: `Object` - Object with transaction field's  

| Param | Type | Description |
| --- | --- | --- |
| binary | `Array` | Array with binary transaction field's |
| schema | `Array` | Transaction schema |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildTx"></a>

### exports.buildTx(params, type, [options]) ⇒ `Object` ⏏
Build transaction hash

**Kind**: Exported function  
**Returns**: `Object` - { tx, rlpEncoded, binary } Object with tx -> Base64Check transaction hash with 'tx_' prefix, rlp encoded transaction and binary transaction  
**Throws**:

- `Error` Validation error


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | `Object` |  | Object with tx params |
| type | `String` |  | Transaction type |
| [options] | `Object` | <code>{}</code> | options |
| [options.excludeKeys] | `Object` |  | excludeKeys Array of keys to exclude for validation and build |
| [options.prefix] | `String` |  | Prefix of transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.unpackTx"></a>

### exports.unpackTx(encodedTx, fromRlpBinary, prefix) ⇒ `Object` ⏏
Unpack transaction hash

**Kind**: Exported function  
**Returns**: `Object` - { tx, rlpEncoded, binary } Object with tx -> Object with transaction param's, rlp encoded transaction and binary transaction  

| Param | Type | Description |
| --- | --- | --- |
| encodedTx | `String` \| `Array` | String or RLP encoded transaction array (if fromRlpBinary flag is true) |
| fromRlpBinary | `Boolean` | Unpack from RLP encoded transaction (default: false) |
| prefix | `String` | Prefix of data |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildTxHash"></a>

### exports.buildTxHash(rawTx) ⇒ `String` ⏏
Build a transaction hash

**Kind**: Exported function  
**Returns**: `String` - Transaction hash  

| Param | Type | Description |
| --- | --- | --- |
| rawTx | `String` \| `Buffer` | base64 or rlp encoded transaction |

