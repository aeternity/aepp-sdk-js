## ae
 
<a id="module_@aeternity/aepp-sdk/es/ae/aens"></a>

### ae/aens
**Module Path:** @aeternity/aepp-sdk/es/ae/aens 

Aens module - routines to interact with the æternity naming system

The high-level description of the naming system is
https://github.com/aeternity/protocol/blob/master/AENS.md in the protocol
repository.

**Example**  
```js
import Aens from '@aeternity/aepp-sdk/es/ae/aens'
```

    
        

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--Aens"></a>

#### Aens

**Type Sig:** Aens([options]) ⇒ `Object` 

Aens Stamp

Aens provides name-system related methods atop
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Aens instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--revoke"></a>

#### revoke
**Type Sig:** revoke(name, [options]) ⇒ `Promise.&lt;Object&gt;` 
Revoke a name

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - Transaction result  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | Name hash |
| [options] | `Object` | <code>{}</code> | options |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |

**Example**  
```js
const name = 'test.chain'
const nameObject = await sdkInstance.aensQuery(name)

await sdkInstance.aensRevoke(name, { fee, ttl , nonce })
// or
await nameObject.revoke({ fee, ttl, nonce })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--update"></a>

#### update
**Type Sig:** update(name, pointers, [options]) ⇒ `Promise.&lt;Object&gt;` 
Update a name

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Category**: async  
**Throws**:

- Invalid pointer array error


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | AENS name |
| pointers | `Array.&lt;String&gt;` |  | Array of name pointers. Can be oracle|account|contract|channel public key |
| [options] | `Object` | <code>{}</code> |  |
| [options.extendPointers] | `Boolean` | <code>false</code> | extendPointers Get the pointers from the node and merge with provided one. Pointers with the same type will be overwrited |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |
| [options.nameTtl] | `Number` \| `String` \| `BigNumber` | <code>50000</code> | nameTtl Name ttl represented in number of blocks (Max value is 50000 blocks) |
| [options.clientTtl] | `Number` \| `String` \| `BigNumber` | <code>84600</code> | clientTtl a suggestion as to how long any clients should cache this information |

**Example**  
```js
const name = 'test.chain'
const pointersArray = ['ak_asd23dasdas...,' 'ct_asdf34fasdasd...']
const nameObject = await sdkInstance.aensQuery(name)

await sdkInstance.aensUpdate(name, pointersArray, { nameTtl, ttl, fee, nonce, clientTtl })
// or
await nameObject.update(pointersArray, { nameTtl, ttl, fee, nonce, clientTtl })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--transfer"></a>

#### transfer
**Type Sig:** transfer(name, account, [options]) ⇒ `Promise.&lt;Object&gt;` 
Transfer a domain to another account

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - Transaction result  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | AENS name |
| account | `String` |  | Recipient account publick key |
| [options] | `Object` | <code>{}</code> |  |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |

**Example**  
```js
const name = 'test.chain'
const recipientPub = 'ak_asd23dasdas...'
const nameObject = await sdkInstance.aensQuery(name)

await sdkInstance.aensTransfer(name, recipientPub, { ttl, fee, nonce })
// or
await nameObject.transfer(recipientPub, { ttl, fee, nonce })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--query"></a>

#### query
**Type Sig:** query(name, opt) ⇒ `Promise.&lt;Object&gt;` 
Query the AENS name info from the node
and return the object with info and predefined functions for manipulating name

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| name | `String` |  |
| opt | `Object` | Options |

**Example**  
```js
const nameObject = sdkInstance.aensQuery('test.chain')
console.log(nameObject)
{
 id, // name hash
 pointers, // array of pointers
 update, // Update name function
 extendTtl, // Extend Ttl name function
 transfer, // Transfer name function
 revoke // Revoke name function
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--claim"></a>

#### claim
**Type Sig:** claim(name, salt, [options]) ⇒ `Promise.&lt;Object&gt;` 
Claim a previously preclaimed registration. This can only be done after the
preclaim step

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - the result of the claim  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  |  |
| salt | `Number` |  | Salt from pre-claim, or 0 if it's a bid |
| [options] | `Object` | <code>{}</code> | options |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |
| [options.nameFee] | `Number` \| `String` |  | Name Fee (By default calculated by sdk) |
| [options.vsn] | `Number` \| `String` | <code>2</code> | Transaction vsn from Lima is 2 |

**Example**  
```js
const name = 'test.chain'
const salt = preclaimResult.salt // salt from pre-claim transaction

await sdkInstance.aensClaim(name, salt, { ttl, fee, nonce, nameFee })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--preclaim"></a>

#### preclaim
**Type Sig:** preclaim(name, [options]) ⇒ `Promise.&lt;Object&gt;` 
Preclaim a name. Sends a hash of the name and a random salt to the node

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  |  |
| [options] | `Object` | <code>{}</code> |  |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |

**Example**  
```js
const name = 'test.chain'
const salt = preclaimResult.salt // salt from pre-claim transaction

await sdkInstance.aensPreclaim(name, { ttl, fee, nonce })
{
  ...transactionResult,
  claim, // Claim function (options={}) => claimTransactionResult
  salt,
  commitmentId
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--bid"></a>

#### bid
**Type Sig:** bid(name, nameFee, [options]) ⇒ `Promise.&lt;Object&gt;` 
Bid to name auction

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - Transaction result  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | Domain name |
| nameFee | `String` \| `Number` |  | Name fee (bid fee) |
| [options] | `Object` | <code>{}</code> |  |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |

**Example**  
```js
const name = 'test.chain'
const bidFee = computeBidFee(name, startFee, incrementPercentage)

await sdkInstance.aensBid(name, 213109412839123, { ttl, fee, nonce })
```
,
<a id="module_@aeternity/aepp-sdk/es/ae/aepp"></a>

### ae/aepp
**Module Path:** @aeternity/aepp-sdk/es/ae/aepp 

Aepp module

**Example**  
```js
import Ae from '@aeternity/aepp-sdk/es/ae/aepp'
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aepp--exports.Aepp"></a>

#### Aepp

**Type Sig:** Aepp([options]) ⇒ `Object` 

Aepp Stamp

Aepp provides Ae base functionality with Contract and Aens.
This stamp can be used only with Wallet, all Aepp method's going through RPC to Wallet.
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Aepp instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

,
<a id="module_@aeternity/aepp-sdk/es/ae/contract"></a>

### ae/contract
**Module Path:** @aeternity/aepp-sdk/es/ae/contract 

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

    

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--exports.ContractAPI"></a>

#### ContractAPI

**Type Sig:** ContractAPI([options]) ⇒ `Object` 

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

#### handleCallError

**Type Sig:** handleCallError(result, tx) ⇒ `Promise.&lt;void&gt;` 

Handle contract call error

**Kind**: Exported function  
**Category**: async  
**Throws**:

- Error Decoded error


| Param | Type | Description |
| --- | --- | --- |
| result | `Object` | call result object |
| tx | `Object` | Unpacked transaction |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--contractEncodeCall"></a>

#### contractEncodeCall

**Type Sig:** contractEncodeCall(source, name, args, [options]) ⇒ `Promise.&lt;String&gt;` 

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

#### contractDecodeData

**Type Sig:** contractDecodeData(source, fn, callValue, callResult, [options]) ⇒ `Promise.&lt;String&gt;` 

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

#### contractCallStatic

**Type Sig:** contractCallStatic(source, address, name, args, [options]) ⇒ `Promise.&lt;Object&gt;` 

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

#### contractCall

**Type Sig:** contractCall(source, address, name, argsOrCallData, [options]) 

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

#### contractDeploy

**Type Sig:** contractDeploy(code, source, initState, [options]) ⇒ `Promise.&lt;Object&gt;` 

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

#### contractCompile

**Type Sig:** contractCompile(source, [options]) ⇒ `Promise.&lt;Object&gt;` 

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

#### delegateSignatureCommon

**Type Sig:** delegateSignatureCommon(ids, [opt], [opt]) ⇒ `Promise.&lt;String&gt;` 

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

#### delegateNamePreclaimSignature

**Type Sig:** delegateNamePreclaimSignature(contractId, [opt]) ⇒ `Promise.&lt;String&gt;` 

Helper to generate a signature to delegate a name pre-claim to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateNameClaimSignature"></a>

#### delegateNameClaimSignature

**Type Sig:** delegateNameClaimSignature(name, contractId, [opt]) ⇒ `Promise.&lt;String&gt;` 

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

#### delegateNameTransferSignature

**Type Sig:** delegateNameTransferSignature(contractId, name, [opt]) ⇒ `Promise.&lt;String&gt;` 

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

#### delegateNameRevokeSignature

**Type Sig:** delegateNameRevokeSignature(contractId, name, [opt]) ⇒ `Promise.&lt;String&gt;` 

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

#### delegateOracleRegisterSignature

**Type Sig:** delegateOracleRegisterSignature(contractId, [opt]) ⇒ `Promise.&lt;String&gt;` 

Helper to generate a signature to delegate a Oracle register to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleExtendSignature"></a>

#### delegateOracleExtendSignature

**Type Sig:** delegateOracleExtendSignature(contractId, [opt]) ⇒ `Promise.&lt;String&gt;` 

Helper to generate a signature to delegate a Oracle extend to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--delegateOracleRespondSignature"></a>

#### delegateOracleRespondSignature

**Type Sig:** delegateOracleRespondSignature(queryId, contractId, [opt]) ⇒ `Promise.&lt;String&gt;` 

Helper to generate a signature to delegate a Oracle respond to a contract.

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Signature for delegation  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| queryId | `String` |  | Oracle Query Id |
| contractId | `String` |  | Contract Id |
| [opt] | `Object` | <code>{}</code> | opt Options |

,
<a id="module_@aeternity/aepp-sdk/es/ae/oracle"></a>

### ae/oracle
**Module Path:** @aeternity/aepp-sdk/es/ae/oracle 

Oracle module - routines to interact with the æternity oracle system

The high-level description of the oracle system is
https://github.com/aeternity/protocol/blob/master/ORACLE.md in the protocol
repository.

**Example**  
```js
import Oracle from '@aeternity/aepp-sdk/es/ae/oracle'
```

    
        

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--Oracle"></a>

#### Oracle

**Type Sig:** Oracle([options]) ⇒ `Object` 

Oracle Stamp

Oracle provides oracle-system related methods atop
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Oracle instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--getOracleObject"></a>

#### getOracleObject
**Type Sig:** getOracleObject(oracleId) ⇒ `Promise.&lt;Object&gt;` 
Constructor for Oracle Object (helper object for using Oracle)

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Oracle object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--pollForQueries"></a>

#### pollForQueries
**Type Sig:** pollForQueries(oracleId, onQuery, [options]) ⇒ `function` 
Poll for oracle queries

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `function` - stopPolling - Stop polling function  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |
| onQuery | `function` | OnQuery callback |
| [options] | `Object` | Options object |
| [options.interval] | `Number` | Poll interval(default: 5000) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--getQueryObject"></a>

#### getQueryObject
**Type Sig:** getQueryObject(oracleId, queryId) ⇒ `Promise.&lt;Object&gt;` 
Constructor for OracleQuery Object (helper object for using OracleQuery)

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - OracleQuery object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |
| queryId | `String` | Oracle Query id |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--exports.pollForQueryResponse"></a>

#### pollForQueryResponse
**Type Sig:** pollForQueryResponse(oracleId, queryId, [options]) ⇒ `Promise.&lt;Object&gt;` 
Poll for oracle query response

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - OracleQuery object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |
| queryId | `String` | Oracle Query id |
| [options] | `Object` | Options object |
| [options.attempts] | `Object` | Poll attempt's(default: 20) |
| [options.interval] | `Object` | Poll interval(default: 5000) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--registerOracle"></a>

#### registerOracle
**Type Sig:** registerOracle(queryFormat, responseFormat, [options]) ⇒ `Promise.&lt;Object&gt;` 
Register oracle

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Oracle object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| queryFormat | `String` |  | Format of query |
| responseFormat | `String` |  | Format of query response |
| [options] | `Object` | <code>{}</code> | Options |
| [options.queryFee] | `String` \| `Number` |  | queryFee Oracle query Fee |
| [options.oracleTtl] | `Object` |  | oracleTtl OracleTtl object {type: 'delta|block', value: 'number'} |
| [options.abiVersion] | `Number` |  | abiVersion Always 0 (do not use virtual machine) |
| [options.fee] | `Number` \| `String` |  | fee Transaction fee |
| [options.ttl] | `Number` \| `String` |  | Transaction time to leave |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--postQueryToOracle"></a>

#### postQueryToOracle
**Type Sig:** postQueryToOracle(oracleId, query, [options]) ⇒ `Promise.&lt;Object&gt;` 
Post query to oracle

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Query object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| oracleId | `String` |  | Oracle public key |
| query | `String` |  | Oracle query object |
| [options] | `Object` | <code>{}</code> |  |
| [options.queryTtl] | `String` \| `Number` |  | queryTtl Oracle query time to leave |
| [options.responseTtl] | `String` \| `Number` |  | queryFee Oracle query response time to leave |
| [options.queryFee] | `String` \| `Number` |  | queryFee Oracle query fee |
| [options.fee] | `Number` |  | fee Transaction fee |
| [options.ttl] | `Number` |  | Transaction time to leave |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--extendOracleTtl"></a>

#### extendOracleTtl
**Type Sig:** extendOracleTtl(oracleId, oracleTtl, [options]) ⇒ `Promise.&lt;Object&gt;` 
Extend oracle ttl

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Oracle object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| oracleId | `String` |  | Oracle public key |
| oracleTtl | `String` |  | Oracle time to leave for extend |
| [options] | `Object` | <code>{}</code> |  |
| [options.fee] | `Number` |  | fee Transaction fee |
| [options.ttl] | `Number` |  | Transaction time to leave |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--respondToQuery"></a>

#### respondToQuery
**Type Sig:** respondToQuery(oracleId, queryId, response, [options]) ⇒ `Promise.&lt;Object&gt;` 
Extend oracle ttl

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Oracle object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| oracleId | `String` |  | Oracle public key |
| queryId | `String` |  | Oracle query id |
| response | `String` |  | Oracle query response |
| [options] | `Object` | <code>{}</code> |  |
| [options.responseTtl] | `Number` |  | responseTtl Query response time to leave |
| [options.fee] | `Number` |  | Transaction fee |
| [options.ttl] | `Number` |  | Transaction time to leave |

,
<a id="module_@aeternity/aepp-sdk/es/ae/universal"></a>

### ae/universal
**Module Path:** @aeternity/aepp-sdk/es/ae/universal 

Universal module

**Example**  
```js
import Ae from '@aeternity/aepp-sdk/es/ae/universal'
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/universal--exports.Universal"></a>

#### Universal

**Type Sig:** Universal([options]) ⇒ `Object` 

Universal Stamp

Universal provides Ae base functionality with Contract and Aens
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Universal instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

,
<a id="module_@aeternity/aepp-sdk/es/ae/wallet"></a>

### ae/wallet
**Module Path:** @aeternity/aepp-sdk/es/ae/wallet 

Wallet module

**Example**  
```js
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet'
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/wallet--exports.Wallet"></a>

#### Wallet

**Type Sig:** Wallet([options]) ⇒ `Object` 

Wallet Stamp

**Kind**: Exported function  
**Returns**: `Object` - Wallet instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| options.url | `String` |  | Node instance to connect to |
| [options.accounts] | `Array.&lt;Account&gt;` |  | Accounts to initialize with |
| [options.account] | `String` |  | Public key of account to preselect |
| [options.onTx] | `function` |  | Tx method protector function |
| [options.onChain] | `function` |  | Chain method protector function |
| [options.onAccount] | `function` |  | Account method protector function |
| [options.onContract] | `function` |  | Contract method protector function |

**Example**  
```js
Wallet({
  url: 'https://testnet.aeternity.io/',
  accounts: [MemoryAccount({keypair})],
  address: keypair.publicKey,
  onTx: confirm,
  onChain: confirm,
  onAccount: confirm
  onContract: confirm
})
```
,
