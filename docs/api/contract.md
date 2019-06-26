<a id="module_@aeternity/aepp-sdk/es/contract"></a>

## @aeternity/aepp-sdk/es/contract
Contract Base module

**Example**  
```js
import ContractBase from '@aeternity/aepp-sdk/es/contract'
```

* [@aeternity/aepp-sdk/es/contract](#module_@aeternity/aepp-sdk/es/contract)
    * [ContractBase([options])](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase) ⇒ `Object` ⏏
        * *[.contractEncodeCallDataAPI(source, name, args)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEncodeCallDataAPI) ⇒ `String`*
        * *[.contractDecodeDataAPI(type, data)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeDataAPI) ⇒ `String`*
        * *[.contractDecodeCallResultAPI(source, fn, callValue, callResult)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallResultAPI) ⇒ `String`*
        * *[.contractDecodeCallDataBySourceAPI(source, function, callData)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallDataBySourceAPI) ⇒ `String`*
        * *[.contractDecodeCallDataByCodeAPI(code, callData)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallDataByCodeAPI) ⇒ `String`*
        * *[.compileContractAPI(code, [options])](#module_@aeternity/aepp-sdk/es/contract--ContractBase+compileContractAPI) ⇒ `Object`*
        * *[.setCompilerUrl(url)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+setCompilerUrl) ⇒ `void`*
        * *[.getCompilerVersion()](#module_@aeternity/aepp-sdk/es/contract--ContractBase+getCompilerVersion) ⇒ `String`*

<a id="exp_module_@aeternity/aepp-sdk/es/contract--ContractBase"></a>

### ContractBase([options]) ⇒ `Object` ⏏
Basic Contract Stamp

This stamp include api call's related to contract functionality.
Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

**Kind**: Exported function  
**Returns**: `Object` - Contract instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEncodeCallDataAPI"></a>

#### *contractBase.contractEncodeCallDataAPI(source, name, args) ⇒ `String`*
Encode contract data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Contract encoded data  
**Category**: async  
**rtype**: `(source: String, name: String, args: Array) => callData: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| name | `String` | Function name |
| args | `Array` | Function argument's |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeDataAPI"></a>

#### *contractBase.contractDecodeDataAPI(type, data) ⇒ `String`*
Decode data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call result  
**Category**: async  
**rtype**: `(type: String, data: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Contract call result type |
| data | `String` | Encoded contract call result |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallResultAPI"></a>

#### *contractBase.contractDecodeCallResultAPI(source, fn, callValue, callResult) ⇒ `String`*
Decode contract call result data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call result  
**Category**: async  
**rtype**: `(source: String, fn: String, callValue: String, callResult: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source |
| fn | `String` | Fn name |
| callValue | `String` | result data (cb_das...) |
| callResult | `String` | contract call result status('ok', 'revert', ...) |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallDataBySourceAPI"></a>

#### *contractBase.contractDecodeCallDataBySourceAPI(source, function, callData) ⇒ `String`*
Decode call data by source

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call data  
**Category**: async  
**rtype**: `(source: String, function: String, callData: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | contract source |
| function | `String` | function name |
| callData | `String` | Encoded contract call data |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractDecodeCallDataByCodeAPI"></a>

#### *contractBase.contractDecodeCallDataByCodeAPI(code, callData) ⇒ `String`*
Decode call data by bytecode

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call data  
**Category**: async  
**rtype**: `(code: String, callData: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | contract byte code |
| callData | `String` | Encoded contract call data |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+compileContractAPI"></a>

#### *contractBase.compileContractAPI(code, [options]) ⇒ `Object`*
Compile contract

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `Object` - Object which contain bytecode of contract  
**Category**: async  
**rtype**: `(code: String, options?: Object) => compiledContract: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | `String` |  | Contract source code |
| [options] | `Object` | <code>{}</code> | Options |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+setCompilerUrl"></a>

#### *contractBase.setCompilerUrl(url) ⇒ `void`*
Set compiler url

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Category**: async  
**rtype**: `(url: String) => void`

| Param | Type | Description |
| --- | --- | --- |
| url | `String` | Compiler url |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+getCompilerVersion"></a>

#### *contractBase.getCompilerVersion() ⇒ `String`*
Get Compiler Version

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - Compiler version  
**Category**: async  
**rtype**: `() => String`
