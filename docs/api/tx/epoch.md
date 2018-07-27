<a id="module_@aeternity/aepp-sdk/es/tx/epoch"></a>

## @aeternity/aepp-sdk/es/tx/epoch
Epoch Tx module

**Export**: EpochTx  
**Example**  
```js
import EpochTx from '@aeternity/aepp-sdk/es/tx/epoch'
```
<a id="exp_module_@aeternity/aepp-sdk/es/tx/epoch--EpochTx"></a>

### EpochTx([options]) ⇒ `Object` ⏏
Epoch-based Tx Stamp

This implementation of [Tx](#exp_module_@aeternity/aepp-sdk/es/tx--Tx) relays
the creation of transactions to [Epoch](#exp_module_@aeternity/aepp-sdk/es/epoch--Epoch).
As there is no built-in security between Epoch and client communication, it
must never be used for production but can be very useful to verify other
implementations.

**Kind**: Exported function  
**Returns**: `Object` - Tx instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

**Example**  
```js
EpochTx({url: 'https://sdk-testnet.aepps.com/'})
```
