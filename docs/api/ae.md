<a id="module_@aeternity/aepp-sdk/es/ae"></a>

### @aeternity/aepp-sdk/es/ae
Ae module

**Example**  
```js
import { Ae } from '@aeternity/aepp-sdk'
```

* [@aeternity/aepp-sdk/es/ae](#module_@aeternity/aepp-sdk/es/ae)
    * [Ae([options])](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) ⇒ `Object` ⏏
        * [.destroyInstance()](#module_@aeternity/aepp-sdk/es/ae--Ae+destroyInstance) ⇒ `void`
        * _async_
            * [.send(tx, [options])](#module_@aeternity/aepp-sdk/es/ae--Ae+send) ⇒ `Object`
            * [.spend(amount, recipientIdOrName, [options])](#module_@aeternity/aepp-sdk/es/ae--Ae+spend) ⇒ `Object`
            * [.transferFunds(fraction, recipientIdOrName, [options])](#module_@aeternity/aepp-sdk/es/ae--Ae+transferFunds) ⇒ `Object`

<a id="exp_module_@aeternity/aepp-sdk/es/ae--Ae"></a>

#### Ae([options]) ⇒ `Object` ⏏
Basic Ae Stamp

Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

Ae objects are the composition of three basic building blocks:
* [Tx](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)
* [module:@aeternity/aepp-sdk/es/account--Account](module:@aeternity/aepp-sdk/es/account--Account)
* [Chain](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)
Only by providing the joint functionality of those three, most more advanced
operations, i.e. the ones with actual use value on the chain, become
available.

**Kind**: Exported function  
**Returns**: `Object` - Ae instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="module_@aeternity/aepp-sdk/es/ae--Ae+destroyInstance"></a>

##### ae.destroyInstance() ⇒ `void`
Remove all listeners for RPC

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
<a id="module_@aeternity/aepp-sdk/es/ae--Ae+send"></a>

##### ae.send(tx, [options]) ⇒ `Object`
Sign and post a transaction to the chain

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(tx: String, options: Object) => Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| tx | `String` |  | Transaction |
| [options] | `Object` | <code>{}</code> | options - Options |
| [options.verify] | `Object` |  | verify - Verify transaction before broadcast, throw error if not valid |

<a id="module_@aeternity/aepp-sdk/es/ae--Ae+spend"></a>

##### ae.spend(amount, recipientIdOrName, [options]) ⇒ `Object`
Send tokens to another account

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(amount: Number|String, recipientIdOrName: String, options?: Object) => Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| amount | `Number` \| `String` | Amount to spend |
| recipientIdOrName | `String` | Address or name of recipient account |
| [options] | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/ae--Ae+transferFunds"></a>

##### ae.transferFunds(fraction, recipientIdOrName, [options]) ⇒ `Object`
Send a fraction of token balance to another account

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(fraction: Number|String, recipientIdOrName: String, options?: Object) => Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| fraction | `Number` \| `String` | Fraction of balance to spend (between 0 and 1) |
| recipientIdOrName | `String` | Address or name of recipient account |
| [options] | `Object` | Options |

