<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client"></a>

## @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
RPC client helpers

**Example**  
```js
import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
```
**Example**  
```js
import RpcClients from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client)
    * [exports.RpcClient(param)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient) ⇒ `Object` ⏏
        * [.addClient(id, connectionData)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addClient) ⇒ `void`
        * [.getClient(id)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getClient) ⇒ `Object`
        * [.updateClientInfo(id, info)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateClientInfo) ⇒ `void`
        * [.sentNotificationByCondition(msg, condition)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+sentNotificationByCondition) ⇒ `void`
        * [.isConnected()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+isConnected) ⇒ `Boolean`
        * [.getCurrentAccount(options)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getCurrentAccount) ⇒ `String`
        * [.disconnect()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+disconnect) ⇒ `void`
        * [.updateSubscription(type, value)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateSubscription) ⇒ `void`
        * [.addAction(action, resolvers)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addAction) ⇒ `Object`
        * [.addCallback(msgId)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addCallback) ⇒ `Promise`
        * [.processResponse(msg, [transformResult])](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+processResponse) ⇒ `void`
        * [.resolveCallback(msgId, args)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+resolveCallback) ⇒ `void`
        * [.rejectCallback(msgId, args)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+rejectCallback) ⇒ `void`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient"></a>

### exports.RpcClient(param) ⇒ `Object` ⏏
Contain functionality for using RPC conection

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| param | `Object` | Init params object |
| param.id | `String` | Client id |
| param.name | `String` | Client name |
| param.connection | `Object` | Connection object |
| param.handlers | `Array.&lt;function()&gt;` | Arrays with two function for handling messages ([ onMessage: Function, onDisconnect: Function]) |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addClient"></a>

#### exports.RpcClient.addClient(id, connectionData) ⇒ `void`
Add new client

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(id: (String|Number), connectionInfo: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |
| connectionData | `Object` | Object containing `connectionInfo` and `connection` objects |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getClient"></a>

#### exports.RpcClient.getClient(id) ⇒ `Object`
Get clien by id

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Object` - RpcClient  
**rtype**: `(id: (String|Number)) => Object`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateClientInfo"></a>

#### exports.RpcClient.updateClientInfo(id, info) ⇒ `void`
Update client info by id

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(id: (String|Number), info: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |
| info | `Object` | Info to update (will be merged with current info object) |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+sentNotificationByCondition"></a>

#### exports.RpcClient.sentNotificationByCondition(msg, condition) ⇒ `void`
Send notification to all client passing condition

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(msg: Object, condition: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Msg object |
| condition | `function` | Condition function of (client: RpcClient) => Boolean |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+isConnected"></a>

#### exports.RpcClient.isConnected() ⇒ `Boolean`
Check if is connected

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Boolean` - is connected  
**rtype**: `() => Boolean`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getCurrentAccount"></a>

#### exports.RpcClient.getCurrentAccount(options) ⇒ `String`
Get selected account

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `({ onAccount } = {}) => String`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+disconnect"></a>

#### exports.RpcClient.disconnect() ⇒ `void`
Disconnect

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateSubscription"></a>

#### exports.RpcClient.updateSubscription(type, value) ⇒ `void`
Update subsription

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(type: String, value: String) => void`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Subscription type |
| value | `String` | Subscription value |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addAction"></a>

#### exports.RpcClient.addAction(action, resolvers) ⇒ `Object`
Add new action to actions

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(action: Object, [r: Function, j: Function]) => Object`

| Param | Type | Description |
| --- | --- | --- |
| action | `Object` | Action object |
| resolvers | `Array.&lt;function()&gt;` | Array with two function [resolve, reject] action |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addCallback"></a>

#### exports.RpcClient.addCallback(msgId) ⇒ `Promise`
Add new callback for request

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Promise` - Promise which will be resolved after receiving response message  
**rtype**: `(msgId: (String|Number)) => Object`

| Param | Type | Description |
| --- | --- | --- |
| msgId | `String` \| `Number` | Request message id |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+processResponse"></a>

#### exports.RpcClient.processResponse(msg, [transformResult]) ⇒ `void`
Process response message

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(msg: Object, transformResult: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message object |
| [transformResult] | `function` | Optional parser function for message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+resolveCallback"></a>

#### exports.RpcClient.resolveCallback(msgId, args) ⇒ `void`
Resolve callback function
Trigger Promise resolution from `addCallBack` function

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(msgId: Number, args: Array) => void`

| Param | Type | Description |
| --- | --- | --- |
| msgId | `Number` | Message Id |
| args | `Array` | Arguments array |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+rejectCallback"></a>

#### exports.RpcClient.rejectCallback(msgId, args) ⇒ `void`
Reject callback function
Trigger Promise rejection from `addCallBack` function

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(msgId: Number, args: Array) => void`

| Param | Type | Description |
| --- | --- | --- |
| msgId | `Number` | Message Id |
| args | `Array` | Arguments array |

