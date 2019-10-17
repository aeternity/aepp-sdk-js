<a id="module_@aeternity/aepp-sdk/es/tx/tx"></a>

## @aeternity/aepp-sdk/es/tx/tx
Transaction module

**Example**  
```js
import Transaction from '@aeternity/aepp-sdk/es/tx/tx'
```

* [@aeternity/aepp-sdk/es/tx/tx](#module_@aeternity/aepp-sdk/es/tx/tx)
    * [Transaction([options])](#exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction) ⇒ `Object` ⏏
        * [~getVmVersion(txType, vmAbi)](#module_@aeternity/aepp-sdk/es/tx/tx--Transaction..getVmVersion) ⇒ `object`
        * [~calculateTtl(ttl, relative)](#module_@aeternity/aepp-sdk/es/tx/tx--Transaction..calculateTtl) ⇒ `number`
        * [~getAccountNonce(accountId, nonce)](#module_@aeternity/aepp-sdk/es/tx/tx--Transaction..getAccountNonce) ⇒ `number`
        * [~prepareTxParams(txType, params)](#module_@aeternity/aepp-sdk/es/tx/tx--Transaction..prepareTxParams) ⇒ `Object`

<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction"></a>

### Transaction([options]) ⇒ `Object` ⏏
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
Transaction({url: 'https://sdk-testnet.aepps.com/'})
```
<a id="module_@aeternity/aepp-sdk/es/tx/tx--Transaction..getVmVersion"></a>

#### Transaction~getVmVersion(txType, vmAbi) ⇒ `object`
Validated vm/abi version or get default based on transaction type and NODE version

**Kind**: inner method of [`Transaction`](#exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction)  
**Returns**: `object` - Object with vm/abi version ({ vmVersion: number, abiVersion: number, backend: string })  

| Param | Type | Description |
| --- | --- | --- |
| txType | `string` | Type of transaction |
| vmAbi | `object` | Object with vm and abi version fields |

<a id="module_@aeternity/aepp-sdk/es/tx/tx--Transaction..calculateTtl"></a>

#### Transaction~calculateTtl(ttl, relative) ⇒ `number`
Compute the absolute ttl by adding the ttl to the current height of the chain

**Kind**: inner method of [`Transaction`](#exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction)  
**Returns**: `number` - Absolute Ttl  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ttl | `number` |  |  |
| relative | `boolean` | <code>true</code> | ttl is absolute or relative(default: true(relative)) |

<a id="module_@aeternity/aepp-sdk/es/tx/tx--Transaction..getAccountNonce"></a>

#### Transaction~getAccountNonce(accountId, nonce) ⇒ `number`
Get the next nonce to be used for a transaction for an account

**Kind**: inner method of [`Transaction`](#exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction)  
**Returns**: `number` - Next Nonce  

| Param | Type |
| --- | --- |
| accountId | `string` | 
| nonce | `number` | 

<a id="module_@aeternity/aepp-sdk/es/tx/tx--Transaction..prepareTxParams"></a>

#### Transaction~prepareTxParams(txType, params) ⇒ `Object`
Calculate fee, get absolute ttl (ttl + height), get account nonce

**Kind**: inner method of [`Transaction`](#exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction)  
**Returns**: `Object` - { ttl, nonce, fee } Object with account nonce, absolute ttl and transaction fee  

| Param | Type | Description |
| --- | --- | --- |
| txType | `String` | Type of transaction |
| params | `Object` | Object which contains all tx data |

