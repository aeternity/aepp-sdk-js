<a id="module_@aeternity/aepp-sdk/es/contract/aci"></a>

## @aeternity/aepp-sdk/es/contract/aci
ContractACI module

**Export**: ContractACI  
**Example**  
```js
import ContractACI from '@aeternity/aepp-sdk/es/contract/aci'
```

* [@aeternity/aepp-sdk/es/contract/aci](#module_@aeternity/aepp-sdk/es/contract/aci)
    * [instance.compile](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.compile) ⇒ `ContractInstance` ⏏
    * [instance.deploy](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.deploy) ⇒ `ContractInstance` ⏏
    * [instance.call](#exp_module_@aeternity/aepp-sdk/es/contract/aci--instance.call) ⇒ `Object` ⏏
    * [getInstance(source, [options])](#exp_module_@aeternity/aepp-sdk/es/contract/aci--getInstance) ⇒ `ContractInstance` ⏏
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
**rtype**: `(init: Array, options: Object = { fromJsType: true }) => ContractInstance: Object`

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
**rtype**: `(init: Array, options: Object = { fromJsType: true, transformDecoded: true }) => CallResult: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fn | `String` |  | Function name |
| params | `Array` |  | Array of function arguments |
| [options] | `Object` | <code>{}</code> | Array of function arguments |
| [options.skipArgsConvert] | `Boolean` | <code>false</code> | Skip Validation and Transforming arguments before prepare call-data |
| [options.skipTransformDecoded] | `Boolean` | <code>false</code> | Skip Transform decoded data to JS type |

<a id="exp_module_@aeternity/aepp-sdk/es/contract/aci--getInstance"></a>

### getInstance(source, [options]) ⇒ `ContractInstance` ⏏
Generate contract ACI object with predefined js methods for contract usage

**Kind**: Exported function  
**Returns**: `ContractInstance` - JS Contract API  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| [options] | `Object` | Options object |
| [options.aci] | `Object` | Contract ACI |

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
