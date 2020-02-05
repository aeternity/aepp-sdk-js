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
    * [exports.ContractAPI([options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--exports.ContractAPI) ⇒ `Object` ⏏
    * _async_
        * [handleCallError(result)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--handleCallError) ⇒ `Promise.&lt;void&gt;` ⏏
        * [contractEncodeCall(source, name, args, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractEncodeCall) ⇒ `Promise.&lt;String&gt;` ⏏
        * [contractDecodeData(source, fn, callValue, callResult, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDecodeData) ⇒ `Promise.&lt;String&gt;` ⏏
        * [contractCallStatic(source, address, name, args, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCallStatic) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [contractCall(source, address, name, argsOrCallData, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCall) ⏏
        * [contractDeploy(code, source, initState, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDeploy) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [contractCompile(source, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCompile) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [delegateSignatureCommon(ids, [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateSignatureCommon) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateNamePreclaimSignature(contractId)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNamePreclaimSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateNameClaimSignature(name, contractId)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameClaimSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateNameTransferSignature(contractId, name)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameTransferSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateNameRevokeSignature(contractId, name)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameRevokeSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateOracleRegisterSignature(contractId)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRegisterSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateOracleExtendSignature(contractId)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleExtendSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateOracleRespondSignature(queryId, contractId)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRespondSignature) ⇒ `Promise.&lt;String&gt;` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--exports.ContractAPI"></a>

### exports.ContractAPI([options]) ⇒ `Object` ⏏
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

### contractEncodeCall(source, name, args, [options]) ⇒ `Promise.&lt;String&gt;` ⏏
Encode call data for contract call

**Kind**: Exported function  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| name | `String` |  | Name of function to call |
| args | `Array` |  | Argument's for call |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` | <code>{}</code> | Contract external namespaces map |
| [options.backend] | `Object` | <code>&#x27;fate&#x27;</code> | Compiler backend |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDecodeData"></a>

### contractDecodeData(source, fn, callValue, callResult, [options]) ⇒ `Promise.&lt;String&gt;` ⏏
Decode contract call result data

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Result object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | source code |
| fn | `String` |  | function name |
| callValue | `String` |  | result call data |
| callResult | `String` |  | result status |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` | <code>{}</code> | Contract external namespaces map |

**Example**  
```js
const decodedData = await client.contractDecodeData(SourceCode ,'functionName', 'cb_asdasdasd...', 'ok|revert')lt
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCallStatic"></a>

### contractCallStatic(source, address, name, args, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Static contract call(using dry-run)

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| address | `String` |  | Contract address |
| name | `String` |  | Name of function to call |
| args | `Array` \| `String` |  | Argument's or callData for call/deploy transaction |
| [options] | `Object` | <code>{}</code> | Options |
| [options.top] | `String` |  | Block hash on which you want to call contract |
| [options.bytecode] | `String` |  | Block hash on which you want to call contract |
| [options.options] | `Object` |  | Transaction options (fee, ttl, gas, amount, deposit) |
| [options.options.filesystem] | `Object` |  | Contract external namespaces map |

**Example**  
```js
const callResult = await client.contractCallStatic(source, address, fnName, args = [], { top, options = {} })
{
  result: TX_DATA,
  decode: (type) => Decode call result
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCall"></a>

### contractCall(source, address, name, argsOrCallData, [options]) ⏏
Call contract function

**Kind**: Exported function  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| address | `String` |  | Contract address |
| name | `String` |  | Name of function to call |
| argsOrCallData | `Array` \| `String` |  | Argument's array or callData for call function |
| [options] | `Object` | <code>{}</code> | Transaction options (fee, ttl, gas, amount, deposit) |
| [options.filesystem] | `Object` | <code>{}</code> | Contract external namespaces map* @return {Promise<Object>} Result object |

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

### contractDeploy(code, source, initState, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Deploy contract to the node

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | `String` |  | Compiled contract |
| source | `String` |  | Contract source code |
| initState | `Array` \| `String` |  | Arguments of contract constructor(init) function. Can be array of arguments or callData string |
| [options] | `Object` | <code>{}</code> | Transaction options (fee, ttl, gas, amount, deposit) |
| [options.filesystem] | `Object` | <code>{}</code> | Contract external namespaces map* @return {Promise<Object>} Result object |

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

### contractCompile(source, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Compile contract source code

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract sourece code |
| [options] | `Object` | <code>{}</code> | Transaction options (fee, ttl, gas, amount, deposit) |
| [options.filesystem] | `Object` | <code>{}</code> | Contract external namespaces map* @return {Promise<Object>} Result object |
| [options.backend] | `Object` | <code>&#x27;aevm&#x27;</code> | Contract backend version (aevm|fate) |

**Example**  
```js
const compiled = await client.contractCompile(SOURCE_CODE)
{
  bytecode: CONTRACT_BYTE_CODE,
  deploy: (init = [], options = {}) => Deploy Contract,
  encodeCall: (fnName, args = []) => Prepare callData
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateSignatureCommon"></a>

### delegateSignatureCommon(ids, [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Utility method to create a delegate signature for a contract

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature in hex representation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ids | `Array.&lt;String&gt;` |  | The list of id's to prepend |
| [opt] | `Object` | <code>{}</code> | options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNamePreclaimSignature"></a>

### delegateNamePreclaimSignature(contractId) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a name pre-claim to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| contractId | `String` | Contract Id |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameClaimSignature"></a>

### delegateNameClaimSignature(name, contractId) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a name claim to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | The name being claimed |
| contractId | `String` | Contract Id |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameTransferSignature"></a>

### delegateNameTransferSignature(contractId, name) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a name transfer to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| contractId | `String` | Contract Id |
| name | `String` | The name being transferred |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameRevokeSignature"></a>

### delegateNameRevokeSignature(contractId, name) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a name revoke to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| contractId | `String` | Contract Id |
| name | `String` | The name being revoked |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRegisterSignature"></a>

### delegateOracleRegisterSignature(contractId) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a Oracle register to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| contractId | `String` | Contract Id |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleExtendSignature"></a>

### delegateOracleExtendSignature(contractId) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a Oracle extend to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| contractId | `String` | Contract Id |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRespondSignature"></a>

### delegateOracleRespondSignature(queryId, contractId) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a Oracle respond to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| queryId | `String` | Oracle Query Id |
| contractId | `String` | Contract Id |

