<a id="module_@aeternity/aepp-sdk/es/epoch"></a>

## @aeternity/aepp-sdk/es/epoch
Node module

**Export**: Node  
**Example**  
```js
import Node from '@aeternity/aepp-sdk/es/epoch'
```

* [@aeternity/aepp-sdk/es/epoch](#module_@aeternity/aepp-sdk/es/epoch)
    * [Node(options)](#exp_module_@aeternity/aepp-sdk/es/epoch--Epoch) ⇒ `Object` ⏏
        * [~loader(options)](#module_@aeternity/aepp-sdk/es/epoch--Epoch..loader) ⇒ `function`
        * _async_
            * [~remoteSwag(url)](#module_@aeternity/aepp-sdk/es/epoch--Epoch..remoteSwag) ⇒ `Object`

<a id="exp_module_@aeternity/aepp-sdk/es/epoch--Node"></a>

### Node(options) ⇒ `Object` ⏏
[Swagger](Swagger) based Node remote API Stamp

**Kind**: Exported function  
**Returns**: `Object` - Node client  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| options.url | `String` | Base URL for Node |
| [options.internalUrl] | `String` | Base URL for internal requests |

**Example**  
```js
Epoch({url: 'https://sdk-testnet.aepps.com'})
```
<a id="module_@aeternity/aepp-sdk/es/epoch--Node..loader"></a>

#### Node~loader(options) ⇒ `function`
Node specific loader for `urlFor`

**Kind**: inner method of [`Node`](#exp_module_@aeternity/aepp-sdk/es/epoch--Epoch)  
**Returns**: `function` - Implementation for [urlFor](urlFor)  
**rtype**: `({url: String, internalUrl?: String}) => (path: String, definition: Object) => tx: String`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| options.url | `String` | Base URL for Node |
| [options.internalUrl] | `String` | Base URL for internal requests |

<a id="module_@aeternity/aepp-sdk/es/epoch--Node..remoteSwag"></a>

#### Node~remoteSwag(url) ⇒ `Object`
Obtain Swagger configuration from Node node

**Kind**: inner method of [`Node`](#exp_module_@aeternity/aepp-sdk/es/epoch--Epoch)  
**Returns**: `Object` - Swagger configuration  
**Category**: async  
**rtype**: `(url: String) => swagger: Object`

| Param | Type | Description |
| --- | --- | --- |
| url | `String` | Node base URL |

