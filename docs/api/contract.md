<a id="module_@aeternity/aepp-sdk/es/contract"></a>

## @aeternity/aepp-sdk/es/contract
Contract Base module

**Export**: Contract  
**Example**  
```js
import ContractBase from '@aeternity/aepp-sdk/es/contract'
```

* [@aeternity/aepp-sdk/es/contract](#module_@aeternity/aepp-sdk/es/contract)
    * [ContractBase([options])](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase) ⇒ `Object` ⏏
        * *[.contractNodeEncodeCallData(code, abu, name, args)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractNodeEncodeCallData) ⇒ `String`*
        * *[.contractNodeCall(code, abu, name, args, call)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractNodeCall) ⇒ `Object`*
        * *[.contractNodeDecodeData(type, data)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+contractNodeDecodeData) ⇒ `String`*
        * *[.compileNodeContract(code, [options])](#module_@aeternity/aepp-sdk/es/contract--ContractBase+compileNodeContract) ⇒ `Object`*
        * *[.getContractByteCode(contractId)](#module_@aeternity/aepp-sdk/es/contract--ContractBase+getContractByteCode) ⇒ `String`*

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

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractNodeEncodeCallData"></a>

#### *contractBase.contractNodeEncodeCallData(code, abu, name, args) ⇒ `String`*
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
| args | `String` | Function argument's * @param {String} call - Pseudo contract with `__call()` function which simply call function with params. You can use this parametr only for `abi` one of ['sophia', 'sophia-address'] When you are passing `call` argument `name` and `args` will be ignored Yiu can find additional info here: https://github.com/aeternity/protocol/blob/master/node/api/contract_api_usage.md#sophia-calldata-creation |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractNodeCall"></a>

#### *contractBase.contractNodeCall(code, abu, name, args, call) ⇒ `Object`*
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
| call | `String` | Pseudo contract with `__call()` function which simply call function with params. You can use this parametr only for `abi` one of ['sophia', 'sophia-address'] When you are passing `call` argument `name` and `args` will be ignored You can find additional info here: https://github.com/aeternity/protocol/blob/master/node/api/contract_api_usage.md#sophia-calldata-creation |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+contractNodeDecodeData"></a>

#### *contractBase.contractNodeDecodeData(type, data) ⇒ `String`*
Decode data

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - - Decoded contract call result  
**Category**: async  
**rtype**: `(type: String, data: String) => decodedResult: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Contract call result type |
| data | `String` | Encoded contract call result |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+compileNodeContract"></a>

#### *contractBase.compileNodeContract(code, [options]) ⇒ `Object`*
Compile contract

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `Object` - Object which contain bytecode of contract  
**Category**: async  
**rtype**: `(code: String, options?: Object) => compiledContract: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | `String` |  | Contract source code |
| [options] | `Object` | <code>{}</code> | Options |

<a id="module_@aeternity/aepp-sdk/es/contract--ContractBase+getContractByteCode"></a>

#### *contractBase.getContractByteCode(contractId) ⇒ `String`*
Get bytecode by contract public key

**Kind**: instance abstract method of [`ContractBase`](#exp_module_@aeternity/aepp-sdk/es/contract--ContractBase)  
**Returns**: `String` - Contract byte code  
**Category**: async  
**rtype**: `(contractId: String) => byteCode: String`

| Param | Type |
| --- | --- |
| contractId | `String` | 

