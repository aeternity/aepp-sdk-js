## Aepp Wallet Communication
 
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection"></a>

##### utils/aepp-wallet-communication/connection
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection 

Wallet Connection base module

**Example**  
```js
import WalletConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection'
```
<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--module.exports"></a>

###### exports
**Type Sig:** module.exports([options]) ⇒ `Object` 
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

,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge"></a>

#### utils/aepp-wallet-communication/content-script-bridge
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge 

Content Script Bridge module

**Example**  
```js
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/wallet-communication/content-script-bridge
```


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports"></a>

##### exports
**Type Sig:** module.exports(params) ⇒ `Object` 
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

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports+run"></a>

###### run
**Type Sig:** module.run() ⇒ `void`
Start message proxy

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports)  
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports+stop"></a>

###### stop
**Type Sig:** module.stop() ⇒ `void`
Stop message proxy

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports)  
,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector"></a>

#### utils/aepp-wallet-communication/wallet-detector
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector 

Wallet Detector

This is the complement to [module:@aeternity/aepp-sdk/es/utils](module:@aeternity/aepp-sdk/es/utils).


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--module.exports"></a>

##### exports
**Type Sig:** module.exports(params) ⇒ `WalletDetector` 
WalletDetector stamp

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | `Object` | <code>{}</code> | Initializer object |
| params.connection | `WalletConnection` |  | Connection for listening for wallets |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--module.exports+scan"></a>

###### scan
**Type Sig:** module.scan(onDetected) ⇒ `void`
Start scanning

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| onDetected | `function` | Call-back function which trigger on new wallet |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--module.exports+stopScan"></a>

###### stopScan
**Type Sig:** module.stopScan() ⇒ `void`
Stop scanning

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--module.exports)  
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
<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--module.exports"></a>

##### exports
**Type Sig:** module.exports(params) ⇒ `Object` 
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
<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--module.exports"></a>

###### exports
**Type Sig:** module.exports([params]) ⇒ `Object` 
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


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports"></a>

###### exports
**Type Sig:** module.exports(param, onAddressChange, onDisconnect, onNetworkChange, connection) ⇒ `Object` 
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

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+connectToWallet"></a>

####### connectToWallet
**Type Sig:** module.connectToWallet(connection) ⇒ `void`
Connect to wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**rtype**: `(connection: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| connection | `Object` | Wallet connection object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+disconnectWallet"></a>

####### disconnectWallet
**Type Sig:** module.disconnectWallet(sendDisconnect) ⇒ `void`
Disconnect from wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**rtype**: `(force: Boolean = false) => void`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sendDisconnect | `Boolean` | <code>false</code> | Force sending close connection message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+askAddresses"></a>

####### askAddresses
**Type Sig:** module.askAddresses() ⇒ `Promise`
Ask address from wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise` - Address from wallet  
**rtype**: `() => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+subscribeAddress"></a>

####### subscribeAddress
**Type Sig:** module.subscribeAddress(type, value) ⇒ `Promise`
Subscribe for addresses from wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise` - Address from wallet  
**rtype**: `(type: String, value: String) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Type of subscription can be one of ['current'(just for selected account updates), 'connected(all accounts)'] |
| value | `String` | Subscription action('subscribe'|'unsubscribe') |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+signTransaction"></a>

####### signTransaction
**Type Sig:** module.signTransaction() ⇒ `Promise.&lt;String&gt;`
Overwriting of `signTransaction` AE method
All sdk API which use it will be send notification to wallet and wait for callBack

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise.&lt;String&gt;` - Signed transaction  
**rtype**: `(tx: String, options = {}) => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+signMessage"></a>

####### signMessage
**Type Sig:** module.signMessage() ⇒ `Promise.&lt;String&gt;`
Overwriting of `signMessage` AE method
All sdk API which use it will be send notification to wallet and wait for callBack

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise.&lt;String&gt;` - Signed transaction  
**rtype**: `(msg: String, options = {}) => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+sendConnectRequest"></a>

####### sendConnectRequest
**Type Sig:** module.sendConnectRequest() ⇒ `Promise`
Send connection request to wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise` - Connection response  
**rtype**: `() => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+send"></a>

####### send
**Type Sig:** module.send(tx, [options]) ⇒ `Promise.&lt;Object&gt;`
Overwriting of `send` AE method
All sdk API which use it will be send notification to wallet and wait for callBack
This method will sign, broadcast and wait until transaction will be accepted using rpc communication with wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
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

RpcClient module

**Example**  
```js
import RpcClient from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client'
```


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports"></a>

###### exports
**Type Sig:** module.exports(param) ⇒ `Object` 
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

####### updateInfo
**Type Sig:** module.updateInfo(info) ⇒ `void`
Update info

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `(info: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| info | `Object` | Info to update (will be merged with current info object) |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+hasAccessToAccount"></a>

####### hasAccessToAccount
**Type Sig:** module.hasAccessToAccount(address) ⇒ `Boolean`
Check if aepp has access to account

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**Returns**: `Boolean` - is connected  
**rtype**: `(address: String) => Boolean`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Account address |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+isConnected"></a>

####### isConnected
**Type Sig:** module.isConnected() ⇒ `Boolean`
Check if is connected

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**Returns**: `Boolean` - is connected  
**rtype**: `() => Boolean`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+getCurrentAccount"></a>

####### getCurrentAccount
**Type Sig:** module.getCurrentAccount(options) ⇒ `String`
Get selected account

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `({ onAccount } = {}) => String`

| Param | Type | Description |
| --- | --- | --- |
| options | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+disconnect"></a>

####### disconnect
**Type Sig:** module.disconnect() ⇒ `void`
Disconnect

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+updateSubscription"></a>

####### updateSubscription
**Type Sig:** module.updateSubscription(type, value) ⇒ `Array.&lt;String&gt;`
Update subscription

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `(type: String, value: String) => void`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Subscription type |
| value | `String` | Subscription value |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+request"></a>

####### request
**Type Sig:** module.request(name, params) ⇒ `Promise`
Make a request

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**Returns**: `Promise` - Promise which will be resolved after receiving response message  
**rtype**: `(name: String, params: Object) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Method name |
| params | `Object` | Method params |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports+processResponse"></a>

####### processResponse
**Type Sig:** module.processResponse(msg, [transformResult]) ⇒ `void`
Process response message

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/rpc-client--module.exports)  
**rtype**: `(msg: Object, transformResult: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message object |
| [transformResult] | `function` | Optional parser function for message |

,
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc"></a>

##### utils/aepp-wallet-communication/rpc/wallet-rpc
**Module Path:** @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc 

RPC handler for WAELLET side

**Example**  
```js
import WalletRpc from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc'
```


<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports"></a>

###### exports
**Type Sig:** module.exports(param, onConnection, onSubscription, onSign, onAskAccounts, onMessageSign, onDisconnect) ⇒ `Object` 
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

####### removeRpcClient
**Type Sig:** module.removeRpcClient(id, [opt]) ⇒ `void`
Remove specific RpcClient by ID

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**rtype**: `(id: string) => void`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | `String` |  | Client ID |
| [opt] | `Object` | <code>{}</code> |  |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+addRpcClient"></a>

####### addRpcClient
**Type Sig:** module.addRpcClient(clientConnection) ⇒ `String`
Add new client by AEPP connection

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**Returns**: `String` - Client ID  
**rtype**: `(clientConnection: Object) => Object`

| Param | Type | Description |
| --- | --- | --- |
| clientConnection | `Object` | AEPP connection object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+shareWalletInfo"></a>

####### shareWalletInfo
**Type Sig:** module.shareWalletInfo(postFn) ⇒ `void`
Share wallet info
Send shareWalletInfo message to notify AEPP about wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**rtype**: `(postFn: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| postFn | `function` | Send message function like `(msg) => void` |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+getWalletInfo"></a>

####### getWalletInfo
**Type Sig:** module.getWalletInfo() ⇒ `Object`
Get Wallet info object

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**Returns**: `Object` - Object with wallet information(id, name, network, ...)  
**rtype**: `() => Object`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports+getAccounts"></a>

####### getAccounts
**Type Sig:** module.getAccounts() ⇒ `Object`
Get Wallet accounts

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc--module.exports)  
**Returns**: `Object` - Object with accounts information({ connected: Object, current: Object })  
**rtype**: `() => Object`
,
