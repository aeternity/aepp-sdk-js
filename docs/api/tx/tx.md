<a id="module_@aeternity/aepp-sdk/es/tx/tx"></a>

## @aeternity/aepp-sdk/es/tx/tx
Transaction module

**Export**: Transaction  
**Example**  
```js
import Transaction from '@aeternity/aepp-sdk/es/tx/tx'
```
<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction"></a>

### Transaction([options]) ⇒ `Object` ⏏
Transaction Stamp

This implementation of [Tx](#exp_module_@aeternity/aepp-sdk/es/tx--Tx) relays
the creation of transactions to [Epoch](#exp_module_@aeternity/aepp-sdk/es/epoch--Epoch).
As there is no built-in security between Epoch and client communication, it
must never be used for production but can be very useful to verify other
implementations.

**Kind**: Exported function  
**Returns**: `Object` - Transaction instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

**Example**  
```js
Transaction({url: 'https://sdk-testnet.aepps.com/'})
```
