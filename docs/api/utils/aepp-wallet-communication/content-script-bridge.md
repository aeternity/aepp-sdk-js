<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge"></a>

### @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge
Content Script Bridge module

**Example**  
```js
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/wallet-communication/content-script-bridge
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge)
    * [module.exports(params)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports) ⇒ `Object` ⏏
        * [.run()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports+run) ⇒ `void`
        * [.stop()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports+stop) ⇒ `void`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports"></a>

#### module.exports(params) ⇒ `Object` ⏏
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

##### module.exports.run() ⇒ `void`
Start message proxy

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports)  
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports+stop"></a>

##### module.exports.stop() ⇒ `void`
Stop message proxy

**Kind**: instance method of [`module.exports`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--module.exports)  
