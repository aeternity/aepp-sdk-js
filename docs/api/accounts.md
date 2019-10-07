<a id="module_@aeternity/aepp-sdk/es/accounts"></a>

## @aeternity/aepp-sdk/es/accounts
Accounts module

**Example**  
```js
import Accounts from '@aeternity/aepp-sdk/es/accounts'
```

* [@aeternity/aepp-sdk/es/accounts](#module_@aeternity/aepp-sdk/es/accounts)
    * ~~[setKeypair(keypair)](#exp_module_@aeternity/aepp-sdk/es/accounts--setKeypair) ⇒ `Void` ⏏~~
    * [removeAccount(address)](#exp_module_@aeternity/aepp-sdk/es/accounts--removeAccount) ⇒ `Void` ⏏
    * [addresses()](#exp_module_@aeternity/aepp-sdk/es/accounts--addresses) ⇒ `Array.&lt;String&gt;` ⏏
    * [Accounts([options])](#exp_module_@aeternity/aepp-sdk/es/accounts--Accounts) ⇒ `Object` ⏏
    * _async_
        * [signWith(address, data)](#exp_module_@aeternity/aepp-sdk/es/accounts--signWith) ⇒ `String` ⏏
        * [addAccount(account, [options])](#exp_module_@aeternity/aepp-sdk/es/accounts--addAccount) ⇒ `Void` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/accounts--setKeypair"></a>

### ~~setKeypair(keypair) ⇒ `Void` ⏏~~
***Deprecated***

Select specific account

**Kind**: Exported function  
**rtype**: `(keypair: {publicKey: String, secretKey: String}) => Void`

| Param | Type | Description |
| --- | --- | --- |
| keypair | `Object` | Key pair to use |
| keypair.publicKey | `String` | Public key |
| keypair.secretKey | `String` | Private key |

**Example**  
```js
setKeypair(keypair)
```
<a id="exp_module_@aeternity/aepp-sdk/es/accounts--removeAccount"></a>

### removeAccount(address) ⇒ `Void` ⏏
Remove specific account

**Kind**: Exported function  
**rtype**: `(address: String) => Void`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Address of account to remove |

**Example**  
```js
removeAccount(address)
```
<a id="exp_module_@aeternity/aepp-sdk/es/accounts--addresses"></a>

### addresses() ⇒ `Array.&lt;String&gt;` ⏏
Get accounts addresses

**Kind**: Exported function  
**rtype**: `() => String[]`
**Example**  
```js
addresses()
```
<a id="exp_module_@aeternity/aepp-sdk/es/accounts--Accounts"></a>

### Accounts([options]) ⇒ `Object` ⏏
Accounts Stamp

The purpose of the Accounts Stamp is to wrap up
[Account](#exp_module_@aeternity/aepp-sdk/es/account--Account) objects and provide a
common interface to all of them. Accounts are a substantial part of
[Wallet](#exp_module_@aeternity/aepp-sdk/es/ae/wallet--Wallet)s.

**Kind**: Exported function  
**Returns**: `Object` - Accounts instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.accounts] | `Array` |  | Accounts array |

**Example**  
```js
const accounts = await Accounts({ accounts: [ MemmoryAccount({ keypair: 'keypair_object' }) ] })
await accounts.addAccount(account, { select: true }) // Add account and make it selected
accounts.removeAccount(address) // Remove account
accounts.selectAccount(address) // Select account
accounts.addresses() // Get available accounts
```
<a id="exp_module_@aeternity/aepp-sdk/es/accounts--signWith"></a>

### signWith(address, data) ⇒ `String` ⏏
Sign data blob with specific key

**Kind**: Exported function  
**Returns**: `String` - Signed data blob  
**Category**: async  
**rtype**: `(address: String, data: String) => data: Promise[String], throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Public key of account to sign with |
| data | `String` | Data blob to sign |

<a id="exp_module_@aeternity/aepp-sdk/es/accounts--addAccount"></a>

### addAccount(account, [options]) ⇒ `Void` ⏏
Add specific account

**Kind**: Exported function  
**Category**: async  
**rtype**: `(account: Account, { select: Boolean }) => Void`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| account | `Object` |  | Account instance |
| [options] | `Object` | <code>{}</code> | Options |
| [options.select] | `Boolean` |  | Select account |

**Example**  
```js
addAccount(account)
```
