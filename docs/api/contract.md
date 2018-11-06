<a id="module_@aeternity/aepp-sdk/es/contract"></a>

## @aeternity/aepp-sdk/es/contract
Contract module

**Export**: Contract  
**Example**  
```js
import Contract from '@aeternity/aepp-sdk/es/contract'
```

* [@aeternity/aepp-sdk/es/contract](#module_@aeternity/aepp-sdk/es/contract)
    * [ContractBase([options])](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase) ⇒ `Object` ⏏
        * *[.contractEpochEncodeCallData(code, abu, name, args)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEpochEncodeCallData) ⇒ `String`*
        * *[.contractEpochCall(code, abu, name, args)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEpochCall) ⇒ `Object`*
        * *[.contractEpochDecodeData(type, data)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEpochDecodeData) ⇒ `String`*
        * *[.compileEpochContract(code, [options])](#module_@aeternity/aepp-sdk/es/contract--ContractBase+compileEpochContract) ⇒ `Object`*

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

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEpochEncodeCallData"></a>

#### *contractBase.contractEpochEncodeCallData(code, abu, name, args) ⇒ `String`*
Encode contract data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Contract encoded data  
**Category**: async  
**rtype**: `(code: String, abi: String, name: String, args: Object) => callData: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | Contract code |
| abu | `String` | Contract compiler name |
| name | `String` | Function name |
| args | `String` | Function argument's |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEpochCall"></a>

#### *contractBase.contractEpochCall(code, abu, name, args) ⇒ `Object`*
Call the contract

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `Object` - - Contract call result  
**Category**: async  
**rtype**: `(code: String, abi: String, name: String, args: Object) => callData: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | Contract code |
| abu | `String` | Contract compiler name |
| name | `String` | Function name |
| args | `String` | Function argument's |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractEpochDecodeData"></a>

#### *contractBase.contractEpochDecodeData(type, data) ⇒ `String`*
Decode data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call result  
**Category**: async  
**rtype**: `(type: String, data: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Contract call result type |
| data | `String` | Encoded contract call result |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+compileEpochContract"></a>

#### *contractBase.compileEpochContract(code, [options]) ⇒ `Object`*
Compile epoch contract

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `Object` - Object which contain bytecode of contract  
**Category**: async  
**rtype**: `(code: String, options?: Object) => compiledContract: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | `String` |  | Contract source code |
| [options] | `Object` | <code>{}</code> | Options |

