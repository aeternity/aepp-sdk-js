<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc"></a>

### @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
RPC handler for AEPP side

**Example**  
```js
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc)
    * [module.exports(param, onAddressChange, onDisconnect, onNetworkChange, connection)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports) ⇒ `Object` ⏏
        * [.connectToWallet(connection)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+connectToWallet) ⇒ `void`
        * [.disconnectWallet(sendDisconnect)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+disconnectWallet) ⇒ `void`
        * [.askAddresses()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+askAddresses) ⇒ `Promise`
        * [.subscribeAddress(type, value)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+subscribeAddress) ⇒ `Promise`
        * [.signTransaction()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+signTransaction) ⇒ `Promise.&lt;String&gt;`
        * [.signMessage()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+signMessage) ⇒ `Promise.&lt;String&gt;`
        * [.sendConnectRequest()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+sendConnectRequest) ⇒ `Promise`
        * [.send(tx, [options])](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+send) ⇒ `Promise.&lt;Object&gt;`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports"></a>

#### module.exports(param, onAddressChange, onDisconnect, onNetworkChange, connection) ⇒ `Object` ⏏
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

##### module.exports.connectToWallet(connection) ⇒ `void`
Connect to wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**rtype**: `(connection: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| connection | `Object` | Wallet connection object |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+disconnectWallet"></a>

##### module.exports.disconnectWallet(sendDisconnect) ⇒ `void`
Disconnect from wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**rtype**: `(force: Boolean = false) => void`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sendDisconnect | `Boolean` | <code>false</code> | Force sending close connection message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+askAddresses"></a>

##### module.exports.askAddresses() ⇒ `Promise`
Ask address from wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise` - Address from wallet  
**rtype**: `() => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+subscribeAddress"></a>

##### module.exports.subscribeAddress(type, value) ⇒ `Promise`
Subscribe for addresses from wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise` - Address from wallet  
**rtype**: `(type: String, value: String) => Promise`

| Param | Type | Description |
| --- | --- | --- |
| type | `String` | Type of subscription can be one of ['current'(just for selected account updates), 'connected(all accounts)'] |
| value | `String` | Subscription action('subscribe'|'unsubscribe') |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+signTransaction"></a>

##### module.exports.signTransaction() ⇒ `Promise.&lt;String&gt;`
Overwriting of `signTransaction` AE method
All sdk API which use it will be send notification to wallet and wait for callBack

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise.&lt;String&gt;` - Signed transaction  
**rtype**: `(tx: String, options = {}) => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+signMessage"></a>

##### module.exports.signMessage() ⇒ `Promise.&lt;String&gt;`
Overwriting of `signMessage` AE method
All sdk API which use it will be send notification to wallet and wait for callBack

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise.&lt;String&gt;` - Signed transaction  
**rtype**: `(msg: String, options = {}) => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+sendConnectRequest"></a>

##### module.exports.sendConnectRequest() ⇒ `Promise`
Send connection request to wallet

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports)  
**Returns**: `Promise` - Connection response  
**rtype**: `() => Promise`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc--module.exports+send"></a>

##### module.exports.send(tx, [options]) ⇒ `Promise.&lt;Object&gt;`
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

