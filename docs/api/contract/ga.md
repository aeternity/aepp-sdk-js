<a id="module_@aeternity/aepp-sdk/es/contract/ga"></a>

## @aeternity/aepp-sdk/es/contract/ga
Generalize Account module - routines to use generalize account

**Example**  
```js
import GeneralizeAccount from '@aeternity/aepp-sdk/es/contract/ga' (Using tree-shaking)
```
**Example**  
```js
import { GeneralizeAccount } from '@aeternity/aepp-sdk' (Using bundle)
```

* [@aeternity/aepp-sdk/es/contract/ga](#module_@aeternity/aepp-sdk/es/contract/ga)
    * [createGeneralizeAccount(authFnName, source, args, options)](#exp_module_@aeternity/aepp-sdk/es/contract/ga--createGeneralizeAccount) ⇒ `Promise.&lt;Readonly.&lt;{result: \*, owner: \*, createdAt: Date, address, rawTx: \*, transaction: \*}&gt;&gt;` ⏏
    * [createMetaTx(rawTransaction, authData, authFnName, options)](#exp_module_@aeternity/aepp-sdk/es/contract/ga--createMetaTx) ⇒ `String` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/contract/ga--createGeneralizeAccount"></a>

### createGeneralizeAccount(authFnName, source, args, options) ⇒ `Promise.&lt;Readonly.&lt;{result: \*, owner: \*, createdAt: Date, address, rawTx: \*, transaction: \*}&gt;&gt;` ⏏
Convert current account to GA account

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| authFnName | `String` | Authorization function name |
| source | `String` | Auth contract source code |
| args | `Array` | init arguments |
| options | `Object` | Options |

<a id="exp_module_@aeternity/aepp-sdk/es/contract/ga--createMetaTx"></a>

### createMetaTx(rawTransaction, authData, authFnName, options) ⇒ `String` ⏏
Create a metaTx transaction

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| rawTransaction | `String` | Inner transaction |
| authData | `Object` | Object with gaMeta params |
| authFnName | `String` | Authorization function name |
| options | `Object` | Options |

