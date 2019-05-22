<a id="module_@aeternity/aepp-sdk/es/ae"></a>

## @aeternity/aepp-sdk/es/ae
Ae module

**Example**  
```js
import Ae from '@aeternity/aepp-sdk/es/ae'
```

* [@aeternity/aepp-sdk/es/ae](#module_@aeternity/aepp-sdk/es/ae)
    * [Ae([options])](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) ⇒ `Object` ⏏
        * [.destroyInstance()](#module_@aeternity/aepp-sdk/es/ae--Ae+destroyInstance) ⇒ `void`
        * _async_
            * [.send(tx, [options])](#module_@aeternity/aepp-sdk/es/ae--Ae+send) ⇒ `String` \| `String`
            * [.spend(amount, recipientId, options)](#module_@aeternity/aepp-sdk/es/ae--Ae+spend) ⇒ `String` \| `String`
            * [.transferFunds(percentage, recipientId, options)](#module_@aeternity/aepp-sdk/es/ae--Ae+transferFunds) ⇒ `String` \| `String`

<a id="exp_module_@aeternity/aepp-sdk/es/ae--Ae"></a>

### Ae([options]) ⇒ `Object` ⏏
Basic Ae Stamp

Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

Ae objects are the composition of three basic building blocks:
* [Tx](#exp_module_@aeternity/aepp-sdk/es/tx--Tx)
* [Account](#exp_module_@aeternity/aepp-sdk/es/account--Account)
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

#### ae.destroyInstance() ⇒ `void`
Remove all listeners for RPC

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
<a id="module_@aeternity/aepp-sdk/es/ae--Ae+send"></a>

#### ae.send(tx, [options]) ⇒ `String` \| `String`
Sign and post a transaction to the chain

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `String` \| `String` - Transaction or transaction hash  
**Category**: async  
**rtype**: `(tx: String, options: Object) => Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| tx | `String` |  | Transaction |
| [options] | `Object` | <code>{}</code> | options - Options |
| [options.verify] | `Object` |  | verify - Verify transaction before broadcast, throw error if not valid |

<a id="module_@aeternity/aepp-sdk/es/ae--Ae+spend"></a>

#### ae.spend(amount, recipientId, options) ⇒ `String` \| `String`
Send tokens to another account

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `String` \| `String` - Transaction or transaction hash  
**Category**: async  
**rtype**: `(amount: Number|String, recipientId: String, options?: Object) => Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| amount | `Number` \| `String` | Amount to spend |
| recipientId | `String` | Address of recipient account |
| options | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/ae--Ae+transferFunds"></a>

#### ae.transferFunds(percentage, recipientId, options) ⇒ `String` \| `String`
Send a percentage of funds to another account

**Kind**: instance method of [`Ae`](#exp_module_@aeternity/aepp-sdk/es/ae--Ae)  
**Returns**: `String` \| `String` - Transaction or transaction hash  
**Category**: async  
**rtype**: `(percentage: Number|String, recipientId: String, options?: Object) => Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| percentage | `Number` \| `String` | Percentage of amount to spend |
| recipientId | `String` | Address of recipient account |
| options | `Object` | Options |

