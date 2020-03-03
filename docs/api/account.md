<a id="module_@aeternity/aepp-sdk/es/account"></a>

## @aeternity/aepp-sdk/es/account
Account module

**Example**  
```js
import Account from '@aeternity/aepp-sdk/es/account'
```

* [@aeternity/aepp-sdk/es/account](#module_@aeternity/aepp-sdk/es/account)
    * [Account([options])](#exp_module_@aeternity/aepp-sdk/es/account--Account) ⇒ `Object` ⏏
        * [.signTransaction(tx, opt)](#module_@aeternity/aepp-sdk/es/account--Account+signTransaction) ⇒ `String`
        * [.signMessage(message, opt)](#module_@aeternity/aepp-sdk/es/account--Account+signMessage) ⇒ `String`
        * [.verifyMessage(message, signature, opt)](#module_@aeternity/aepp-sdk/es/account--Account+verifyMessage) ⇒ `Boolean`
        * *[.sign(data)](#module_@aeternity/aepp-sdk/es/account--Account+sign) ⇒ `String`*
        * *[.address()](#module_@aeternity/aepp-sdk/es/account--Account+address) ⇒ `String`*

<a id="exp_module_@aeternity/aepp-sdk/es/account--Account"></a>

### Account([options]) ⇒ `Object` ⏏
Basic Account Stamp

Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

Account is one of the three basic building blocks of an
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) client and provides access to a
signing key pair.

**Kind**: Exported function  
**Returns**: `Object` - Account instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| options.networkId | `String` |  | NETWORK_ID using for signing transaction's |

<a id="module_@aeternity/aepp-sdk/es/account--Account+signTransaction"></a>

#### account.signTransaction(tx, opt) ⇒ `String`
Sign encoded transaction

**Kind**: instance method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Returns**: `String` - Signed transaction  
**Category**: async  
**rtype**: `(tx: String) => tx: Promise[String], throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| tx | `String` | Transaction to sign |
| opt | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/account--Account+signMessage"></a>

#### account.signMessage(message, opt) ⇒ `String`
Sign message

**Kind**: instance method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Returns**: `String` - Signature  
**Category**: async  
**rtype**: `(msg: String) => signature: Promise[String], throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| message | `String` | Message to sign |
| opt | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/account--Account+verifyMessage"></a>

#### account.verifyMessage(message, signature, opt) ⇒ `Boolean`
Verify message

**Kind**: instance method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Category**: async  
**rtype**: `(msg: String, signature: String, publicKey: String) => signature: Promise[String], throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| message | `String` | Message to verify |
| signature | `String` | Signature |
| opt | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/account--Account+sign"></a>

#### *account.sign(data) ⇒ `String`*
Sign data blob

**Kind**: instance abstract method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Returns**: `String` - Signed data blob  
**Category**: async  
**rtype**: `(data: String) => data: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| data | `String` | Data blob to sign |

<a id="module_@aeternity/aepp-sdk/es/account--Account+address"></a>

#### *account.address() ⇒ `String`*
Obtain account address

**Kind**: instance abstract method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Returns**: `String` - Public account address  
**Category**: async  
**rtype**: `() => address: Promise[String]`
