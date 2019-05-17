<a id="module_@aeternity/aepp-sdk/es/account/selector"></a>

## @aeternity/aepp-sdk/es/account/selector
Accounts Selector module

This is the complement to [@aeternity/aepp-sdk/es/accounts](#module_@aeternity/aepp-sdk/es/accounts).

**Example**  
```js
import Selector from '@aeternity/aepp-sdk/es/account/selector'
```

* [@aeternity/aepp-sdk/es/account/selector](#module_@aeternity/aepp-sdk/es/account/selector)
    * [Selector([options])](#exp_module_@aeternity/aepp-sdk/es/account/selector--Selector) ⇒ `Account` ⏏
    * _instance_
        * [.selectAccount(address)](#exp_module_@aeternity/aepp-sdk/es/account/selector--selectAccount) ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/account/selector--Selector"></a>

### Selector([options]) ⇒ `Account` ⏏
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

### .selectAccount(address) ⏏
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
