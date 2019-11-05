<a id="module_@aeternity/aepp-sdk/es/tx"></a>

## @aeternity/aepp-sdk/es/tx
Tx module

**Example**  
```js
import Tx from '@aeternity/aepp-sdk/es/tx'
```

* [@aeternity/aepp-sdk/es/tx](#module_@aeternity/aepp-sdk/es/tx)
    * *[.spendTx(options)](#module_@aeternity/aepp-sdk/es/tx+spendTx) ⇒ `String`*
    * *[.namePreclaimTx(options)](#module_@aeternity/aepp-sdk/es/tx+namePreclaimTx) ⇒ `String`*
    * *[.nameClaimTx(options)](#module_@aeternity/aepp-sdk/es/tx+nameClaimTx) ⇒ `String`*
    * *[.nameTransferTx(options)](#module_@aeternity/aepp-sdk/es/tx+nameTransferTx) ⇒ `String`*
    * *[.nameUpdateTx(options)](#module_@aeternity/aepp-sdk/es/tx+nameUpdateTx) ⇒ `String`*
    * *[.nameRevokeTx(options)](#module_@aeternity/aepp-sdk/es/tx+nameRevokeTx) ⇒ `String`*
    * *[.contractCreateTx(options)](#module_@aeternity/aepp-sdk/es/tx+contractCreateTx) ⇒ `String`*
    * *[.contractCallTx(options)](#module_@aeternity/aepp-sdk/es/tx+contractCallTx) ⇒ `String`*
    * *[.oracleRegisterTx(options)](#module_@aeternity/aepp-sdk/es/tx+oracleRegisterTx) ⇒ `String`*
    * *[.oracleExtendTx(options)](#module_@aeternity/aepp-sdk/es/tx+oracleExtendTx) ⇒ `String`*
    * *[.oraclePostQuery(options)](#module_@aeternity/aepp-sdk/es/tx+oraclePostQuery) ⇒ `String`*
    * *[.oracleRespondTx(options)](#module_@aeternity/aepp-sdk/es/tx+oracleRespondTx) ⇒ `String`*
    * *[.getAccountNonce(address)](#module_@aeternity/aepp-sdk/es/tx+getAccountNonce) ⇒ `Number`*

<a id="module_@aeternity/aepp-sdk/es/tx+spendTx"></a>

### *@aeternity/aepp-sdk/es/tx.spendTx(options) ⇒ `String`*
Create a `spend_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `spend_tx` transaction  
**Category**: async  
**rtype**: `({sender?: String, recipientId: String, amount: Number, fee?: Number, ttl?: Number, nonce?: Number, payload?: String}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+namePreclaimTx"></a>

### *@aeternity/aepp-sdk/es/tx.namePreclaimTx(options) ⇒ `String`*
Create a `name_preclaim_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `name_preclaim_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, commitment: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+nameClaimTx"></a>

### *@aeternity/aepp-sdk/es/tx.nameClaimTx(options) ⇒ `String`*
Create a `name_claim_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `name_claim_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, name: String, nameSalt: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+nameTransferTx"></a>

### *@aeternity/aepp-sdk/es/tx.nameTransferTx(options) ⇒ `String`*
Create a `name_transfer_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `name_transfer_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, recipientId: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+nameUpdateTx"></a>

### *@aeternity/aepp-sdk/es/tx.nameUpdateTx(options) ⇒ `String`*
Create a `name_update_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `name_update_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, pointers: Object, nameTtl: Number, clientTtl: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+nameRevokeTx"></a>

### *@aeternity/aepp-sdk/es/tx.nameRevokeTx(options) ⇒ `String`*
Create a `name_revoke_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `name_revoke_tx` transaction  
**Category**: async  
**rtype**: `({account?: String, nameId: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+contractCreateTx"></a>

### *@aeternity/aepp-sdk/es/tx.contractCreateTx(options) ⇒ `String`*
Create a `contract_create_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `contract_create_tx` transaction  
**Category**: async  
**rtype**: `({owner: String, code: String, callData: String, vmVersion: Number, deposit: Number, amount: Number, gas: Number, gasPrice: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+contractCallTx"></a>

### *@aeternity/aepp-sdk/es/tx.contractCallTx(options) ⇒ `String`*
Create a `contract_call_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `contract_call_tx` transaction  
**Category**: async  
**rtype**: `({callerId: String, contract: String, callData: String, vmVersion: Number, amount: Number, gas: Number, gasPrice: Number, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+oracleRegisterTx"></a>

### *@aeternity/aepp-sdk/es/tx.oracleRegisterTx(options) ⇒ `String`*
Create a `oracle_register_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `oracle_register_tx` transaction  
**Category**: async  
**rtype**: `({ accountId: String, queryFormat: String, responseFormat: String, queryFee: String|Number, oracleTtl: Object, vmVersion: Number = ORACLE_VM_VERSION, fee?: Number, ttl?: Number, nonce?: Number }) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+oracleExtendTx"></a>

### *@aeternity/aepp-sdk/es/tx.oracleExtendTx(options) ⇒ `String`*
Create a `oracle_extend_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `oracle_extend_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, callerId: String, oracleTtl: Object, fee?: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+oraclePostQuery"></a>

### *@aeternity/aepp-sdk/es/tx.oraclePostQuery(options) ⇒ `String`*
Create a `oracle_post_query_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `oracle_post_query_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, responseTtl: Object, query: String, queryTtl: Object, queryFee: String|Number, senderId: String, fee?: Number, ttl: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+oracleRespondTx"></a>

### *@aeternity/aepp-sdk/es/tx.oracleRespondTx(options) ⇒ `String`*
Create a `oracle_respond_tx` transaction

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `String` - `oracle_respond_tx` transaction  
**Category**: async  
**rtype**: `({ oracleId: String, callerId: String, responseTtl: Object, queryId: String, response: String, fee?: Number, ttl?: Number, nonce?: Number}) => tx: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | The object to extract properties from |

<a id="module_@aeternity/aepp-sdk/es/tx+getAccountNonce"></a>

### *@aeternity/aepp-sdk/es/tx.getAccountNonce(address) ⇒ `Number`*
Get Account Nonce

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/tx`](#module_@aeternity/aepp-sdk/es/tx)  
**Returns**: `Number` - Result  
**Category**: async  
**rtype**: `(address) => result: Number`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Account public key |

