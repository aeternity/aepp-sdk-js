<a id="module_@aeternity/aepp-sdk/es/epoch"></a>

## @aeternity/aepp-sdk/es/epoch
Epoch module

**Export**: Epoch  
**Example**  
```js
import Epoch from '@aeternity/aepp-sdk/es/epoch'
```

* [@aeternity/aepp-sdk/es/epoch](#module_@aeternity/aepp-sdk/es/epoch)
    * [Epoch(options)](#exp_module_@aeternity/aepp-sdk/es/epoch--Epoch) ⇒ `Object` ⏏
        * [~loader(options)](#module_@aeternity/aepp-sdk/es/epoch--Epoch..loader) ⇒ `function`
        * _async_
            * [~remoteSwag(url)](#module_@aeternity/aepp-sdk/es/epoch--Epoch..remoteSwag) ⇒ `Object`

<a id="exp_module_@aeternity/aepp-sdk/es/epoch--Epoch"></a>

### Epoch(options) ⇒ `Object` ⏏
[Swagger](Swagger) based Epoch remote API Stamp

**Kind**: Exported function  
**Returns**: `Object` - Epoch client  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| options.url | `String` | Base URL for Epoch |
| [options.internalUrl] | `String` | Base URL for internal requests |

**Example**  
```js
Epoch({url: 'https://sdk-testnet.aepps.com'})
```
<a id="module_@aeternity/aepp-sdk/es/epoch--Epoch..loader"></a>

#### Epoch~loader(options) ⇒ `function`
Epoch specific loader for `urlFor`

**Kind**: inner method of [`Epoch`](#exp_module_@aeternity/aepp-sdk/es/epoch--Epoch)  
**Returns**: `function` - Implementation for [urlFor](urlFor)  
**rtype**: `({url: String, internalUrl?: String}) => (path: String, definition: Object) => tx: String`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` |  |
| options.url | `String` | Base URL for Epoch |
| [options.internalUrl] | `String` | Base URL for internal requests |

<a id="module_@aeternity/aepp-sdk/es/epoch--Epoch..remoteSwag"></a>

#### Epoch~remoteSwag(url) ⇒ `Object`
Obtain Swagger configuration from Epoch node

**Kind**: inner method of [`Epoch`](#exp_module_@aeternity/aepp-sdk/es/epoch--Epoch)  
**Returns**: `Object` - Swagger configuration  
**Category**: async  
**rtype**: `(url: String) => swagger: Object`

| Param | Type | Description |
| --- | --- | --- |
| url | `String` | Epoch base URL |

