## tx
 
<a id="module_@aeternity/aepp-sdk/es/tx/builder"></a>

#### tx/builder
**Module Path:** @aeternity/aepp-sdk/es/tx/builder 

JavaScript-based Transaction builder

**Example**  
```js
import Transaction from '@aeternity/aepp-sdk/es/tx/builder'
```


<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.calculateFee"></a>

##### calculateFee

**Type Sig:** calculateFee(fee, txType, options) ⇒ `String` \| `Number` 

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

##### validateParams

**Type Sig:** validateParams(params, schema, excludeKeys) ⇒ `Object` 

Validate transaction params

**Kind**: Exported function  
**Returns**: `Object` - Object with validation errors  

| Param | Type | Description |
| --- | --- | --- |
| params | `Object` | Object with tx params |
| schema | `Array` | Transaction schema |
| excludeKeys | `Array` | Array of keys to exclude for validation |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildRawTx"></a>

##### buildRawTx

**Type Sig:** buildRawTx(params, schema, [options]) ⇒ `Array` 

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
| [options.excludeKeys] | `Array` | <code>[]</code> | excludeKeys Array of keys to exclude for validation and build |
| [options.denomination] | `String` | <code>&#x27;aettos&#x27;</code> | denomination Denomination of amounts (default: aettos) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.unpackRawTx"></a>

##### unpackRawTx

**Type Sig:** unpackRawTx(binary, schema) ⇒ `Object` 

Unpack binary transaction

**Kind**: Exported function  
**Returns**: `Object` - Object with transaction field's  

| Param | Type | Description |
| --- | --- | --- |
| binary | `Array` | Array with binary transaction field's |
| schema | `Array` | Transaction schema |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--getSchema"></a>

##### getSchema

**Type Sig:** getSchema() ⇒ `Object` 

Get transaction serialization/deserialization schema

**Kind**: Exported function  
**Returns**: `Object` - Schema  
**Throws**:

- `Error` Schema not found error


| Type |
| --- |
| `Object` | 

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildTx"></a>

##### buildTx

**Type Sig:** buildTx(params, type, [options]) ⇒ `Object` 

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

##### unpackTx

**Type Sig:** unpackTx(encodedTx, fromRlpBinary, prefix) ⇒ `Object` 

Unpack transaction hash

**Kind**: Exported function  
**Returns**: `Object` - { tx, rlpEncoded, binary } Object with tx -> Object with transaction param's, rlp encoded transaction and binary transaction  

| Param | Type | Description |
| --- | --- | --- |
| encodedTx | `String` \| `Buffer` | String or RLP encoded transaction array (if fromRlpBinary flag is true) |
| fromRlpBinary | `Boolean` | Unpack from RLP encoded transaction (default: false) |
| prefix | `String` | Prefix of data |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder--exports.buildTxHash"></a>

##### buildTxHash

**Type Sig:** buildTxHash(rawTx, options) ⇒ `String` 

Build a transaction hash

**Kind**: Exported function  
**Returns**: `String` - Transaction hash  

| Param | Type | Description |
| --- | --- | --- |
| rawTx | `String` \| `Buffer` | base64 or rlp encoded transaction |
| options | `Object` |  |
| options.raw | `Boolean` |  |

,
<a id="module_@aeternity/aepp-sdk/es/tx/builder/helpers"></a>

#### tx/builder/helpers
**Module Path:** @aeternity/aepp-sdk/es/tx/builder/helpers 

JavaScript-based Transaction builder helper function's

**Example**  
```js
import TxBuilderHelper from '@aeternity/aepp-sdk/es/tx/builder/helpers'
```


<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildContractId"></a>

##### buildContractId

**Type Sig:** buildContractId(ownerId, nonce) ⇒ `string` 

Build a contract public key

**Kind**: Exported function  
**Returns**: `string` - Contract public key  

| Param | Type | Description |
| --- | --- | --- |
| ownerId | `string` | The public key of the owner account |
| nonce | `number` | the nonce of the transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildHash"></a>

##### buildHash

**Type Sig:** buildHash(prefix, data, options) ⇒ `String` 

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

##### formatSalt

**Type Sig:** formatSalt(salt) ⇒ `string` 

Format the salt into a 64-byte hex string

**Kind**: Exported function  
**Returns**: `string` - Zero-padded hex string of salt  

| Param | Type |
| --- | --- |
| salt | `number` | 

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.produceNameId"></a>

##### produceNameId

**Type Sig:** produceNameId(name) ⇒ `String` 

Encode a domain name

**Kind**: Exported function  
**Returns**: `String` - `nm_` prefixed encoded domain name  

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Name to encode |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.decode"></a>

##### decode

**Type Sig:** decode(data, type) ⇒ `Buffer` 

Decode data using the default encoding/decoding algorithm

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer of decoded Base58check or Base64check data  

| Param | Type | Description |
| --- | --- | --- |
| data | `string` | An encoded and prefixed string (ex tx_..., sg_..., ak_....) |
| type | `string` | Prefix of Transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.encode"></a>

##### encode

**Type Sig:** encode(data, type) ⇒ `String` 

Encode data using the default encoding/decoding algorithm

**Kind**: Exported function  
**Returns**: `String` - Encoded string Base58check or Base64check data  

| Param | Type | Description |
| --- | --- | --- |
| data | `Buffer` \| `String` | An decoded data |
| type | `string` | Prefix of Transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeId"></a>

##### writeId

**Type Sig:** writeId(hashId) ⇒ `Buffer` 

Utility function to create and _id type

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer Buffer with ID tag and decoded HASh  

| Param | Type | Description |
| --- | --- | --- |
| hashId | `string` | Encoded hash |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readId"></a>

##### readId

**Type Sig:** readId(buf) ⇒ `String` 

Utility function to read and _id type

**Kind**: Exported function  
**Returns**: `String` - Encoided hash string with prefix  

| Param | Type | Description |
| --- | --- | --- |
| buf | `Buffer` | Data |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.writeInt"></a>

##### writeInt

**Type Sig:** writeInt(val) ⇒ `Buffer` 

Utility function to convert int to bytes

**Kind**: Exported function  
**Returns**: `Buffer` - Buffer Buffer from number(BigEndian)  

| Param | Type | Description |
| --- | --- | --- |
| val | `Number` \| `String` \| `BigNumber` | Value |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readInt"></a>

##### readInt

**Type Sig:** readInt(buf) ⇒ `String` 

Utility function to convert bytes to int

**Kind**: Exported function  
**Returns**: `String` - Buffer Buffer from number(BigEndian)  

| Param | Type | Description |
| --- | --- | --- |
| buf | `Buffer` | Value |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.buildPointers"></a>

##### buildPointers

**Type Sig:** buildPointers(pointers) ⇒ `Array` 

Helper function to build pointers for name update TX

**Kind**: Exported function  
**Returns**: `Array` - Serialized pointers array  

| Param | Type | Description |
| --- | --- | --- |
| pointers | `Array` | Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ]) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.readPointers"></a>

##### readPointers

**Type Sig:** readPointers(pointers) ⇒ `Array` 

Helper function to read pointers from name update TX

**Kind**: Exported function  
**Returns**: `Array` - Deserialize pointer array  

| Param | Type | Description |
| --- | --- | --- |
| pointers | `Array` | Array of pointers ([ { key: 'account_pubkey', id: 'ak_32klj5j23k23j5423l434l2j3423'} ]) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.isNameValid"></a>

##### isNameValid

**Type Sig:** isNameValid(name, [throwError]) ⇒ 

Is name valid

**Kind**: Exported function  
**Returns**: Boolean  
**Throws**:

- Error


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `string` |  |  |
| [throwError] | `boolean` | <code>true</code> | Throw error on invalid |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.validatePointers"></a>

##### validatePointers

**Type Sig:** validatePointers(pointers) ⇒ `Boolean` 

Validate name pointers array

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| pointers | `Array.&lt;String&gt;` | Pointers array. Allowed values is: account(ak_), oracle(ok_), contract(ct_), channel(ch_) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.getMinimumNameFee"></a>

##### getMinimumNameFee

**Type Sig:** getMinimumNameFee(domain) ⇒ `String` 

Get the minimum name fee for a domain

**Kind**: Exported function  
**Returns**: `String` - the minimum fee for the domain auction  

| Param | Type | Description |
| --- | --- | --- |
| domain | `String` | the domain name to get the fee for |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.computeBidFee"></a>

##### computeBidFee

**Type Sig:** computeBidFee(domain, startFee, [increment]) ⇒ `String` 

Compute bid fee for AENS auction

**Kind**: Exported function  
**Returns**: `String` - Bid fee  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| domain | `String` |  | the domain name to get the fee for |
| startFee | `Number` \| `String` |  | Auction start fee |
| [increment] | `Number` | <code>0.5</code> | Bid multiplier(In percentage, must be between 0 and 1) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.computeAuctionEndBlock"></a>

##### computeAuctionEndBlock

**Type Sig:** computeAuctionEndBlock(domain, claimHeight) ⇒ `String` 

Compute auction end height

**Kind**: Exported function  
**Returns**: `String` - Auction end height  

| Param | Type | Description |
| --- | --- | --- |
| domain | `String` | the domain name to get the fee for |
| claimHeight | `Number` \| `String` | Auction starting height |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.getContractBackendFromTx"></a>

##### getContractBackendFromTx

**Type Sig:** getContractBackendFromTx({) ⇒ `String` 

Get contract backend by abiVersion

**Kind**: Exported function  
**Returns**: `String` - Backend  

| Param | Type | Description |
| --- | --- | --- |
| { | `Object` | abiVersion } abiVersion Transaction abiVersion |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/helpers--exports.isAuctionName"></a>

##### isAuctionName

**Type Sig:** isAuctionName(name) ⇒ `Boolean` 

Is name accept going to auction

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Transaction abiVersion |

,
<a id="module_@aeternity/aepp-sdk/es/tx/builder/schema"></a>

#### tx/builder/schema
**Module Path:** @aeternity/aepp-sdk/es/tx/builder/schema 

Transaction Schema for TxBuilder

**Example**  
```js
import TxSchema from '@aeternity/aepp-sdk/es/tx/builder/schema'
```
<a id="exp_module_@aeternity/aepp-sdk/es/tx/builder/schema--exports.TX_TYPE"></a>

##### TX\_TYPE 
**Type Sig:** TX\_TYPE 

##### 

**Type Sig:** TX\_TYPE 

Object with transaction types

**Kind**: Exported constant  
**Properties**

| Name | Type |
| --- | --- |
| signed | `String` | 
| spend | `String` | 
| nameClaim | `String` | 
| namePreClaim | `String` | 
| nameUpdate | `String` | 
| nameRevoke | `String` | 
| nameTransfer | `String` | 
| contractCreate | `String` | 
| contractCall | `String` | 
| oracleRegister | `String` | 
| oracleExtend | `String` | 
| oracleQuery | `String` | 
| oracleResponse | `String` | 

,
<a id="module_@aeternity/aepp-sdk/es/tx"></a>

#### tx
**Module Path:** @aeternity/aepp-sdk/es/tx 

Tx module

**Example**  
```js
import Tx from '@aeternity/aepp-sdk/es/tx'
```


<a id="exp_module_@aeternity/aepp-sdk/es/tx--Tx"></a>

##### Tx

**Type Sig:** Tx([options]) ⇒ `Object` 

Basic Tx Stamp

Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

Tx is one of the three basic building blocks of an
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) client and provides methods to
create aeternity transactions.

**Kind**: Exported function  
**Returns**: `Object` - Tx instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

**Example**  
```js
Tx()
```
<a id="module_@aeternity/aepp-sdk/es/tx--Tx+spendTx"></a>

###### spendTx
**Type Sig:** tx.spendTx(options) ⇒ `String`
Create a `spend_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `spend_tx` transaction  
**Category**: async  
**rtype**: `({sender?: String, recipientId: String, amount: Number, fee?: Number, ttl?: Number, nonce?: Number, payload?: String}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+namePreclaimTx"></a>

###### namePreclaimTx
**Type Sig:** tx.namePreclaimTx(options) ⇒ `String`
Create a `name_preclaim_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_preclaim_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, commitment: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+nameClaimTx"></a>

###### nameClaimTx
**Type Sig:** tx.nameClaimTx(options) ⇒ `String`
Create a `name_claim_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_claim_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, name: String, nameSalt: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+nameTransferTx"></a>

###### nameTransferTx
**Type Sig:** tx.nameTransferTx(options) ⇒ `String`
Create a `name_transfer_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_transfer_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, recipientId: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+nameUpdateTx"></a>

###### nameUpdateTx
**Type Sig:** tx.nameUpdateTx(options) ⇒ `String`
Create a `name_update_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_update_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, pointers: Object, nameTtl: Number, clientTtl: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+nameRevokeTx"></a>

###### nameRevokeTx
**Type Sig:** tx.nameRevokeTx(options) ⇒ `String`
Create a `name_revoke_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_revoke_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+contractCreateTx"></a>

###### contractCreateTx
**Type Sig:** tx.contractCreateTx(options) ⇒ `String`
Create a `contract_create_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `contract_create_tx` transaction  
**Category**: async  
**rtype**: `({owner: String, code: String, callData: String, vmVersion: Number, deposit: Number, amount: Number, gas: Number, gasPrice: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+contractCallTx"></a>

###### contractCallTx
**Type Sig:** tx.contractCallTx(options) ⇒ `String`
Create a `contract_call_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `contract_call_tx` transaction  
**Category**: async  
**rtype**: `({callerId: String, contract: String, callData: String, vmVersion: Number, amount: Number, gas: Number, gasPrice: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+oracleRegisterTx"></a>

###### oracleRegisterTx
**Type Sig:** tx.oracleRegisterTx(options) ⇒ `String`
Create a `oracle_register_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `oracle_register_tx` transaction  
**Category**: async  
**rtype**: `({ accountId: String, queryFormat: String, responseFormat: String, queryFee: String|Number, oracleTtl: Object, vmVersion: Number = ORACLE_VM_VERSION, fee?: Number, ttl?: Number, nonce?: Number }) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+oracleExtendTx"></a>

###### oracleExtendTx
**Type Sig:** tx.oracleExtendTx(options) ⇒ `String`
Create a `oracle_extend_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `oracle_extend_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, callerId: String, oracleTtl: Object, fee?: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+oraclePostQuery"></a>

###### oraclePostQuery
**Type Sig:** tx.oraclePostQuery(options) ⇒ `String`
Create a `oracle_post_query_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `oracle_post_query_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, responseTtl: Object, query: String, queryTtl: Object, queryFee: String|Number, senderId: String, fee?: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+oracleRespondTx"></a>

###### oracleRespondTx
**Type Sig:** tx.oracleRespondTx(options) ⇒ `String`
Create a `oracle_respond_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `oracle_respond_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, callerId: String, responseTtl: Object, queryId: String, response: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+getAccountNonce"></a>

###### getAccountNonce
**Type Sig:** tx.getAccountNonce(address) ⇒ `Number`
Get Account Nonce

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `Number` - Result  
**Category**: async  
**rtype**: `(address) => result: Number`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Account public key |

,
<a id="module_@aeternity/aepp-sdk/es/tx/tx"></a>

#### tx/tx
**Module Path:** @aeternity/aepp-sdk/es/tx/tx 

Transaction module

**Example**  
```js
import Transaction from '@aeternity/aepp-sdk/es/tx/tx'
```
<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction"></a>

##### Transaction

**Type Sig:** Transaction([options]) ⇒ `Object` 

Transaction Stamp

This is implementation of [Tx](api/tx.md) relays
the creation of transactions to [module:@aeternity/aepp-sdk/es/Node](module:@aeternity/aepp-sdk/es/Node).
This stamp provide ability to create native transaction's,
or transaction's using Node API.
As there is no built-in security between Node and client communication,
creating transaction using [module:@aeternity/aepp-sdk/es/Node](module:@aeternity/aepp-sdk/es/Node) API
must never be used for production but can be very useful to verify other
implementations.

**Kind**: Exported function  
**Returns**: `Object` - Transaction instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.nativeMode] | `Boolean` | <code>true</code> | options.nativeMode - Use Native build of transaction's |
| options.url | `String` |  | Node url |
| options.internalUrl | `String` |  | Node internal url |

**Example**  
```js
Transaction({url: 'https://testnet.aeternity.io/'})
```
,
<a id="module_@aeternity/aepp-sdk/es/tx/tx-object"></a>

#### tx/tx-object
**Module Path:** @aeternity/aepp-sdk/es/tx/tx-object 

TxObject module

**Example**  
```js
import TxObject from '@aeternity/aepp-sdk/es/tx/tx-object'
```

    

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--buildTransaction"></a>

##### buildTransaction

**Type Sig:** buildTransaction(type, params, [options]) ⇒ `Object` 

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

##### unpackTransaction

**Type Sig:** unpackTransaction(tx) ⇒ `Object` 

Unpack transaction from RLP encoded binary or base64c string

**Kind**: Exported function  
**Throws**:

- `Error` Arguments validation error's


| Param | Type | Description |
| --- | --- | --- |
| tx | `Buffer` \| `String` | RLP encoded binary or base64c(rlpBinary) string |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--initTransaction"></a>

##### initTransaction

**Type Sig:** initTransaction([tx], params, type, [options]) ⇒ `Object` 

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

##### TxObject

**Type Sig:** TxObject([options]) ⇒ `Object` 

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

##### setProp

**Type Sig:** setProp(props, options) ⇒ `TxObject` 

Rebuild transaction with new params and recalculate fee

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| props | `Object` | Transaction properties for update |
| options |  |  |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--getSignatures"></a>

##### getSignatures

**Type Sig:** getSignatures() ⇒ `Array` 

Get signatures

**Kind**: Exported function  
**Returns**: `Array` - Array of signatures  
<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--addSignature"></a>

##### addSignature

**Type Sig:** addSignature(signature) ⇒ `void` 

Add signature

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| signature | `Buffer` \| `String` | Signature to add ( Can be: Buffer | Uint8Array | HexString ) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--calculateMinFee"></a>

##### calculateMinFee

**Type Sig:** calculateMinFee(props) ⇒ `String` 

Calculate fee

**Kind**: Exported function  
**Returns**: `String` - fee  

| Param | Type |
| --- | --- |
| props | `Object` | 

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--fromString"></a>

##### fromString
**Type Sig:** fromString(tx) ⇒ `TxObject` 
Create txObject from base64c RLP encoded transaction string with 'tx_' prefix

**Kind**: static method of [`@aeternity/aepp-sdk/es/tx/tx-object`](#module_@aeternity/aepp-sdk/es/tx/tx-object)  

| Param | Type | Description |
| --- | --- | --- |
| tx | `String` | Transaction string (tx_23fsdgsdfg...) |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx-object--fromRlp"></a>

##### fromRlp
**Type Sig:** fromRlp(tx) ⇒ `TxObject` 
Create txObject from transaction RLP binary

**Kind**: static method of [`@aeternity/aepp-sdk/es/tx/tx-object`](#module_@aeternity/aepp-sdk/es/tx/tx-object)  

| Param | Type | Description |
| --- | --- | --- |
| tx | `Buffer` | Transaction RLP binary |

,
<a id="module_@aeternity/aepp-sdk/es/tx/validator"></a>

#### tx/validator
**Module Path:** @aeternity/aepp-sdk/es/tx/validator 

Transaction validator

**Example**  
```js
import TransactionValidator from '@aeternity/aepp-sdk/es/tx/validator'
```


<a id="exp_module_@aeternity/aepp-sdk/es/tx/validator--unpackAndVerify"></a>

##### unpackAndVerify

**Type Sig:** unpackAndVerify(txHash, [options]) ⇒ `Promise.&lt;Object&gt;` 

Unpack and verify transaction (verify nonce, ttl, fee, signature, account balance)

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Object with verification errors and warnings  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| txHash | `String` |  | Base64Check transaction hash |
| [options] | `Object` | <code>{}</code> | Options |
| [options.networkId] | `String` |  | networkId Use in signature verification |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/validator--verifyTx"></a>

##### verifyTx

**Type Sig:** verifyTx([data], networkId) ⇒ `Promise.&lt;Array&gt;` 

Verify transaction (verify nonce, ttl, fee, signature, account balance)

**Kind**: Exported function  
**Returns**: `Promise.&lt;Array&gt;` - Object with verification errors and warnings  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [data] | `Object` | <code>{}</code> | data TX data object |
| [data.tx] | `String` |  | tx Transaction hash |
| [data.signatures] | `Array` |  | signatures Transaction signature's |
| [data.rlpEncoded] | `Array` |  | rlpEncoded RLP encoded transaction |
| networkId | `String` |  | networkId Use in signature verification |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/validator--TransactionValidator"></a>

##### TransactionValidator

**Type Sig:** TransactionValidator([options]) ⇒ `Object` 

Transaction Validator Stamp
This stamp give us possibility to unpack and validate some of transaction properties,
to make sure we can post it to the chain

**Kind**: Exported function  
**Returns**: `Object` - Transaction Validator instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.url] | `Object` |  | Node url |
| [options.internalUrl] | `Object` |  | Node internal url |

**Example**  
```js
TransactionValidator({url: 'https://testnet.aeternity.io'})
```
,
