<a id="module_@aeternity/aepp-sdk/es/tx"></a>

## @aeternity/aepp-sdk/es/tx
Tx module

**Example**  
```js
import Tx from '@aeternity/aepp-sdk/es/tx'
```

* [@aeternity/aepp-sdk/es/tx](#module_@aeternity/aepp-sdk/es/tx)
    * [Tx([options])](#exp_module_@aeternity/aepp-sdk/es/tx--Tx) ⇒ `Object` ⏏
        * *[.spendTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+spendTx) ⇒ `String`*
        * *[.namePreclaimTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+namePreclaimTx) ⇒ `String`*
        * *[.nameClaimTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+nameClaimTx) ⇒ `String`*
        * *[.nameTransferTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+nameTransferTx) ⇒ `String`*
        * *[.nameUpdateTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+nameUpdateTx) ⇒ `String`*
        * *[.nameRevokeTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+nameRevokeTx) ⇒ `String`*
        * *[.contractCreateTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+contractCreateTx) ⇒ `String`*
        * *[.contractCallTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+contractCallTx) ⇒ `String`*
        * *[.oracleRegisterTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+oracleRegisterTx) ⇒ `String`*
        * *[.oracleExtendTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+oracleExtendTx) ⇒ `String`*
        * *[.oraclePostQuery(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+oraclePostQuery) ⇒ `String`*
        * *[.oracleRespondTx(options)](#module_@aeternity/aepp-sdk/es/tx--Tx+oracleRespondTx) ⇒ `String`*
        * *[.getAccountNonce(address)](#module_@aeternity/aepp-sdk/es/tx--Tx+getAccountNonce) ⇒ `Number`*

<a id="exp_module_@aeternity/aepp-sdk/es/tx--Tx"></a>

### Tx([options]) ⇒ `Object` ⏏
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

#### *tx.spendTx(options) ⇒ `String`*
Create a `spend_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `spend_tx` transaction  
**Category**: async  
**rtype**: `({sender?: String, recipientId: String, amount: Number, fee?: Number, ttl?: Number, nonce?: Number, payload?: String}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+namePreclaimTx"></a>

#### *tx.namePreclaimTx(options) ⇒ `String`*
Create a `name_preclaim_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_preclaim_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, commitment: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+nameClaimTx"></a>

#### *tx.nameClaimTx(options) ⇒ `String`*
Create a `name_claim_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_claim_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, name: String, nameSalt: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+nameTransferTx"></a>

#### *tx.nameTransferTx(options) ⇒ `String`*
Create a `name_transfer_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_transfer_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, recipientId: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+nameUpdateTx"></a>

#### *tx.nameUpdateTx(options) ⇒ `String`*
Create a `name_update_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_update_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, pointers: Object, nameTtl: Number, clientTtl: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+nameRevokeTx"></a>

#### *tx.nameRevokeTx(options) ⇒ `String`*
Create a `name_revoke_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `name_revoke_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+contractCreateTx"></a>

#### *tx.contractCreateTx(options) ⇒ `String`*
Create a `contract_create_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `contract_create_tx` transaction  
**Category**: async  
**rtype**: `({owner: String, code: String, callData: String, vmVersion: Number, deposit: Number, amount: Number, gas: Number, gasPrice: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+contractCallTx"></a>

#### *tx.contractCallTx(options) ⇒ `String`*
Create a `contract_call_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `contract_call_tx` transaction  
**Category**: async  
**rtype**: `({callerId: String, contract: String, callData: String, vmVersion: Number, amount: Number, gas: Number, gasPrice: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+oracleRegisterTx"></a>

#### *tx.oracleRegisterTx(options) ⇒ `String`*
Create a `oracle_register_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `oracle_register_tx` transaction  
**Category**: async  
**rtype**: `({ accountId: String, queryFormat: String, responseFormat: String, queryFee: String|Number, oracleTtl: Object, vmVersion: Number = ORACLE_VM_VERSION, fee?: Number, ttl?: Number, nonce?: Number }) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+oracleExtendTx"></a>

#### *tx.oracleExtendTx(options) ⇒ `String`*
Create a `oracle_extend_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `oracle_extend_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, callerId: String, oracleTtl: Object, fee?: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+oraclePostQuery"></a>

#### *tx.oraclePostQuery(options) ⇒ `String`*
Create a `oracle_post_query_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `oracle_post_query_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, responseTtl: Object, query: String, queryTtl: Object, queryFee: String|Number, senderId: String, fee?: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+oracleRespondTx"></a>

#### *tx.oracleRespondTx(options) ⇒ `String`*
Create a `oracle_respond_tx` transaction

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `String` - `oracle_respond_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, callerId: String, responseTtl: Object, queryId: String, response: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx--Tx+getAccountNonce"></a>

#### *tx.getAccountNonce(address) ⇒ `Number`*
Get Account Nonce

**Kind**: instance abstract method of [`Tx`](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)  
**Returns**: `Number` - Result  
**Category**: async  
**rtype**: `(address) => result: Number`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Account public key |

