<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection"></a>

## @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection
Wallet Connection base module

**Example**  
```js
import WalletConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection)
    * [exports.WalletConnection([options])](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection) ⇒ `Object` ⏏
        * *[.connect(onMessage)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+connect) ⇒ `void`*
        * *[.disconnect()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+disconnect) ⇒ `void`*
        * *[.sendMessage(msg)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+sendMessage) ⇒ `void`*
        * *[.isConnected()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+isConnected) ⇒ `Boolean`*

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection"></a>

### exports.WalletConnection([options]) ⇒ `Object` ⏏
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

#### *exports.WalletConnection.connect(onMessage) ⇒ `void`*
Connect

**Kind**: instance abstract method of [`exports.WalletConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection)  
**rtype**: `(onMessage: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| onMessage | `function` | Message handler |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+disconnect"></a>

#### *exports.WalletConnection.disconnect() ⇒ `void`*
Disconnect

**Kind**: instance abstract method of [`exports.WalletConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+sendMessage"></a>

#### *exports.WalletConnection.sendMessage(msg) ⇒ `void`*
Send message

**Kind**: instance abstract method of [`exports.WalletConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection)  
**rtype**: `(msg: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection+isConnected"></a>

#### *exports.WalletConnection.isConnected() ⇒ `Boolean`*
Check if connected

**Kind**: instance abstract method of [`exports.WalletConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection--exports.WalletConnection)  
**Returns**: `Boolean` - Is connected  
**rtype**: `() => Boolean`
