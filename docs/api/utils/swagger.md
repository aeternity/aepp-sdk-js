<a id="module_@aeternity/aepp-sdk/es/utils/swagger"></a>

## @aeternity/aepp-sdk/es/utils/swagger
Swagger module

**Example**  
```js
import Swagger from '@aeternity/aepp-sdk/es/utils/swagger'
```

* [@aeternity/aepp-sdk/es/utils/swagger](#module_@aeternity/aepp-sdk/es/utils/swagger)
    * [Swagger(options)](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger) ⇒ `Object` ⏏
        * _static_
            * [.expandPath(s)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.expandPath) ⇒ `String`
            * [.conform(value, spec, types)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.conform) ⇒ `Object`
            * [.traverseKeys(fn, o)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.traverseKeys) ⇒ `Object`
            * [.snakizeKeys(o)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.snakizeKeys) ⇒ `Object`
            * [.pascalizeKeys(o)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.pascalizeKeys) ⇒ `Object`
            * [.assertOne(coll)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.assertOne) ⇒ `Object`
            * [.operation(path, method, definition, types)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.operation) ⇒ `function`
            * [.debugSwagger(bool)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.debugSwagger) ⇒ `Stamp`
        * _inner_
            * [~conformTypes](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..conformTypes)
            * [~lookupType(path, spec, types)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..lookupType) ⇒ `Object`
            * [~extendingErrorPath(key, fn)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..extendingErrorPath) ⇒ `Any`
            * [~TypeError(msg, spec, value)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..TypeError) ⇒ `Error`
            * [~conformDispatch(spec)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..conformDispatch) ⇒ `String`
            * [~classifyParameters(parameters)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..classifyParameters) ⇒ `Array.&lt;Object&gt;`
            * [~pascalizeParameters(parameters)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..pascalizeParameters) ⇒ `Array.&lt;Object&gt;`
            * [~operationSignature(name, req, opts)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..operationSignature) ⇒ `String`
            * [~destructureClientError(error)](#module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..destructureClientError) ⇒ `String`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger"></a>

### Swagger(options) ⇒ `Object` ⏏
Swagger Stamp

**Kind**: Exported function  
**Returns**: `Object` - Account instance  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | Initializer object |
| options.swag | `Object` | Swagger definition |
| options.axiosConfig | `Object` | Object with axios configuration. Example { config: {}, errorHandler: (err) => throw err } |

**Example**  
```js
Swagger({swag})
```
<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.expandPath"></a>

#### Swagger.expandPath(s) ⇒ `String`
Perform path string interpolation

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `String` - Converted string  
**rtype**: `(path: String, replacements: Object) => String`

| Param | Type | Description |
| --- | --- | --- |
| s | `String` | String to convert |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.conform"></a>

#### Swagger.conform(value, spec, types) ⇒ `Object`
Conform `value` against its `spec`

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Conformed value  
**rtype**: `(value: Any, spec: Object, types: Object) => Any, throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| value | `Object` | Value to conform (validate and transform) |
| spec | `Object` | Specification object |
| types | `Object` | Types specification |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.traverseKeys"></a>

#### Swagger.traverseKeys(fn, o) ⇒ `Object`
Key traversal metafunction

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Transformed object  
**rtype**: `(fn: (s: String) => String) => (o: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| fn | `function` | Key transformation function |
| o | `Object` | Object to traverse |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.snakizeKeys"></a>

#### Swagger.snakizeKeys(o) ⇒ `Object`
snake_case key traversal

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Transformed object  
**rtype**: `(o: Object) => Object`
**See**: pascalToSnake  

| Param | Type | Description |
| --- | --- | --- |
| o | `Object` | Object to traverse |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.pascalizeKeys"></a>

#### Swagger.pascalizeKeys(o) ⇒ `Object`
PascalCase key traversal

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Transformed object  
**rtype**: `(o: Object) => Object`
**See**: snakeToPascal  

| Param | Type | Description |
| --- | --- | --- |
| o | `Object` | Object to traverse |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.assertOne"></a>

#### Swagger.assertOne(coll) ⇒ `Object`
Assert that `coll` is a sequence with a length of 1 and extract the only element

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**rtype**: `(coll: [...Any]) => Any, throws: Error`

| Param | Type |
| --- | --- |
| coll | `Array.&lt;Object&gt;` | 

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.operation"></a>

#### Swagger.operation(path, method, definition, types) ⇒ `function`
Generate callable operation

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**rtype**: `(path: String, method: String, definition: Object, types: Object) => (instance: Swagger, url: String) => Promise[Any], throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| path | `String` | Path to call in URL |
| method | `String` | HTTP method |
| definition | `Object` | Complex definition |
| types | `Object` | Swagger types |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger.debugSwagger"></a>

#### Swagger.debugSwagger(bool) ⇒ `Stamp`
Reconfigure Swagger to (not) spill debugging logs

**Kind**: static method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Stamp` - Reconfigured Swagger Stamp  
**rtype**: `(bool: Boolean) => Stamp`

| Param | Type | Description |
| --- | --- | --- |
| bool | `boolean` | Whether to debug |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..conformTypes"></a>

#### Swagger~conformTypes
Per-type [conform](conform) dispatcher

**Kind**: inner constant of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**rtype**: `[(dispatch(value: String, spec: Object, types: Object) => Any, throws: Error)...]`
<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..lookupType"></a>

#### Swagger~lookupType(path, spec, types) ⇒ `Object`
Lookup type

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Object` - Looked up type definition  
**rtype**: `(path: [String...], spec: Object, types: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| path | `Array.&lt;String&gt;` | Path to look up |
| spec | `Object` |  |
| types | `Object` |  |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..extendingErrorPath"></a>

#### Swagger~extendingErrorPath(key, fn) ⇒ `Any`
Intercept errors thrown by `fn()`, extending them with information from `key`

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Any` - Execution result  
**rtype**: `(key: String, fn: Function) => Any`

| Param | Type | Description |
| --- | --- | --- |
| key | `String` | Information to attach |
| fn | `function` | Thunk |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..TypeError"></a>

#### Swagger~TypeError(msg, spec, value) ⇒ `Error`
Construct Error with additional type information (not thrown)

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Error` - Enhanced Error  
**rtype**: `(msg: String, spec: String, value: String) => Error`

| Param | Type | Description |
| --- | --- | --- |
| msg | `String` | Error message |
| spec | `String` |  |
| value | `String` |  |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..conformDispatch"></a>

#### Swagger~conformDispatch(spec) ⇒ `String`
[conform](conform) dispatcher

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `String` - Value to dispatch on  
**rtype**: `(spec: Object) => String, throws: Error`

| Param | Type |
| --- | --- |
| spec | `Object` | 

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..classifyParameters"></a>

#### Swagger~classifyParameters(parameters) ⇒ `Array.&lt;Object&gt;`
Classify given `parameters`

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Array.&lt;Object&gt;` - Classified parameters  
**rtype**: `(parameters: [{required: Boolean, in: String}...]) => {pathArgs: [...Object], queryArgs: [...Object], bodyArgs: [...Object], req: [...Object], opts: [...Object]}`

| Param | Type | Description |
| --- | --- | --- |
| parameters | `Array.&lt;Object&gt;` | Parameters to classify |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..pascalizeParameters"></a>

#### Swagger~pascalizeParameters(parameters) ⇒ `Array.&lt;Object&gt;`
Convert `name` attributes in `parameters` from snake_case to PascalCase

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `Array.&lt;Object&gt;` - Pascalized parameters  
**rtype**: `(parameters: [{name: String}...]) => [{name: String}...]`

| Param | Type | Description |
| --- | --- | --- |
| parameters | `Array.&lt;Object&gt;` | Parameters to pascalize |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..operationSignature"></a>

#### Swagger~operationSignature(name, req, opts) ⇒ `String`
Obtain readable signature for operation

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**Returns**: `String` - Signature  
**rtype**: `(name: String, req: [...Object], opts: [...Object]) => Object`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Name of operation |
| req | `Array.&lt;Object&gt;` | Required parameters to operation |
| opts | `Array.&lt;Object&gt;` | Optional parameters to operation |

<a id="module_@aeternity/aepp-sdk/es/utils/swagger--Swagger..destructureClientError"></a>

#### Swagger~destructureClientError(error) ⇒ `String`
Destructure HTTP client `error`

**Kind**: inner method of [`Swagger`](#exp_module_@aeternity/aepp-sdk/es/utils/swagger--Swagger)  
**rtype**: `(error: Error) => String`

| Param | Type |
| --- | --- |
| error | `Error` | 

