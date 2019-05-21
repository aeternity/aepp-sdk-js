<a id="module_@aeternity/aepp-sdk/es/tx/validator"></a>

## @aeternity/aepp-sdk/es/tx/validator
Transaction validator

**Example**  
```js
import TransactionValidator from '@aeternity/aepp-sdk/es/tx/validator'
```

* [@aeternity/aepp-sdk/es/tx/validator](#module_@aeternity/aepp-sdk/es/tx/validator)
    * [unpackAndVerify(txHash, [options])](#exp_module_@aeternity/aepp-sdk/es/tx/validator--unpackAndVerify) ⇒ `Promise.&lt;Object&gt;` ⏏
    * [verifyTx([data], networkId)](#exp_module_@aeternity/aepp-sdk/es/tx/validator--verifyTx) ⇒ `Promise.&lt;Array&gt;` ⏏
    * [TransactionValidator([options])](#exp_module_@aeternity/aepp-sdk/es/tx/validator--TransactionValidator) ⇒ `Object` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/tx/validator--unpackAndVerify"></a>

### unpackAndVerify(txHash, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Unpack and verify transaction (verify nonce, ttl, fee, signature, account balance)

**Kind**: Exported function  
**Returns**: `Promise.&lt;Object&gt;` - Object with verification errors and warnings  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| txHash | `String` |  | Base64Check transaction hash |
| [options] | `Object` | <code>{}</code> | Options |
| [options.networkId] | `String` |  | networkId Use in signature verification |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/validator--verifyTx"></a>

### verifyTx([data], networkId) ⇒ `Promise.&lt;Array&gt;` ⏏
Verify transaction (verify nonce, ttl, fee, signature, account balance)

**Kind**: Exported function  
**Returns**: `Promise.&lt;Array&gt;` - Object with verification errors and warnings  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [data] | `Object` | <code>{}</code> | data TX data object |
| [data.tx] | `String` |  | tx Transaction hash |
| [data.signatures] | `Array` |  | signatures Transaction signature's |
| [data.rlpEncoded] | `Array` |  | rlpEncoded RLP encoded transaction |
| networkId | `String` |  | networkId Use in signature verification |

<a id="exp_module_@aeternity/aepp-sdk/es/tx/validator--TransactionValidator"></a>

### TransactionValidator([options]) ⇒ `Object` ⏏
Transaction Validator Stamp
This stamp give us possibility to unpack and validate some of transaction properties,
to make sure we can post it to the chain

**Kind**: Exported function  
**Returns**: `Object` - Transaction Validator instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.url] | `Object` |  | Node url |
| [options.internalUrl] | `Object` |  | Node internal url |

**Example**  
```js
TransactionValidator({url: 'https://sdk-testnet.aepps.com'})
```
