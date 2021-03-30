<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client"></a>

### @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client
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
        * _instance_
            * [.addClient(id, connectionData)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addClient) ⇒ `void`
            * [.getClient(id)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getClient) ⇒ `Object`
            * [.removeClient(id, forceConnectionClose)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+removeClient) ⇒ `Boolean`
            * [.updateClientInfo(id, info)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateClientInfo) ⇒ `void`
            * [.sendNotificationByCondition(msg, condition, transformMessage)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+sendNotificationByCondition) ⇒ `void`
            * [.operationByCondition(condition, operation)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+operationByCondition) ⇒ `void`
            * [.hasAccessToAccount(address)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+hasAccessToAccount) ⇒ `Boolean`
            * [.isConnected()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+isConnected) ⇒ `Boolean`
            * [.getCurrentAccount(options)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getCurrentAccount) ⇒ `String`
            * [.disconnect()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+disconnect) ⇒ `void`
            * [.updateSubscription(type, value)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateSubscription) ⇒ `Array.&lt;String&gt;`
            * [.addAction(action, resolvers)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addAction) ⇒ `Object`
            * [.request(name, params)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+request) ⇒ `Promise`
            * [.processResponse(msg, [transformResult])](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+processResponse) ⇒ `void`
        * _static_
            * [.RpcClients()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient.RpcClients) ⇒ `Object`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient"></a>

#### exports.RpcClient(param) ⇒ `Object` ⏏
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

##### exports.RpcClient.addClient(id, connectionData) ⇒ `void`
Add new client

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(id: (String|Number), connectionInfo: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |
| connectionData | `Object` | Object containing `connectionInfo` and `connection` objects |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getClient"></a>

##### exports.RpcClient.getClient(id) ⇒ `Object`
Get clien by id

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Object` - RpcClient  
**rtype**: `(id: (String|Number)) => Object`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+removeClient"></a>

##### exports.RpcClient.removeClient(id, forceConnectionClose) ⇒ `Boolean`
Remove and disiconnect client by ID

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(id: (String|Number), { forceConnectionClose: boolean = false }) => boolean`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |
| forceConnectionClose |  |  |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateClientInfo"></a>

##### exports.RpcClient.updateClientInfo(id, info) ⇒ `void`
Update client info by id

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(id: (String|Number), info: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |
| info | `Object` | Info to update (will be merged with current info object) |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+sendNotificationByCondition"></a>

##### exports.RpcClient.sendNotificationByCondition(msg, condition, transformMessage) ⇒ `void`
Send notification to all client passing condition

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(msg: Object, condition: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Msg object |
| condition | `function` | Condition function of (client: RpcClient) => Boolean |
| transformMessage |  |  |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+operationByCondition"></a>

##### exports.RpcClient.operationByCondition(condition, operation) ⇒ `void`
Call provided function for each rpc client which by condition

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(condition: Function, operation: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| condition | `function` | Condition function of (client: RpcClient) => Boolean |
| operation | `function` | Operation function of (client: RpcClient) => void |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+hasAccessToAccount"></a>

##### exports.RpcClient.hasAccessToAccount(address) ⇒ `Boolean`
Check if aepp has access to account

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Boolean` - is connected  
**rtype**: `(address: String) => Boolean`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Account address |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+isConnected"></a>

##### exports.RpcClient.isConnected() ⇒ `Boolean`
Check if is connected

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Boolean` - is connected  
**rtype**: `() => Boolean`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getCurrentAccount"></a>

##### exports.RpcClient.getCurrentAccount(options) ⇒ `String`
Get selected account

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `({ onAccount } = {}) => String`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+disconnect"></a>

##### exports.RpcClient.disconnect() ⇒ `void`
Disconnect

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateSubscription"></a>

##### exports.RpcClient.updateSubscription(type, value) ⇒ `Array.&lt;String&gt;`
Update subscription

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(type: String, value: String) => void`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Subscription type |
| value | `String` | Subscription value |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addAction"></a>

##### exports.RpcClient.addAction(action, resolvers) ⇒ `Object`
Add new action to actions

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(action: Object, [r: Function, j: Function]) => Object`

| Param | Type | Description |
| --- | --- | --- |
| action | `Object` | Action object |
| resolvers | `Array.&lt;function()&gt;` | Array with two function [resolve, reject] action |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+request"></a>

##### exports.RpcClient.request(name, params) ⇒ `Promise`
Make a request

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Promise` - Promise which will be resolved after receiving response message  
**rtype**: `(name: String, params: Object) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Method name |
| params | `Object` | Method params |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+processResponse"></a>

##### exports.RpcClient.processResponse(msg, [transformResult]) ⇒ `void`
Process response message

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(msg: Object, transformResult: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message object |
| [transformResult] | `function` | Optional parser function for message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient.RpcClients"></a>

##### exports.RpcClient.RpcClients() ⇒ `Object`
Contain functionality for managing multiple RPC clients (RpcClient stamp)

**Kind**: static method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `Stamp`
