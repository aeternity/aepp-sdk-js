<a id="module_@aeternity/aepp-sdk/es/contract/aci"></a>

### @aeternity/aepp-sdk/es/contract/aci
ContractACI module

**Example**  
```js
import ContractACI from '@aeternity/aepp-sdk/es/contract/aci'
```

* [@aeternity/aepp-sdk/es/contract/aci](#module_@aeternity/aepp-sdk/es/contract/aci)
    * [instance.compile](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.compile) ⇒ `ContractInstance` ⏏
    * [instance.deploy](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.deploy) ⇒ `ContractInstance` ⏏
    * [instance.call](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.call) ⇒ `Object` ⏏
    * [instance.decodeEvents](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.decodeEvents) ⇒ `Object` ⏏
    * [getContractInstance(source, [options])](#exp_module_@aeternity/aepp-sdk/es/contract/aci--getContractInstance) ⇒ `ContractInstance` ⏏
    * [exports.ContractACI()](#exp_module_@aeternity/aepp-sdk/es/contract/aci--exports.ContractACI) ⇒ `Object` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.compile"></a>

#### instance.compile ⇒ `ContractInstance` ⏏
Compile contract

**Kind**: Exported member  
**Returns**: `ContractInstance` - Contract ACI object with predefined js methods for contract usage  
**rtype**: `() => ContractInstance: Object`
<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.deploy"></a>

#### instance.deploy ⇒ `ContractInstance` ⏏
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

#### instance.call ⇒ `Object` ⏏
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

#### instance.decodeEvents ⇒ `Object` ⏏
Decode Events

**Kind**: Exported member  
**Returns**: `Object` - DecodedEvents  
**rtype**: `(fn: String, events: Array) => DecodedEvents: Array`

| Param | Type | Description |
| --- | --- | --- |
| fn | `String` | Function name |
| events | `Array` | Array of encoded events(callRes.result.log) |

<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--getContractInstance"></a>

#### getContractInstance(source, [options]) ⇒ `ContractInstance` ⏏
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

#### exports.ContractACI() ⇒ `Object` ⏏
Contract ACI Stamp

**Kind**: Exported function  
**Returns**: `Object` - Contract compiler instance  
**rtype**: `Stamp`
**Example**  
```js
ContractACI()
```
