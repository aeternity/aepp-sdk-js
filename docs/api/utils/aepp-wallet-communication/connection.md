<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection"></a>

## @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection
Wallet Connection base module

**Example**  
```js
import WalletConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection)
    * *[.connect(onMessage)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection+connect) ⇒ `void`*
    * *[.disconnect()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection+disconnect) ⇒ `void`*
    * *[.sendMessage(msg)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection+sendMessage) ⇒ `void`*
    * *[.isConnected()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection+isConnected) ⇒ `Boolean`*

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection+connect"></a>

### *@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection.connect(onMessage) ⇒ `void`*
Connect

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection`](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection)  
**rtype**: `(onMessage: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| onMessage | `function` | Message handler |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection+disconnect"></a>

### *@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection.disconnect() ⇒ `void`*
Disconnect

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection`](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection+sendMessage"></a>

### *@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection.sendMessage(msg) ⇒ `void`*
Send message

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection`](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection)  
**rtype**: `(msg: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection+isConnected"></a>

### *@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection.isConnected() ⇒ `Boolean`*
Check if connected

**Kind**: instance abstract method of [`@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection`](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection)  
**Returns**: `Boolean` - Is connected  
**rtype**: `() => Boolean`
