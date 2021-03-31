## contract
 
<a id="module_@aeternity/aepp-sdk/es/contract/aci"></a>

### contract/aci
**Module Path:** @aeternity/aepp-sdk/es/contract/aci 

ContractACI module

**Example**  
```js
import ContractACI from '@aeternity/aepp-sdk/es/contract/aci'
```


<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.compile"></a>

#### instance.compile ⇒ `ContractInstance` 
**Type Sig:** instance.compile ⇒ `ContractInstance` 

#### 

**Type Sig:** instance.compile ⇒ `ContractInstance` 

Compile contract

**Kind**: Exported member  
**Returns**: `ContractInstance` - Contract ACI object with predefined js methods for contract usage  
**rtype**: `() => ContractInstance: Object`
<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.deploy"></a>

#### instance.deploy ⇒ `ContractInstance` 
**Type Sig:** instance.deploy ⇒ `ContractInstance` 

#### 

**Type Sig:** instance.deploy ⇒ `ContractInstance` 

Deploys a contract

**Kind**: Exported member  
**Returns**: `ContractInstance` - Contract ACI object with predefined js methods for contract usage  
**rtype**: `(init: Array, options: Object = { skipArgsConvert: false, amount: "0" }) => ContractInstance: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| init | `Array` |  | Contract init function arguments array |
| [options] | `Object` | <code>{}</code> | Options object |
| [options.skipArgsConvert] | `Boolean` | <code>false</code> | Skip Validation and Transforming arguments before prepare call-data |
| [options.amount] | `String` | <code>&quot;0&quot;</code> | The amount of aettos you want to send along with the deployment transaction to be stored in the contract |

**Example**  
```js
//JS

const options = {amount: "1337"}

const contractInstance = await SDKInstance.getContractInstance(CONTRACT_SOURCE, { contractAddress: ct_... }) // contractAddress optional, only if interacting with existing contract

const deploymentTransaction = await contractInstance.deploy([params], options)
```
<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.call"></a>

#### instance.call ⇒ `Object` 
**Type Sig:** instance.call ⇒ `Object` 

#### 

**Type Sig:** instance.call ⇒ `Object` 

Call contract function

**Kind**: Exported member  
**Returns**: `Object` - CallResult  
**rtype**: `(init: Array, options: Object = { skipArgsConvert: false, skipTransformDecoded: false, callStatic: false }) => CallResult: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fn | `String` |  | Function name |
| params | `Array` |  | Array of function arguments |
| [options] | `Object` | <code>{}</code> | Array of function arguments |
| [options.skipArgsConvert] | `Boolean` | <code>false</code> | Skip Validation and Transforming arguments before prepare call-data |
| [options.skipTransformDecoded] | `Boolean` | <code>false</code> | Skip Transform decoded data to JS type |
| [options.callStatic] | `Boolean` | <code>false</code> | Static function call |

<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.decodeEvents"></a>

#### instance.decodeEvents ⇒ `Object` 
**Type Sig:** instance.decodeEvents ⇒ `Object` 

#### 

**Type Sig:** instance.decodeEvents ⇒ `Object` 

Decode Events

**Kind**: Exported member  
**Returns**: `Object` - DecodedEvents  
**rtype**: `(fn: String, events: Array) => DecodedEvents: Array`

| Param | Type | Description |
| --- | --- | --- |
| fn | `String` | Function name |
| events | `Array` | Array of encoded events(callRes.result.log) |

<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--getContractInstance"></a>

#### getContractInstance

**Type Sig:** getContractInstance(source, [options]) ⇒ `ContractInstance` 

Generate contract ACI object with predefined js methods for contract usage - can be used for creating a reference to already deployed contracts

**Kind**: Exported function  
**Returns**: `ContractInstance` - JS Contract API  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| [options] | `Object` | <code>{}</code> | Options object |
| [options.aci] | `String` |  | Contract ACI |
| [options.contractAddress] | `String` |  | Contract address |
| [options.filesystem] | `Object` |  | Contact source external namespaces map |
| [options.forceCodeCheck] | `Object` | <code>true</code> | Don't check contract code |
| [options.opt] | `Object` |  | Contract options |

**Example**  
```js
const contractIns = await client.getContractInstance(sourceCode)
await contractIns.deploy([321]) or await contractIns.methods.init(321)
const callResult = await contractIns.call('setState', [123]) or await contractIns.methods.setState.send(123, options)
const staticCallResult = await contractIns.call('setState', [123], { callStatic: true }) or await contractIns.methods.setState.get(123, options)
Also you can call contract like: await contractIns.methods.setState(123, options)
Then sdk decide to make on-chain or static call(dry-run API) transaction based on function is stateful or not
```
<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--exports.ContractACI"></a>

#### ContractACI

**Type Sig:** ContractACI() ⇒ `Object` 

Contract ACI Stamp

**Kind**: Exported function  
**Returns**: `Object` - Contract compiler instance  
**rtype**: `Stamp`
**Example**  
```js
ContractACI()
```
,
<a id="module_@aeternity/aepp-sdk/es/contract/compiler"></a>

### contract/compiler
**Module Path:** @aeternity/aepp-sdk/es/contract/compiler 

ContractCompilerAPI module

This is the complement to [@aeternity/aepp-sdk/es/contract](#module_@aeternity/aepp-sdk/es/contract).

**Example**  
```js
import ContractCompilerAPI from '@aeternity/aepp-sdk/es/contract/compiler'
```
<a id="exp_module_@aeternity/aepp-sdk/es/contract/compiler--ContractCompilerAPI"></a>

#### ContractCompilerAPI

**Type Sig:** ContractCompilerAPI([options]) ⇒ `Object` 

Contract Compiler Stamp

This stamp include api call's related to contract compiler functionality.

**Kind**: Exported function  
**Returns**: `Object` - Contract compiler instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.compilerUrl] | `String` |  | compilerUrl - Url for compiler API |

**Example**  
```js
ContractCompilerAPI({ compilerUrl: 'COMPILER_URL' })
```
,
<a id="module_@aeternity/aepp-sdk/es/contract/ga"></a>

#### contract/ga
**Module Path:** @aeternity/aepp-sdk/es/contract/ga 

Generalize Account module - routines to use generalize account

**Example**  
```js
import GeneralizeAccount from '@aeternity/aepp-sdk/es/contract/ga' (Using tree-shaking)
```
**Example**  
```js
import { GeneralizeAccount } from '@aeternity/aepp-sdk' (Using bundle)
```


<a id="exp_module_@aeternity/aepp-sdk/es/contract/ga--exports.GeneralizeAccount"></a>

##### GeneralizeAccount

**Type Sig:** GeneralizeAccount([options]) ⇒ `Object` 

GeneralizeAccount Stamp

Provide Generalize Account implementation
[@aeternity/aepp-sdk/es/contract/ga](#module_@aeternity/aepp-sdk/es/contract/ga) clients.

**Kind**: Exported function  
**Returns**: `Object` - GeneralizeAccount instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

**Example**  
```js
const authContract = ``
await client.createGeneralizeAccount(authFnName, authContract, [...authFnArguments]
// Make spend using GA
const callData = 'cb_...' // encoded call data for auth contract
await client.spend(10000, receiverPub, { authData: { callData } })
// or
await client.spend(10000, receiverPub, { authData: { source: authContract, args: [...authContractArgs] } }) // sdk will prepare callData itself
```
<a id="exp_module_@aeternity/aepp-sdk/es/contract/ga--createGeneralizeAccount"></a>

##### createGeneralizeAccount

**Type Sig:** createGeneralizeAccount(authFnName, source, args, options) ⇒ `Promise.&lt;Readonly.&lt;{result: \*, owner: \*, createdAt: Date, address, rawTx: \*, transaction: \*}&gt;&gt;` 

Convert current account to GA account

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| authFnName | `String` | Authorization function name |
| source | `String` | Auth contract source code |
| args | `Array` | init arguments |
| options | `Object` | Options |

<a id="exp_module_@aeternity/aepp-sdk/es/contract/ga--createMetaTx"></a>

##### createMetaTx

**Type Sig:** createMetaTx(rawTransaction, authData, authFnName, options) ⇒ `String` 

Create a metaTx transaction

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| rawTransaction | `String` | Inner transaction |
| authData | `Object` | Object with gaMeta params |
| authFnName | `String` | Authorization function name |
| options | `Object` | Options |

,
,
