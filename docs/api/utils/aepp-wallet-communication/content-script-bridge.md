<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge"></a>

## @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge
Content Script Bridge module

**Example**  
```js
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/wallet-communication/content-script-bridge
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge)
    * [exports.ContentScriptBridge(params)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge) ⇒ `ContentScriptBridge` ⏏
        * [.run()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge+run) ⇒ `void`
        * [.stop()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge+stop) ⇒ `void`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge"></a>

### exports.ContentScriptBridge(params) ⇒ `ContentScriptBridge` ⏏
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

#### exports.ContentScriptBridge.run() ⇒ `void`
Start message proxy

**Kind**: instance method of [`exports.ContentScriptBridge`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge)  
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge+stop"></a>

#### exports.ContentScriptBridge.stop() ⇒ `void`
Stop message proxy

**Kind**: instance method of [`exports.ContentScriptBridge`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge--exports.ContentScriptBridge)  
