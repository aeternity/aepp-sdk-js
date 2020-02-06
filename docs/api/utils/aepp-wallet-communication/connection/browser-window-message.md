<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message"></a>

## @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message
Browser window Post Message connector module

This is the complement to [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection).

**Example**  
```js
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message)
    * [exports.BrowserWindowMessageConnection([params])](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection) ⇒ `Object` ⏏
        * [.connect(onMessage)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection+connect) ⇒ `void`
        * [.disconnect()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection+disconnect) ⇒ `void`
        * [.sendMessage(msg)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection+sendMessage) ⇒ `void`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection"></a>

### exports.BrowserWindowMessageConnection([params]) ⇒ `Object` ⏏
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

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection+connect"></a>

#### exports.BrowserWindowMessageConnection.connect(onMessage) ⇒ `void`
Connect

**Kind**: instance method of [`exports.BrowserWindowMessageConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection)  
**rtype**: `(onMessage: Function) => void`

| Param | Type | Description |
| --- | --- | --- |
| onMessage | `function` | Message handler |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection+disconnect"></a>

#### exports.BrowserWindowMessageConnection.disconnect() ⇒ `void`
Disconnect

**Kind**: instance method of [`exports.BrowserWindowMessageConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection)  
**rtype**: `() => void`
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection+sendMessage"></a>

#### exports.BrowserWindowMessageConnection.sendMessage(msg) ⇒ `void`
Send message

**Kind**: instance method of [`exports.BrowserWindowMessageConnection`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message--exports.BrowserWindowMessageConnection)  
**rtype**: `(msg: Object) => void`

| Param | Type | Description |
| --- | --- | --- |
| msg | `Object` | Message |

