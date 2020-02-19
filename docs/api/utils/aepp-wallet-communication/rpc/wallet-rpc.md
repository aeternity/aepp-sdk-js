<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc"></a>

## @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc
RPC handler for WAELLET side

**Example**  
```js
import WalletRpc from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc)
    * [exports.WalletRpc(param, onConnection, onSubscription, onSign, onAskAccounts, onMessageSign, onDisconnect)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc) ⇒ `Object` ⏏
        * [.getClients()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+getClients) ⇒ `Object`
        * [.addRpcClient(clientConnection)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+addRpcClient) ⇒ `void`
        * [.shareWalletInfo(postFn)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+shareWalletInfo) ⇒ `void`
        * [.getWalletInfo()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+getWalletInfo) ⇒ `Object`
        * [.getAccounts()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+getAccounts) ⇒ `Object`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc"></a>

### exports.WalletRpc(param, onConnection, onSubscription, onSign, onAskAccounts, onMessageSign, onDisconnect) ⇒ `Object` ⏏
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

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+getClients"></a>

#### exports.WalletRpc.getClients() ⇒ `Object`
Get RpcClients object which contain all connected AEPPS

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**rtype**: `() => Object`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+addRpcClient"></a>

#### exports.WalletRpc.addRpcClient(clientConnection) ⇒ `void`
Add new AEPP connection

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**rtype**: `(clientConnection: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| clientConnection | `Object` | AEPP connection object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+shareWalletInfo"></a>

#### exports.WalletRpc.shareWalletInfo(postFn) ⇒ `void`
Share wallet info
Send shareWalletInfo message to notify AEPP about wallet

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**rtype**: `(postFn: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| postFn | `function` | Send message function like `(msg) => void` |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+getWalletInfo"></a>

#### exports.WalletRpc.getWalletInfo() ⇒ `Object`
Get Wallet info object

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**Returns**: `Object` - Object with wallet information(id, name, network, ...)  
**rtype**: `() => Object`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+getAccounts"></a>

#### exports.WalletRpc.getAccounts() ⇒ `Object`
Get Wallet accounts

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**Returns**: `Object` - Object with accounts information({ connected: Object, current: Object })  
**rtype**: `() => Object`
