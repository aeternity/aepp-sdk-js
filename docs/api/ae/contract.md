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
    * _async_
        * [handleCallError(result)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--handleCallError) ⇒ `Promise.&lt;void&gt;` ⏏
        * [encodeCall(source, name, args)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--encodeCall) ⇒ `Promise.&lt;String&gt;` ⏏
        * [decode(type, data)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--decode) ⇒ `Promise.&lt;String&gt;` ⏏
        * [callStatic(source, address, name, args, options, top, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--callStatic) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [call(source, address, name, args, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--call) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [deploy(code, source, initState, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--deploy) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [compile(source, options)](#exp_module_@aeternity/aepp-sdk/es/ae/contract--compile) ⇒ `Promise.&lt;Object&gt;` ⏏

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

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--handleCallError"></a>

### handleCallError(result) ⇒ `Promise.&lt;void&gt;` ⏏
Handle contract call error

**Kind**: Exported function  
**Category**: async  
**Throws**:

- Error Decoded error


| Param | Type | Description |
| --- | --- | --- |
| result | `Object` | call result object |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--encodeCall"></a>

### encodeCall(source, name, args) ⇒ `Promise.&lt;String&gt;` ⏏
Encode call data for contract call

**Kind**: Exported function  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| name | `String` | Name of function to call |
| args | `Array` | Argument's for call |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--decode"></a>

### decode(type, data) ⇒ `Promise.&lt;String&gt;` ⏏
Decode contract call result data

**Kind**: Exported function  
**Returns**: `Promise.&lt;String&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Data type (int, string, list,...) |
| data | `String` | call result data (cb_iwer89fjsdf2j93fjews_(ssdffsdfsdf...) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--callStatic"></a>

### callStatic(source, address, name, args, options, top, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Static contract call(using dry-run)

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| address | `String` | Contract address |
| name | `String` | Name of function to call |
| args | `Array` | Argument's for call function |
| options | `Object` | [options={}]  Options |
| top | `String` | [options.top] Block hash on which you want to call contract |
| options | `String` | [options.options]  Transaction options (fee, ttl, gas, amount, deposit) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--call"></a>

### call(source, address, name, args, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Call contract function

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract source code |
| address | `String` | Contract address |
| name | `String` | Name of function to call |
| args | `Array` | Argument's for call function |
| options | `Object` | Transaction options (fee, ttl, gas, amount, deposit) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--deploy"></a>

### deploy(code, source, initState, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Deploy contract to the node

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| code | `String` | Compiled contract |
| source | `String` | Contract source code |
| initState | `Array` | Arguments of contract constructor(init) function |
| options | `Object` | Transaction options (fee, ttl, gas, amount, deposit) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/contract--compile"></a>

### compile(source, options) ⇒ `Promise.&lt;Object&gt;` ⏏
Compile contract source code

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Result object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| source | `String` | Contract sourece code |
| options | `Object` | Transaction options (fee, ttl, gas, amount, deposit) |

