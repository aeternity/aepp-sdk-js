<a id="module_@aeternity/aepp-sdk/es/contract"></a>

## @aeternity/aepp-sdk/es/contract
Contract Base module

**Example**  
```js
import ContractBase from '@aeternity/aepp-sdk/es/contract'
```

* [@aeternity/aepp-sdk/es/contract](#module_@aeternity/aepp-sdk/es/contract)
    * *[.contractGetACI(source, [options])](#module_@aeternity/aepp-sdk/es/contract+contractGetACI) ⇒ `Object`*
    * *[.contractEncodeCallDataAPI(source, name, args, [options])](#module_@aeternity/aepp-sdk/es/contract+contractEncodeCallDataAPI) ⇒ `String`*
    * *[.contractDecodeDataAPI(type, data)](#module_@aeternity/aepp-sdk/es/contract+contractDecodeDataAPI) ⇒ `String`*
    * *[.contractDecodeCallResultAPI(source, fn, callValue, callResult, [options])](#module_@aeternity/aepp-sdk/es/contract+contractDecodeCallResultAPI) ⇒ `String`*
    * *[.contractDecodeCallDataBySourceAPI(source, function, callData, [options])](#module_@aeternity/aepp-sdk/es/contract+contractDecodeCallDataBySourceAPI) ⇒ `String`*
    * *[.contractDecodeCallDataByCodeAPI(code, callData, backend)](#module_@aeternity/aepp-sdk/es/contract+contractDecodeCallDataByCodeAPI) ⇒ `String`*
    * *[.compileContractAPI(code, [options])](#module_@aeternity/aepp-sdk/es/contract+compileContractAPI) ⇒ `Object`*
    * *[.setCompilerUrl(url)](#module_@aeternity/aepp-sdk/es/contract+setCompilerUrl) ⇒ `void`*
    * *[.getCompilerVersion()](#module_@aeternity/aepp-sdk/es/contract+getCompilerVersion) ⇒ `String`*

<a id="module_@aeternity/aepp-sdk/es/contract+contractGetACI"></a>

### *@aeternity/aepp-sdk/es/contract.contractGetACI(source, [options]) ⇒ `Object`*
Get contract ACI

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Returns**: `Object` - - Contract aci object  
**Category**: async  
**rtype**: `(source: String, options: Array) => aciObject: Promise[Object]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract+contractEncodeCallDataAPI"></a>

### *@aeternity/aepp-sdk/es/contract.contractEncodeCallDataAPI(source, name, args, [options]) ⇒ `String`*
Encode contract data

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Returns**: `String` - - Contract encoded data  
**Category**: async  
**rtype**: `(source: String, name: String, args: Array, options: Array) => callData: Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source code |
| name | `String` |  | Function name |
| args | `Array` |  | Function argument's |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract+contractDecodeDataAPI"></a>

### *@aeternity/aepp-sdk/es/contract.contractDecodeDataAPI(type, data) ⇒ `String`*
Decode data

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Returns**: `String` - - Decoded contract call result  
**Category**: async  
**rtype**: `(type: String, data: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Contract call result type |
| data | `String` | Encoded contract call result |

<a id="module_@aeternity/aepp-sdk/es/contract+contractDecodeCallResultAPI"></a>

### *@aeternity/aepp-sdk/es/contract.contractDecodeCallResultAPI(source, fn, callValue, callResult, [options]) ⇒ `String`*
Decode contract call result data

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Returns**: `String` - - Decoded contract call result  
**Category**: async  
**rtype**: `(source: String, fn: String, callValue: String, callResult: String, options: Array) => decodedResult: Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | Contract source |
| fn | `String` |  | Fn name |
| callValue | `String` |  | result data (cb_das...) |
| callResult | `String` |  | contract call result status('ok', 'revert', ...) |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract+contractDecodeCallDataBySourceAPI"></a>

### *@aeternity/aepp-sdk/es/contract.contractDecodeCallDataBySourceAPI(source, function, callData, [options]) ⇒ `String`*
Decode call data by source

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Returns**: `String` - - Decoded contract call data  
**Category**: async  
**rtype**: `(source: String, function: String, callData: String, options: Array) => decodedResult: Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | `String` |  | contract source |
| function | `String` |  | function name |
| callData | `String` |  | Encoded contract call data |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract+contractDecodeCallDataByCodeAPI"></a>

### *@aeternity/aepp-sdk/es/contract.contractDecodeCallDataByCodeAPI(code, callData, backend) ⇒ `String`*
Decode call data by bytecode

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Returns**: `String` - - Decoded contract call data  
**Category**: async  
**rtype**: `(code: String, callData: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | contract byte code |
| callData | `String` | Encoded contract call data |
| backend | `String` | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract+compileContractAPI"></a>

### *@aeternity/aepp-sdk/es/contract.compileContractAPI(code, [options]) ⇒ `Object`*
Compile contract

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Returns**: `Object` - Object which contain bytecode of contract  
**Category**: async  
**rtype**: `(code: String, options?: Object) => compiledContract: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | `String` |  | Contract source code |
| [options] | `Object` | <code>{}</code> | Options |
| [options.filesystem] | `Object` |  | Contract external namespaces map |
| [options.backend] | `Object` |  | Contract vm(default: aevm) |

<a id="module_@aeternity/aepp-sdk/es/contract+setCompilerUrl"></a>

### *@aeternity/aepp-sdk/es/contract.setCompilerUrl(url) ⇒ `void`*
Set compiler url

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Category**: async  
**rtype**: `(url: String) => void`

| Param | Type | Description |
| --- | --- | --- |
| url | `String` | Compiler url |

<a id="module_@aeternity/aepp-sdk/es/contract+getCompilerVersion"></a>

### *@aeternity/aepp-sdk/es/contract.getCompilerVersion() ⇒ `String`*
Get Compiler Version

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/contract`](#module_@aeternity/aepp-sdk/es/contract)  
**Returns**: `String` - Compiler version  
**Category**: async  
**rtype**: `() => String`
