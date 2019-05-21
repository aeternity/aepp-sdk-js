<a id="module_@aeternity/aepp-sdk/es/contract/aci"></a>

## @aeternity/aepp-sdk/es/contract/aci
ContractACI module

**Example**  
```js
import ContractACI from '@aeternity/aepp-sdk/es/contract/aci'
```

* [@aeternity/aepp-sdk/es/contract/aci](#module_@aeternity/aepp-sdk/es/contract/aci)
    * [instance.compile](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.compile) ⇒ `ContractInstance` ⏏
    * [instance.deploy](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.deploy) ⇒ `ContractInstance` ⏏
    * [instance.call](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.call) ⇒ `Object` ⏏
    * [getContractInstance(source, [options])](#exp_module_@aeternity/aepp-sdk/es/contract/aci--getContractInstance) ⇒ `ContractInstance` ⏏
    * [ContractACI()](#exp_module_@aeternity/aepp-sdk/es/contract/aci--ContractACI) ⇒ `Object` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.compile"></a>

### instance.compile ⇒ `ContractInstance` ⏏
Compile contract

**Kind**: Exported member  
**Returns**: `ContractInstance` - Contract ACI object with predefined js methods for contract usage  
**rtype**: `() => ContractInstance: Object`
<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.deploy"></a>

### instance.deploy ⇒ `ContractInstance` ⏏
Deploy contract

**Kind**: Exported member  
**Returns**: `ContractInstance` - Contract ACI object with predefined js methods for contract usage  
**rtype**: `(init: Array, options: Object = { skipArgsConvert: false }) => ContractInstance: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| init | `Array` |  | Contract init function arguments array |
| [options] | `Object` | <code>{}</code> | options Options object |
| [options.skipArgsConvert] | `Boolean` | <code>false</code> | Skip Validation and Transforming arguments before prepare call-data |

<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.call"></a>

### instance.call ⇒ `Object` ⏏
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

<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--getContractInstance"></a>

### getContractInstance(source, [options]) ⇒ `ContractInstance` ⏏
Generate contract ACI object with predefined js methods for contract usage

**Kind**: Exported function  
**Returns**: `ContractInstance` - JS Contract API  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| [options] | `Object` | Options object |
| [options.aci] | `Object` | Contract ACI |

**Example**  
```js
const contractIns = await client.getContractInstance(sourceCode)
await contractIns.compile()
await contractIns.deploy([321])
const callResult = await contractIns.call('setState', [123])
const staticCallResult = await contractIns.call('setState', [123], { callStatic: true })
```
<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--ContractACI"></a>

### ContractACI() ⇒ `Object` ⏏
Contract ACI Stamp

**Kind**: Exported function  
**Returns**: `Object` - Contract compiler instance  
**rtype**: `Stamp`
**Example**  
```js
ContractACI()
```
