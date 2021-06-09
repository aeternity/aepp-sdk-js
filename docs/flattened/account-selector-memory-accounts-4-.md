## account
 
<a id="module_@aeternity/aepp-sdk/es/account"></a>

### account
**Module Path:** @aeternity/aepp-sdk/es/account 

Account module

**Example**  
```js
import Account from '@aeternity/aepp-sdk/es/account'
```


<a id="exp_module_@aeternity/aepp-sdk/es/account--Account"></a>

#### Account

**Type Sig:** Account([options]) ⇒ `Object` 

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

##### signTransaction
**Type Sig:** account.signTransaction(tx, opt) ⇒ `String`
Sign encoded transaction

**Kind**: instance method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Returns**: `String` - Signed transaction  
**Category**: async  
**rtype**: `(tx: String) => tx: Promise[String], throws: Error`

| Param | Type | Description |
| --- | --- | --- |
| tx | `String` | Transaction to sign |
| opt | `Object` | Options |

<a id="module_@aeternity/aepp-sdk/es/account--Account+getNetworkId"></a>

##### getNetworkId
**Type Sig:** account.getNetworkId() ⇒ `String`
Get network Id

**Kind**: instance method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Returns**: `String` - Network Id  
**Category**: async  
**rtype**: `() => networkId: String`
<a id="module_@aeternity/aepp-sdk/es/account--Account+signMessage"></a>

##### signMessage
**Type Sig:** account.signMessage(message, opt) ⇒ `String`
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

##### verifyMessage
**Type Sig:** account.verifyMessage(message, signature, opt) ⇒ `Boolean`
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

##### sign
**Type Sig:** account.sign(data) ⇒ `String`
Sign data blob

**Kind**: instance abstract method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Returns**: `String` - Signed data blob  
**Category**: async  
**rtype**: `(data: String) => data: Promise[String]`

| Param | Type | Description |
| --- | --- | --- |
| data | `String` | Data blob to sign |

<a id="module_@aeternity/aepp-sdk/es/account--Account+address"></a>

##### address
**Type Sig:** account.address() ⇒ `String`
Obtain account address

**Kind**: instance abstract method of [`Account`](#exp_module_@aeternity/aepp-sdk/es/account--Account)  
**Returns**: `String` - Public account address  
**Category**: async  
**rtype**: `() => address: Promise[String]`
,
<a id="module_@aeternity/aepp-sdk/es/account/selector"></a>

### account/selector
**Module Path:** @aeternity/aepp-sdk/es/account/selector 

Accounts Selector module

This is the complement to [@aeternity/aepp-sdk/es/accounts](#module_@aeternity/aepp-sdk/es/accounts).

**Example**  
```js
import Selector from '@aeternity/aepp-sdk/es/account/selector'
```

    

<a id="exp_module_@aeternity/aepp-sdk/es/account/selector--Selector"></a>

#### Selector

**Type Sig:** Selector([options]) ⇒ `Account` 

Selector Stamp

**Kind**: Exported function  
**Returns**: `Account` - Account instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

**Example**  
```js
Selector()
```
<a id="exp_module_@aeternity/aepp-sdk/es/account/selector--selectAccount"></a>

#### selectAccount
**Type Sig:** selectAccount(address) 
Select specific account

**Kind**: instance method of [`@aeternity/aepp-sdk/es/account/selector`](#module_@aeternity/aepp-sdk/es/account/selector)  
**rtype**: `(address: String) => Void`

| Param | Type | Description |
| --- | --- | --- |
| address | `String` | Address of account to select |

**Example**  
```js
selectAccount('ak_xxxxxxxx')
```
,
<a id="module_@aeternity/aepp-sdk/es/account/memory"></a>

### account/memory
**Module Path:** @aeternity/aepp-sdk/es/account/memory 

Memory Account module

**Example**  
```js
import { MemoryAccount } from '@aeternity/aepp-sdk'
```
,
<a id="module_@aeternity/aepp-sdk/es/accounts"></a>

#### accounts
**Module Path:** @aeternity/aepp-sdk/es/accounts 

Accounts module

**Example**  
```js
import Accounts from '@aeternity/aepp-sdk/es/accounts'
```

    

<a id="exp_module_@aeternity/aepp-sdk/es/accounts--removeAccount"></a>

##### removeAccount

**Type Sig:** removeAccount(address) ⇒ `Void` 

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

##### addresses

**Type Sig:** addresses() ⇒ `Array.&lt;String&gt;` 

Get accounts addresses

**Kind**: Exported function  
**rtype**: `() => String[]`
**Example**  
```js
addresses()
```
<a id="exp_module_@aeternity/aepp-sdk/es/accounts--Accounts"></a>

##### Accounts

**Type Sig:** Accounts([options]) ⇒ `Object` 

Accounts Stamp

The purpose of the Accounts Stamp is to wrap up
[Account](#exp_module_@aeternity/aepp-sdk/es/account--Account) objects and provide a
common interface to all of them. Accounts are a substantial part of
[module:@aeternity/aepp-sdk/es/ae/wallet--Wallet](module:@aeternity/aepp-sdk/es/ae/wallet--Wallet)s.

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

##### signWith

**Type Sig:** signWith(address, data) ⇒ `String` 

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

##### addAccount

**Type Sig:** addAccount(account, [options]) ⇒ `Void` 

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
,
,
