<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector"></a>

### @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector
Wallet Detector

This is the complement to [module:@aeternity/aepp-sdk/es/utils](module:@aeternity/aepp-sdk/es/utils).

**Example**  
```js
import WalletDetector from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector'
```

* [@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector)
    * [exports.WalletDetector(params)](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector) ⇒ `WalletDetector` ⏏
        * [.scan(onDetected)](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+scan) ⇒ `void`
        * [.stopScan()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+stopScan) ⇒ `void`
        * [.getWallets()](#module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+getWallets) ⇒ `Array`

<a id="exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector"></a>

#### exports.WalletDetector(params) ⇒ `WalletDetector` ⏏
WalletDetector stamp

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| params | `Object` | <code>{}</code> | Initializer object |
| params.connection | `WalletConnection` |  | Connection for listening for wallets |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+scan"></a>

##### exports.WalletDetector.scan(onDetected) ⇒ `void`
Start scanning

**Kind**: instance method of [`exports.WalletDetector`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector)  

| Param | Type | Description |
| --- | --- | --- |
| onDetected | `function` | Call-back function which trigger on new wallet |

<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+stopScan"></a>

##### exports.WalletDetector.stopScan() ⇒ `void`
Stop scanning

**Kind**: instance method of [`exports.WalletDetector`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector)  
<a id="module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector+getWallets"></a>

##### exports.WalletDetector.getWallets() ⇒ `Array`
Get wallet list

**Kind**: instance method of [`exports.WalletDetector`](#exp_module_@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector--exports.WalletDetector)  
**Returns**: `Array` - Available wallets  
