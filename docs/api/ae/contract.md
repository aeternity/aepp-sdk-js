<a id="module_@aeternity/aepp-sdk/es/ae/contract"></a>

### @aeternity/aepp-sdk/es/ae/contract
Contract module - routines to interact with the æternity contract

High level documentation of the contracts are available at
https://github.com/aeternity/protocol/tree/master/contracts and

**Example**  
```js
import { Contract } from '@aeternity/aepp-sdk'
```

* [@aeternity/aepp-sdk/es/ae/contract](#module_@aeternity/aepp-sdk/es/ae/contract)
    * [exports.ContractAPI([options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--exports.ContractAPI) ⇒ `Object` ⏏
    * _async_
        * [contractEncodeCall(source, name, args, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractEncodeCall) ⇒ `Promise.&lt;String&gt;` ⏏
        * [contractDecodeData(source, fn, callValue, callResult, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDecodeData) ⇒ `Promise.&lt;String&gt;` ⏏
        * [contractCallStatic(source, address, name, args, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCallStatic) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [contractCall(source, address, name, argsOrCallData, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCall) ⏏
        * [contractDeploy(code, source, initState, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDeploy) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [contractCompile(source, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCompile) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [delegateSignatureCommon(ids, [opt], [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateSignatureCommon) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateNamePreclaimSignature(contractId, [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNamePreclaimSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateNameClaimSignature(name, contractId, [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameClaimSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateNameTransferSignature(contractId, name, [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameTransferSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateNameRevokeSignature(contractId, name, [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameRevokeSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateOracleRegisterSignature(contractId, [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRegisterSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateOracleExtendSignature(contractId, [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleExtendSignature) ⇒ `Promise.&lt;String&gt;` ⏏
        * [delegateOracleRespondSignature(queryId, contractId, [opt])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRespondSignature) ⇒ `Promise.&lt;String&gt;` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--exports.ContractAPI"></a>

#### exports.ContractAPI([options]) ⇒ `Object` ⏏
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
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractEncodeCall"></a>

#### contractEncodeCall(source, name, args, [options]) ⇒ `Promise.&lt;String&gt;` ⏏
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

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractDecodeData"></a>

#### contractDecodeData(source, fn, callValue, callResult, [options]) ⇒ `Promise.&lt;String&gt;` ⏏
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

#### contractCallStatic(source, address, name, args, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Static contract call(using dry-run)

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| address | `String` | Contract address |
| name | `String` | Name of function to call |
| args | `Array` \| `String` | Argument's or callData for call/deploy transaction |
| [options] | `Object` |  |
| [options.top] | `Number` \| `String` | Block height or hash on which you want to call contract |
| [options.bytecode] | `String` | Block hash on which you want to call contract |
| [options.filesystem] | `Object` | Contract external namespaces map |

**Example**  
```js
const callResult = await client.contractCallStatic(source, address, fnName, args)
{
  result: TX_DATA,
  decode: (type) => Decode call result
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractCall"></a>

#### contractCall(source, address, name, argsOrCallData, [options]) ⏏
Call contract function

**Kind**: Exported function  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| address | `String` |  | Contract address or AENS name |
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

#### contractDeploy(code, source, initState, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
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

#### contractCompile(source, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Compile contract source code

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract sourece code |
| [options] | `Object` | <code>{}</code> | Transaction options (fee, ttl, gas, amount, deposit) |
| [options.filesystem] | `Object` | <code>{}</code> | Contract external namespaces map* @return {Promise<Object>} Result object |

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

#### delegateSignatureCommon(ids, [opt], [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Utility method to create a delegate signature for a contract

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature in hex representation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ids | `Array.&lt;String&gt;` |  | The list of id's to prepend |
| [opt] | `Object` | <code>{}</code> | options |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNamePreclaimSignature"></a>

#### delegateNamePreclaimSignature(contractId, [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a name pre-claim to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameClaimSignature"></a>

#### delegateNameClaimSignature(name, contractId, [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a name claim to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | The name being claimed |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameTransferSignature"></a>

#### delegateNameTransferSignature(contractId, name, [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a name transfer to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contractId | `String` |  | Contract Id |
| name | `String` |  | The name being transferred |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameRevokeSignature"></a>

#### delegateNameRevokeSignature(contractId, name, [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a name revoke to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contractId | `String` |  | Contract Id |
| name | `String` |  | The name being revoked |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRegisterSignature"></a>

#### delegateOracleRegisterSignature(contractId, [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a Oracle register to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleExtendSignature"></a>

#### delegateOracleExtendSignature(contractId, [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a Oracle extend to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRespondSignature"></a>

#### delegateOracleRespondSignature(queryId, contractId, [opt]) ⇒ `Promise.&lt;String&gt;` ⏏
Helper to generate a signature to delegate a Oracle respond to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| queryId | `String` |  | Oracle Query Id |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

