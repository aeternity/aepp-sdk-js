<a id="module_@aeternity/aepp-sdk/es/tx/tx"></a>

## @aeternity/aepp-sdk/es/tx/tx
Transaction module

**Example**  
```js
import Transaction from '@aeternity/aepp-sdk/es/tx/tx'
```
<a id="exp_module_@aeternity/aepp-sdk/es/tx/tx--Transaction"></a>

### Transaction([options]) ⇒ `Object` ⏏
Transaction Stamp

This is implementation of [Tx](api/tx.md) relays
the creation of transactions to [module:@aeternity/aepp-sdk/es/Node](module:@aeternity/aepp-sdk/es/Node).
This stamp provide ability to create native transaction's,
or transaction's using Node API.
As there is no built-in security between Node and client communication,
creating transaction using [module:@aeternity/aepp-sdk/es/Node](module:@aeternity/aepp-sdk/es/Node) API
must never be used for production but can be very useful to verify other
implementations.

**Kind**: Exported function  
**Returns**: `Object` - Transaction instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.nativeMode] | `Boolean` | <code>true</code> | options.nativeMode - Use Native build of transaction's |
| options.url | `String` |  | Node url |
| options.internalUrl | `String` |  | Node internal url |

**Example**  
```js
Transaction({url: 'https://sdk-testnet.aepps.com/'})
```
