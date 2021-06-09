<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client"></a>

### @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
RpcClient module

**Example**  
```js
import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client)
    * [module.exports(param)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports) ⇒ `Object` ⏏
        * [.updateInfo(info)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+updateInfo) ⇒ `void`
        * [.hasAccessToAccount(address)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+hasAccessToAccount) ⇒ `Boolean`
        * [.isConnected()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+isConnected) ⇒ `Boolean`
        * [.getCurrentAccount(options)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+getCurrentAccount) ⇒ `String`
        * [.disconnect()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+disconnect) ⇒ `void`
        * [.updateSubscription(type, value)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+updateSubscription) ⇒ `Array.&lt;String&gt;`
        * [.request(name, params)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+request) ⇒ `Promise`
        * [.processResponse(msg, [transformResult])](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+processResponse) ⇒ `void`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports"></a>

#### module.exports(param) ⇒ `Object` ⏏
Contain functionality for using RPC conection

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| param | `Object` | Init params object |
| param.name | `String` | Client name |
| param.connection | `Object` | Connection object |
| param.handlers | `Array.&lt;function()&gt;` | Arrays with two function for handling messages ([ onMessage: Function, onDisconnect: Function]) |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+updateInfo"></a>

##### module.exports.updateInfo(info) ⇒ `void`
Update info

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `(info: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| info | `Object` | Info to update (will be merged with current info object) |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+hasAccessToAccount"></a>

##### module.exports.hasAccessToAccount(address) ⇒ `Boolean`
Check if aepp has access to account

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**Returns**: `Boolean` - is connected  
**rtype**: `(address: String) => Boolean`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Account address |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+isConnected"></a>

##### module.exports.isConnected() ⇒ `Boolean`
Check if is connected

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**Returns**: `Boolean` - is connected  
**rtype**: `() => Boolean`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+getCurrentAccount"></a>

##### module.exports.getCurrentAccount(options) ⇒ `String`
Get selected account

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `({ onAccount } = {}) => String`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+disconnect"></a>

##### module.exports.disconnect() ⇒ `void`
Disconnect

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+updateSubscription"></a>

##### module.exports.updateSubscription(type, value) ⇒ `Array.&lt;String&gt;`
Update subscription

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `(type: String, value: String) => void`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Subscription type |
| value | `String` | Subscription value |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+request"></a>

##### module.exports.request(name, params) ⇒ `Promise`
Make a request

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**Returns**: `Promise` - Promise which will be resolved after receiving response message  
**rtype**: `(name: String, params: Object) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Method name |
| params | `Object` | Method params |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+processResponse"></a>

##### module.exports.processResponse(msg, [transformResult]) ⇒ `void`
Process response message

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `(msg: Object, transformResult: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message object |
| [transformResult] | `function` | Optional parser function for message |

