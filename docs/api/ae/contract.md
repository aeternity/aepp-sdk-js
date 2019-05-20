<a id="module_@aeternity/aepp-sdk/es/ae/contract"></a>

## @aeternity/aepp-sdk/es/ae/contract
Contract module - routines to interact with the æternity contract

High level documentation of the contracts are available at
https://github.com/aeternity/protocol/tree/master/contracts and

**Example**  
```js
import Contract from '@aeternity/aepp-sdk/es/ae/contract' (Using tree-shaking)
```
**Example**  
```js
import { Contract } from '@aeternity/aepp-sdk' (Using bundle)
```

* [@aeternity/aepp-sdk/es/ae/contract](#module_@aeternity/aepp-sdk/es/ae/contract)
    * [exports.Contract([options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--exports.Contract) ⇒ `Object` ⏏
    * _async_
        * [handleCallError(result)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--handleCallError) ⇒ `Promise.&lt;void&gt;` ⏏
        * [contractEncodeCall(source, name, args)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractEncodeCall) ⇒ `Promise.&lt;String&gt;` ⏏
        * [contractDecodeData(type, data)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDecodeData) ⇒ `Promise.&lt;String&gt;` ⏏
        * [contractCallStatic(source, address, name, args, options, top, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCallStatic) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [contractCall(source, address, name, args, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCall) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [contractDeploy(code, source, initState, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDeploy) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [contractCompile(source, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCompile) ⇒ `Promise.&lt;Object&gt;` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--exports.Contract"></a>

### exports.Contract([options]) ⇒ `Object` ⏏
Contract Stamp

Provide contract implementation
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Contract instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

**Example**  
```js
import Transaction from '@aeternity/aepp-sdk/es/tx/tx
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory
import ChainNode from '@aeternity/aepp-sdk/es/chain/node
import ContractCompilerAPI from '@aeternity/aepp-sdk/es/contract/compiler
// or using bundle
import {
  Transaction,
  MemoryAccount,
  ChainNode,
  ContractCompilerAPI
} from '@aeternity/aepp-sdk

const ContractWithAE = await Contract
   .compose(Transaction, MemoryAccount, ChainNode) // AE implementation
   .compose(ContractCompilerAPI) // ContractBase implementation
const client = await ContractWithAe({ url, internalUrl, compilerUrl, keypair, ... })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--handleCallError"></a>

### handleCallError(result) ⇒ `Promise.&lt;void&gt;` ⏏
Handle contract call error

**Kind**: Exported function  
**Category**: async  
**Throws**:

- Error Decoded error


| Param | Type | Description |
| --- | --- | --- |
| result | `Object` | call result object |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractEncodeCall"></a>

### contractEncodeCall(source, name, args) ⇒ `Promise.&lt;String&gt;` ⏏
Encode call data for contract call

**Kind**: Exported function  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| name | `String` | Name of function to call |
| args | `Array` | Argument's for call |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDecodeData"></a>

### contractDecodeData(type, data) ⇒ `Promise.&lt;String&gt;` ⏏
Decode contract call result data

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Data type (int, string, list,...) |
| data | `String` | call result data (cb_iwer89fjsdf2j93fjews_(ssdffsdfsdf...) |

**Example**  
```js
const decodedData = await client.contractDecodeData('string' ,'cb_sf;ls43fsdfsdf...')
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCallStatic"></a>

### contractCallStatic(source, address, name, args, options, top, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Static contract call(using dry-run)

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| address | `String` | Contract address |
| name | `String` | Name of function to call |
| args | `Array` | Argument's for call function |
| options | `Object` | [options={}]  Options |
| top | `String` | [options.top] Block hash on which you want to call contract |
| options | `String` | [options.options]  Transaction options (fee, ttl, gas, amount, deposit) |

**Example**  
```js
const callResult = await client.contractCallStatic(source, address, fnName, args = [], { top, options = {} })
{
  result: TX_DATA,
  decode: (type) => Decode call result
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCall"></a>

### contractCall(source, address, name, args, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Call contract function

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| address | `String` | Contract address |
| name | `String` | Name of function to call |
| args | `Array` | Argument's for call function |
| options | `Object` | Transaction options (fee, ttl, gas, amount, deposit) |

**Example**  
```js
const callResult = await client.contractCall(source, address, fnName, args = [], options)
{
  hash: TX_HASH,
  result: TX_DATA,
  decode: (type) => Decode call result
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDeploy"></a>

### contractDeploy(code, source, initState, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Deploy contract to the node

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | Compiled contract |
| source | `String` | Contract source code |
| initState | `Array` | Arguments of contract constructor(init) function |
| options | `Object` | Transaction options (fee, ttl, gas, amount, deposit) |

**Example**  
```js
const deployed = await client.contractDeploy(bytecode, source, init = [], options)
{
  owner: OWNER_PUB_KEY,
  transaction: TX_HASH,
  address: CONTRACT_ADDRESS,
  createdAt: Date,
  result: DEPLOY_TX_DATA,
  call: (fnName, args = [], options) => Call contract function,
  callStatic: (fnName, args = [], options) => Static all contract function
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCompile"></a>

### contractCompile(source, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Compile contract source code

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract sourece code |
| options | `Object` | Transaction options (fee, ttl, gas, amount, deposit) |

**Example**  
```js
const compiled = await client.contractCompile(SOURCE_CODE)
{
  bytecode: CONTRACT_BYTE_CODE,
  deploy: (init = [], options = {}) => Deploy Contract,
  encodeCall: (fnName, args = []) => Prepare callData
}
```
