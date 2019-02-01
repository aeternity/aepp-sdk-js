<a id="module_@aeternity/aepp-sdk/es/ae/contract"></a>

## @aeternity/aepp-sdk/es/ae/contract
Contract module - routines to interact with the æternity contract

High level documentation of the contracts are available at
https://github.com/aeternity/protocol/tree/master/contracts and

**Export**: Contract  
**Example**  
```js
import Contract from '@aeternity/aepp-sdk/es/ae/contract' (Using tree-shaking)
```
**Example**  
```js
import { Contract } from '@aeternity/aepp-sdk' (Using bundle)
```

* [@aeternity/aepp-sdk/es/ae/contract](#module_@aeternity/aepp-sdk/es/ae/contract)
    * [Contract([options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--Contract) ⇒ `Object` ⏏
    * _instance_
        * _async_
            * [.encodeCall(code, abi, name, args, call)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--encodeCall) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.callStatic(address, abi, name, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--callStatic) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.decode(type, data)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--decode) ⇒ `Promise.&lt;String&gt;` ⏏
            * [.call(code, abi, address, name, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--call) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.deploy(code, abi, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/contract--deploy) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.compile(code, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--compile) ⇒ `Promise.&lt;Object&gt;` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--Contract"></a>

### Contract([options]) ⇒ `Object` ⏏
Contract Stamp

Provide contract implementation
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Contract instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--encodeCall"></a>

### .encodeCall(code, abi, name, args, call) ⇒ `Promise.&lt;Object&gt;` ⏏
Encode call data for contract call

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/contract`](#module_@aeternity/aepp-sdk/es/ae/contract)  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | Contract source code or Contract address |
| abi | `String` | ABI('sophia', 'sophia-address') |
| name | `String` | Name of function to call |
| args | `String` | Argument's for call ('()') |
| call | `String` | Code of `call` contract(Pseudo code with __call => {name}({args}) function) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--callStatic"></a>

### .callStatic(address, abi, name, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Static contract call(using dry-run)

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/contract`](#module_@aeternity/aepp-sdk/es/ae/contract)  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| address | `String` |  | Contract address |
| abi | `String` | <code>sophia-address</code> | ABI('sophia', 'sophia-address') |
| name | `String` |  | Name of function to call |
| [options] | `Object` | <code>{}</code> | options Options |
| [options.args] | `String` |  | args Argument's for call function |
| [options.call] | `String` |  | call Code of `call` contract(Pseudo code with __call => {name}({args}) function) |
| [options.options] | `String` |  | options Transaction options (fee, ttl, gas, amount, deposit) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--decode"></a>

### .decode(type, data) ⇒ `Promise.&lt;String&gt;` ⏏
Decode contract call result data

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/contract`](#module_@aeternity/aepp-sdk/es/ae/contract)  
**Returns**: `Promise.&lt;String&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Data type (int, string, list,...) |
| data | `String` | call result data (cb_iwer89fjsdf2j93fjews_(ssdffsdfsdf...) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--call"></a>

### .call(code, abi, address, name, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Call contract function

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/contract`](#module_@aeternity/aepp-sdk/es/ae/contract)  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | `String` |  | Contract source code |
| abi | `String` |  | ABI('sophia', 'sophia-address') |
| address | `String` |  | Contract address |
| name | `String` |  | Name of function to call |
| [options] | `Object` | <code>{}</code> | options Options |
| [options.args] | `String` |  | args Argument's for call function |
| [options.call] | `String` |  | call Code of `call` contract(Pseudo code with __call => {name}({args}) function) |
| [options.options] | `String` |  | options Transaction options (fee, ttl, gas, amount, deposit) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--deploy"></a>

### .deploy(code, abi, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Deploy contract to the node

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/contract`](#module_@aeternity/aepp-sdk/es/ae/contract)  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | `String` |  | Contract source code |
| abi | `String` |  | ABI('sophia', 'sophia-address') |
| [options] | `Object` | <code>{}</code> | options Options |
| [options.initState] | `String` |  | initState Argument's for contract init function |
| [options.options] | `String` |  | options Transaction options (fee, ttl, gas, amount, deposit) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--compile"></a>

### .compile(code, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Compile contract source code

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/contract`](#module_@aeternity/aepp-sdk/es/ae/contract)  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | Contract code |
| options | `Object` | Transaction options (fee, ttl, gas, amount, deposit) |

