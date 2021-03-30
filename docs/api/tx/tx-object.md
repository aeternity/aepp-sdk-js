<a id="module_@aeternity/aepp-sdk/es/tx/tx-object"></a>

### @aeternity/aepp-sdk/es/tx/tx-object
TxObject module

**Example**  
```js
import TxObject from '@aeternity/aepp-sdk/es/tx/tx-object'
```

* [@aeternity/aepp-sdk/es/tx/tx-object](#module_@aeternity/aepp-sdk/es/tx/tx-object)
    * [buildTransaction(type, params, [options])](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--buildTransaction) ⇒ `Object` ⏏
    * [unpackTransaction(tx)](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--unpackTransaction) ⇒ `Object` ⏏
    * [initTransaction([tx], params, type, [options])](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--initTransaction) ⇒ `Object` ⏏
    * [exports.TxObject([options])](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--exports.TxObject) ⇒ `Object` ⏏
    * [setProp(props, options)](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--setProp) ⇒ `TxObject` ⏏
    * [getSignatures()](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--getSignatures) ⇒ `Array` ⏏
    * [addSignature(signature)](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--addSignature) ⇒ `void` ⏏
    * [calculateMinFee(props)](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--calculateMinFee) ⇒ `String` ⏏
    * _static_
        * [.fromString(tx)](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--fromString) ⇒ `TxObject` ⏏
        * [.fromRlp(tx)](#exp_module_@aeternity/aepp-sdk/es/tx/tx-object--fromRlp) ⇒ `TxObject` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--buildTransaction"></a>

#### buildTransaction(type, params, [options]) ⇒ `Object` ⏏
Build transaction from object

**Kind**: Exported function  
**Throws**:

- `Error` Arguments validation error's


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| type | `String` |  | Transaction type |
| params | `Object` |  | Transaction params |
| [options] | `Object` | <code>{}</code> | Options |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--unpackTransaction"></a>

#### unpackTransaction(tx) ⇒ `Object` ⏏
Unpack transaction from RLP encoded binary or base64c string

**Kind**: Exported function  
**Throws**:

- `Error` Arguments validation error's


| Param | Type | Description |
| --- | --- | --- |
| tx | `Buffer` \| `String` | RLP encoded binary or base64c(rlpBinary) string |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--initTransaction"></a>

#### initTransaction([tx], params, type, [options]) ⇒ `Object` ⏏
Helper which build or unpack transaction base on constructor arguments
Need to provide one of arguments: [tx] -> unpack flow or [params, type] -> build flow

**Kind**: Exported function  
**Throws**:

- `Error` Arguments validation error's


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [tx] | `Buffer` \| `String` |  | Transaction rlp binary or vase64c string |
| params | `Object` |  | Transaction params |
| type | `String` |  | Transaction type |
| [options] | `Object` | <code>{}</code> | Options |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--exports.TxObject"></a>

#### exports.TxObject([options]) ⇒ `Object` ⏏
Transaction Validator Stamp
This stamp give us possibility to unpack and validate some of transaction properties,
to make sure we can post it to the chain

**Kind**: Exported function  
**Returns**: `Object` - TxObject instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.tx] | `Buffer` \| `String` |  | Rlp binary or base64c transaction |
| [options.params] | `Object` |  | Transaction params |
| [options.type] | `String` |  | Transaction type |
| [options.options] | `Object` |  | Build options |

**Example**  
```js
TxObject({ params: {...}, type: 'spendTx' })
```
<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--setProp"></a>

#### setProp(props, options) ⇒ `TxObject` ⏏
Rebuild transaction with new params and recalculate fee

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| props | `Object` | Transaction properties for update |
| options |  |  |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--getSignatures"></a>

#### getSignatures() ⇒ `Array` ⏏
Get signatures

**Kind**: Exported function  
**Returns**: `Array` - Array of signatures  
<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--addSignature"></a>

#### addSignature(signature) ⇒ `void` ⏏
Add signature

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| signature | `Buffer` \| `String` | Signature to add ( Can be: Buffer | Uint8Array | HexString ) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--calculateMinFee"></a>

#### calculateMinFee(props) ⇒ `String` ⏏
Calculate fee

**Kind**: Exported function  
**Returns**: `String` - fee  

| Param | Type |
| --- | --- |
| props | `Object` | 

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--fromString"></a>

#### .fromString(tx) ⇒ `TxObject` ⏏
Create txObject from base64c RLP encoded transaction string with 'tx_' prefix

**Kind**: static method of [`@aeternity/aepp-sdk/es/tx/tx-object`](#module_@aeternity/aepp-sdk/es/tx/tx-object)  

| Param | Type | Description |
| --- | --- | --- |
| tx | `String` | Transaction string (tx_23fsdgsdfg...) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--fromRlp"></a>

#### .fromRlp(tx) ⇒ `TxObject` ⏏
Create txObject from transaction RLP binary

**Kind**: static method of [`@aeternity/aepp-sdk/es/tx/tx-object`](#module_@aeternity/aepp-sdk/es/tx/tx-object)  

| Param | Type | Description |
| --- | --- | --- |
| tx | `Buffer` | Transaction RLP binary |

