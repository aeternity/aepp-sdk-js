<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime"></a>

## @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime
Browser runtime connector module

This is the complement to [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection).

**Example**  
```js
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime)
    * [exports.BrowserRuntimeConnection(params)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection) ⇒ `Object` ⏏
        * [.connect(onMessage, onDisconnect)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection+connect) ⇒ `void`
        * [.sendMessage(msg)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection+sendMessage) ⇒ `void`
        * [.isConnected()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection+isConnected) ⇒ `Boolean`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection"></a>

### exports.BrowserRuntimeConnection(params) ⇒ `Object` ⏏
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

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection+connect"></a>

#### exports.BrowserRuntimeConnection.connect(onMessage, onDisconnect) ⇒ `void`
Connect

**Kind**: instance method of [`exports.BrowserRuntimeConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection)  
**rtype**: `(onMessage: Function, onDisconnect: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| onMessage | `function` | Message handler |
| onDisconnect | `function` | trigger when runtime connection in closed |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection+sendMessage"></a>

#### exports.BrowserRuntimeConnection.sendMessage(msg) ⇒ `void`
Send message

**Kind**: instance method of [`exports.BrowserRuntimeConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection)  
**rtype**: `(msg: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection+isConnected"></a>

#### exports.BrowserRuntimeConnection.isConnected() ⇒ `Boolean`
Check if connected

**Kind**: instance method of [`exports.BrowserRuntimeConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime--exports.BrowserRuntimeConnection)  
**Returns**: `Boolean` - Is connected  
**rtype**: `() => Boolean`
