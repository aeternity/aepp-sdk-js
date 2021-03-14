## Aepp Wallet Communication
 
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection"></a>

##### utils/aepp-wallet-communication/connection
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection 

Wallet Connection base module

**Example**  
```js
import WalletConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection'
```


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection"></a>

###### WalletConnection

**Type Sig:** WalletConnection([options]) ⇒ `Object` 

Basic Wallet Connection

This stamp include interface for wallet connection functionality.
Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

**Kind**: Exported function  
**Returns**: `Object` - WalletConnection instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+connect"></a>

####### connect
**Type Sig:** WalletConnection.connect(onMessage) ⇒ `void`
Connect

**Kind**: instance abstract method of [`exports.WalletConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection)  
**rtype**: `(onMessage: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| onMessage | `function` | Message handler |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+disconnect"></a>

####### disconnect
**Type Sig:** WalletConnection.disconnect() ⇒ `void`
Disconnect

**Kind**: instance abstract method of [`exports.WalletConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+sendMessage"></a>

####### sendMessage
**Type Sig:** WalletConnection.sendMessage(msg) ⇒ `void`
Send message

**Kind**: instance abstract method of [`exports.WalletConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection)  
**rtype**: `(msg: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+isConnected"></a>

####### isConnected
**Type Sig:** WalletConnection.isConnected() ⇒ `Boolean`
Check if connected

**Kind**: instance abstract method of [`exports.WalletConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection)  
**Returns**: `Boolean` - Is connected  
**rtype**: `() => Boolean`
,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge"></a>

#### utils/aepp-wallet-communication/content-script-bridge
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge 

Content Script Bridge module

**Example**  
```js
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/wallet-communication/content-script-bridge
```


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge"></a>

##### ContentScriptBridge

**Type Sig:** ContentScriptBridge(params) ⇒ `ContentScriptBridge` 

ContentScriptBridge stamp
Provide functionality to easly redirect messages from page to extension and from extension to page through content script
Using Runtime(Extension) and WindowPostMessage(Web-Page) connections

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| params | `Object` | Initializer object |
| params.pageConnection | `Object` | Page connection object(@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message) |
| params.extConnection | `Object` | Extension connection object(module: @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime) |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge+run"></a>

###### run
**Type Sig:** ContentScriptBridge.run() ⇒ `void`
Start message proxy

**Kind**: instance method of [`exports.ContentScriptBridge`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge)  
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge+stop"></a>

###### stop
**Type Sig:** ContentScriptBridge.stop() ⇒ `void`
Stop message proxy

**Kind**: instance method of [`exports.ContentScriptBridge`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge)  
,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector"></a>

#### utils/aepp-wallet-communication/wallet-detector
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector 

Wallet Detector

This is the complement to [module:@aeternity/aepp-sdk/es/utils](module:@aeternity/aepp-sdk/es/utils).

**Example**  
```js
import WalletDetector from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector'
```


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector"></a>

##### WalletDetector

**Type Sig:** WalletDetector(params) ⇒ `WalletDetector` 

WalletDetector stamp

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | `Object` | <code>{}</code> | Initializer object |
| params.connection | `WalletConnection` |  | Connection for listening for wallets |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+scan"></a>

###### scan
**Type Sig:** WalletDetector.scan(onDetected) ⇒ `void`
Start scanning

**Kind**: instance method of [`exports.WalletDetector`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector)  

| Param | Type | Description |
| --- | --- | --- |
| onDetected | `function` | Call-back function which trigger on new wallet |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+stopScan"></a>

###### stopScan
**Type Sig:** WalletDetector.stopScan() ⇒ `void`
Stop scanning

**Kind**: instance method of [`exports.WalletDetector`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector)  
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+getWallets"></a>

###### getWallets
**Type Sig:** WalletDetector.getWallets() ⇒ `Array`
Get wallet list

**Kind**: instance method of [`exports.WalletDetector`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector)  
**Returns**: `Array` - Available wallets  
,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime"></a>

#### utils/aepp-wallet-communication/connection/browser-runtime
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime 

Browser runtime connector module

This is the complement to [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection).

**Example**  
```js
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'
```
<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection"></a>

##### BrowserRuntimeConnection

**Type Sig:** BrowserRuntimeConnection(params) ⇒ `Object` 

BrowserRuntimeConnection stamp
Handle browser runtime communication

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | `Object` | <code>{}</code> | Initializer object |
| params.port | `Object` |  | Runtime `port` object |
| [params.connectionInfo] | `Object` | <code>{}</code> | Connection info object |
| [params.debug] | `Boolean` | <code>false</code> | Debug flag |

,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message"></a>

##### utils/aepp-wallet-communication/connection/browser-window-message
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message 

Browser window Post Message connector module

This is the complement to [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection).

**Example**  
```js
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'
```
<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection"></a>

###### BrowserWindowMessageConnection

**Type Sig:** BrowserWindowMessageConnection([params]) ⇒ `Object` 

BrowserWindowMessageConnection

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | `Object` | <code>{}</code> | Initializer object |
| [params.target] | `Object` | <code>window.parent</code> | Target window for message |
| [params.self] | `Object` | <code>window</code> | Host window for message |
| [params.origin] | `Object` |  | Origin of receiver |
| [params.sendDirection] | `Object` |  | Optional field for wrapping messages in additional structure({ type: 'to_aepp' || 'to_waellet', data }).Used for handling messages netween content script and page |
| [params.receiveDirection] | `Object` | <code>&#x27;to_aepp&#x27;</code> | Optional(default: 'to_aepp') field for unwrapping messages from additional structure({ type: 'to_aepp' || 'to_waellet', data }).Used for handling messages netween content script and page |
| [params.connectionInfo] | `Object` | <code>{}</code> | Connection info object |
| [params.debug] | `Boolean` | <code>false</code> | Debug flag |

,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc"></a>

##### utils/aepp-wallet-communication/rpc/aepp-rpc
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc 

RPC handler for AEPP side

**Example**  
```js
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
```


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc"></a>

###### AeppRpc

**Type Sig:** AeppRpc(param, onAddressChange, onDisconnect, onNetworkChange, connection) ⇒ `Object` 

Contain functionality for wallet interaction and connect it to sdk

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Description |
| --- | --- | --- |
| param | `Object` | Init params object |
| [param.name] | `String` | Aepp name |
| onAddressChange | `function` | Call-back function for update address event |
| onDisconnect | `function` | Call-back function for disconnect event |
| onNetworkChange | `function` | Call-back function for update network event |
| connection | `Object` | Wallet connection object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc+connectToWallet"></a>

####### connectToWallet
**Type Sig:** AeppRpc.connectToWallet(connection) ⇒ `void`
Connect to wallet

**Kind**: instance method of [`exports.AeppRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc)  
**rtype**: `(connection: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| connection | `Object` | Wallet connection object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc+disconnectWallet"></a>

####### disconnectWallet
**Type Sig:** AeppRpc.disconnectWallet(sendDisconnect) ⇒ `void`
Disconnect from wallet

**Kind**: instance method of [`exports.AeppRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc)  
**rtype**: `(force: Boolean = false) => void`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sendDisconnect | `Boolean` | <code>false</code> | Force sending close connection message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc+askAddresses"></a>

####### askAddresses
**Type Sig:** AeppRpc.askAddresses() ⇒ `Promise`
Ask address from wallet

**Kind**: instance method of [`exports.AeppRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc)  
**Returns**: `Promise` - Address from wallet  
**rtype**: `() => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc+subscribeAddress"></a>

####### subscribeAddress
**Type Sig:** AeppRpc.subscribeAddress(type, value) ⇒ `Promise`
Subscribe for addresses from wallet

**Kind**: instance method of [`exports.AeppRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc)  
**Returns**: `Promise` - Address from wallet  
**rtype**: `(type: String, value: String) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Type of subscription can be one of ['current'(just for selected account updates), 'connected(all accounts)'] |
| value | `String` | Subscription action('subscribe'|'unsubscribe') |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc+signTransaction"></a>

####### signTransaction
**Type Sig:** AeppRpc.signTransaction() ⇒ `Promise.&lt;String&gt;`
Overwriting of `signTransaction` AE method
All sdk API which use it will be send notification to wallet and wait for callBack

**Kind**: instance method of [`exports.AeppRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc)  
**Returns**: `Promise.&lt;String&gt;` - Signed transaction  
**rtype**: `(tx: String, options = {}) => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc+signMessage"></a>

####### signMessage
**Type Sig:** AeppRpc.signMessage() ⇒ `Promise.&lt;String&gt;`
Overwriting of `signMessage` AE method
All sdk API which use it will be send notification to wallet and wait for callBack

**Kind**: instance method of [`exports.AeppRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc)  
**Returns**: `Promise.&lt;String&gt;` - Signed transaction  
**rtype**: `(msg: String, options = {}) => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc+sendConnectRequest"></a>

####### sendConnectRequest
**Type Sig:** AeppRpc.sendConnectRequest() ⇒ `Promise`
Send connection request to wallet

**Kind**: instance method of [`exports.AeppRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc)  
**Returns**: `Promise` - Connection response  
**rtype**: `() => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc+send"></a>

####### send
**Type Sig:** AeppRpc.send(tx, [options]) ⇒ `Promise.&lt;Object&gt;`
Overwriting of `send` AE method
All sdk API which use it will be send notification to wallet and wait for callBack
This method will sign, broadcast and wait until transaction will be accepted using rpc communication with wallet

**Kind**: instance method of [`exports.AeppRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--exports.AeppRpc)  
**Returns**: `Promise.&lt;Object&gt;` - Transaction broadcast result  
**rtype**: `(tx: String, options = {}) => Promise`

| Param | Type | Default |
| --- | --- | --- |
| tx | `String` |  | 
| [options] | `Object` | <code>{}</code> | 
| [options.walletBroadcast] | `Object` | <code>true</code> | 

,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client"></a>

##### utils/aepp-wallet-communication/rpc/rpc-client
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client 

RPC client helpers

**Example**  
```js
import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
```
**Example**  
```js
import RpcClients from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
```

        
        

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient"></a>

###### RpcClient

**Type Sig:** RpcClient(param) ⇒ `Object` 

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

####### addClient
**Type Sig:** RpcClient.addClient(id, connectionData) ⇒ `void`
Add new client

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(id: (String|Number), connectionInfo: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |
| connectionData | `Object` | Object containing `connectionInfo` and `connection` objects |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getClient"></a>

####### getClient
**Type Sig:** RpcClient.getClient(id) ⇒ `Object`
Get clien by id

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Object` - RpcClient  
**rtype**: `(id: (String|Number)) => Object`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+removeClient"></a>

####### removeClient
**Type Sig:** RpcClient.removeClient(id, forceConnectionClose) ⇒ `Boolean`
Remove and disiconnect client by ID

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(id: (String|Number), { forceConnectionClose: boolean = false }) => boolean`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |
| forceConnectionClose |  |  |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateClientInfo"></a>

####### updateClientInfo
**Type Sig:** RpcClient.updateClientInfo(id, info) ⇒ `void`
Update client info by id

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(id: (String|Number), info: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| id | `String` \| `Number` | Client ID |
| info | `Object` | Info to update (will be merged with current info object) |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+sendNotificationByCondition"></a>

####### sendNotificationByCondition
**Type Sig:** RpcClient.sendNotificationByCondition(msg, condition, transformMessage) ⇒ `void`
Send notification to all client passing condition

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(msg: Object, condition: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Msg object |
| condition | `function` | Condition function of (client: RpcClient) => Boolean |
| transformMessage |  |  |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+operationByCondition"></a>

####### operationByCondition
**Type Sig:** RpcClient.operationByCondition(condition, operation) ⇒ `void`
Call provided function for each rpc client which by condition

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(condition: Function, operation: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| condition | `function` | Condition function of (client: RpcClient) => Boolean |
| operation | `function` | Operation function of (client: RpcClient) => void |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+hasAccessToAccount"></a>

####### hasAccessToAccount
**Type Sig:** RpcClient.hasAccessToAccount(address) ⇒ `Boolean`
Check if aepp has access to account

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Boolean` - is connected  
**rtype**: `(address: String) => Boolean`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Account address |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+isConnected"></a>

####### isConnected
**Type Sig:** RpcClient.isConnected() ⇒ `Boolean`
Check if is connected

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Boolean` - is connected  
**rtype**: `() => Boolean`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+getCurrentAccount"></a>

####### getCurrentAccount
**Type Sig:** RpcClient.getCurrentAccount(options) ⇒ `String`
Get selected account

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `({ onAccount } = {}) => String`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+disconnect"></a>

####### disconnect
**Type Sig:** RpcClient.disconnect() ⇒ `void`
Disconnect

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+updateSubscription"></a>

####### updateSubscription
**Type Sig:** RpcClient.updateSubscription(type, value) ⇒ `Array.&lt;String&gt;`
Update subscription

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(type: String, value: String) => void`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Subscription type |
| value | `String` | Subscription value |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+addAction"></a>

####### addAction
**Type Sig:** RpcClient.addAction(action, resolvers) ⇒ `Object`
Add new action to actions

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(action: Object, [r: Function, j: Function]) => Object`

| Param | Type | Description |
| --- | --- | --- |
| action | `Object` | Action object |
| resolvers | `Array.&lt;function()&gt;` | Array with two function [resolve, reject] action |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+request"></a>

####### request
**Type Sig:** RpcClient.request(name, params) ⇒ `Promise`
Make a request

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**Returns**: `Promise` - Promise which will be resolved after receiving response message  
**rtype**: `(name: String, params: Object) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Method name |
| params | `Object` | Method params |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient+processResponse"></a>

####### processResponse
**Type Sig:** RpcClient.processResponse(msg, [transformResult]) ⇒ `void`
Process response message

**Kind**: instance method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `(msg: Object, transformResult: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message object |
| [transformResult] | `function` | Optional parser function for message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient.RpcClients"></a>

####### RpcClients
**Type Sig:** RpcClient.RpcClients() ⇒ `Object`
Contain functionality for managing multiple RPC clients (RpcClient stamp)

**Kind**: static method of [`exports.RpcClient`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--exports.RpcClient)  
**rtype**: `Stamp`
,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc"></a>

##### utils/aepp-wallet-communication/rpc/wallet-rpc
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc 

RPC handler for WAELLET side

**Example**  
```js
import WalletRpc from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc'
```


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc"></a>

###### WalletRpc

**Type Sig:** WalletRpc(param, onConnection, onSubscription, onSign, onAskAccounts, onMessageSign, onDisconnect) ⇒ `Object` 

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

####### getClients
**Type Sig:** WalletRpc.getClients() ⇒ `Object`
Get RpcClients object which contain all connected AEPPS

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**rtype**: `() => Object`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+removeRpcClient"></a>

####### removeRpcClient
**Type Sig:** WalletRpc.removeRpcClient(id, [opt]) ⇒ `Object`
Remove specific RpcClient by ID

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**rtype**: `(id: string) => Boolean`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | `String` |  | Client ID |
| [opt] | `Object` | <code>{}</code> |  |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+addRpcClient"></a>

####### addRpcClient
**Type Sig:** WalletRpc.addRpcClient(clientConnection) ⇒ `String`
Add new AEPP connection

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**Returns**: `String` - Client ID  
**rtype**: `(clientConnection: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| clientConnection | `Object` | AEPP connection object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+shareWalletInfo"></a>

####### shareWalletInfo
**Type Sig:** WalletRpc.shareWalletInfo(postFn) ⇒ `void`
Share wallet info
Send shareWalletInfo message to notify AEPP about wallet

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**rtype**: `(postFn: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| postFn | `function` | Send message function like `(msg) => void` |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+getWalletInfo"></a>

####### getWalletInfo
**Type Sig:** WalletRpc.getWalletInfo() ⇒ `Object`
Get Wallet info object

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**Returns**: `Object` - Object with wallet information(id, name, network, ...)  
**rtype**: `() => Object`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc+getAccounts"></a>

####### getAccounts
**Type Sig:** WalletRpc.getAccounts() ⇒ `Object`
Get Wallet accounts

**Kind**: instance method of [`exports.WalletRpc`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--exports.WalletRpc)  
**Returns**: `Object` - Object with accounts information({ connected: Object, current: Object })  
**rtype**: `() => Object`
,
