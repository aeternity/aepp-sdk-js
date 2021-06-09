<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc"></a>

### @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc
RPC handler for WAELLET side

**Example**  
```js
import WalletRpc from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc)
    * [module.exports(param, onConnection, onSubscription, onSign, onAskAccounts, onMessageSign, onDisconnect)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports) ⇒ `Object` ⏏
        * [.removeRpcClient(id, [opt])](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+removeRpcClient) ⇒ `void`
        * [.addRpcClient(clientConnection)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+addRpcClient) ⇒ `String`
        * [.shareWalletInfo(postFn)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+shareWalletInfo) ⇒ `void`
        * [.getWalletInfo()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+getWalletInfo) ⇒ `Object`
        * [.getAccounts()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+getAccounts) ⇒ `Object`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports"></a>

#### module.exports(param, onConnection, onSubscription, onSign, onAskAccounts, onMessageSign, onDisconnect) ⇒ `Object` ⏏
Contain functionality for aepp interaction and managing multiple aepps

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| param | `Object` | Init params object |
| [param.name] | `String` | Wallet name |
| onConnection | `function` | Call-back function for incoming AEPP connection (Second argument contain function for accept/deny request) |
| onSubscription | `function` | Call-back function for incoming AEPP account subscription (Second argument contain function for accept/deny request) |
| onSign | `function` | Call-back function for incoming AEPP sign request (Second argument contain function for accept/deny request) |
| onAskAccounts | `function` | Call-back function for incoming AEPP get address request (Second argument contain function for accept/deny request) |
| onMessageSign | `function` | Call-back function for incoming AEPP sign message request (Second argument contain function for accept/deny request) |
| onDisconnect | `function` | Call-back function for disconnect event |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+removeRpcClient"></a>

##### module.exports.removeRpcClient(id, [opt]) ⇒ `void`
Remove specific RpcClient by ID

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**rtype**: `(id: string) => void`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | `String` |  | Client ID |
| [opt] | `Object` | <code>{}</code> |  |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+addRpcClient"></a>

##### module.exports.addRpcClient(clientConnection) ⇒ `String`
Add new client by AEPP connection

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**Returns**: `String` - Client ID  
**rtype**: `(clientConnection: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| clientConnection | `Object` | AEPP connection object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+shareWalletInfo"></a>

##### module.exports.shareWalletInfo(postFn) ⇒ `void`
Share wallet info
Send shareWalletInfo message to notify AEPP about wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**rtype**: `(postFn: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| postFn | `function` | Send message function like `(msg) => void` |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+getWalletInfo"></a>

##### module.exports.getWalletInfo() ⇒ `Object`
Get Wallet info object

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**Returns**: `Object` - Object with wallet information(id, name, network, ...)  
**rtype**: `() => Object`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+getAccounts"></a>

##### module.exports.getAccounts() ⇒ `Object`
Get Wallet accounts

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**Returns**: `Object` - Object with accounts information({ connected: Object, current: Object })  
**rtype**: `() => Object`
