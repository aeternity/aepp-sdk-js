<a id="module_@aeternity/aepp-sdk/es/ae/aens"></a>

## @aeternity/aepp-sdk/es/ae/aens
Aens module - routines to interact with the æternity naming system

The high-level description of the naming system is
https://github.com/aeternity/protocol/blob/master/AENS.md in the protocol
repository.

**Export**: Aens  
**Example**  
```js
import Aens from '@aeternity/aepp-sdk/es/ae/aens'
```

* [@aeternity/aepp-sdk/es/ae/aens](#module_@aeternity/aepp-sdk/es/ae/aens)
    * [Aens([options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--Aens) ⇒ `Object` ⏏
    * _instance_
        * [.update(nameId, target, options)](#exp_module_@aeternity/aepp-sdk/es/ae/aens--update) ⇒ `Object` ⏏
        * [.query(name)](#exp_module_@aeternity/aepp-sdk/es/ae/aens--query) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [.claim(name, salt, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--claim) ⇒ `Promise.&lt;Object&gt;` ⏏
        * [.preclaim(name, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--preclaim) ⇒ `Promise.&lt;Object&gt;` ⏏
        * _async_
            * [.transfer(nameId, account, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--transfer) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.revoke(nameId, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--revoke) ⇒ `Promise.&lt;Object&gt;` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--Aens"></a>

### Aens([options]) ⇒ `Object` ⏏
Aens Stamp

Aens provides name-system related methods atop
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Aens instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--update"></a>

### .update(nameId, target, options) ⇒ `Object` ⏏
Update an aens entry

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  

| Param | Description |
| --- | --- |
| nameId | domain hash |
| target | new target |
| options |  |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--query"></a>

### .query(name) ⇒ `Promise.&lt;Object&gt;` ⏏
Query the status of an AENS registration

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  

| Param | Type |
| --- | --- |
| name | `string` | 

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--claim"></a>

### .claim(name, salt, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Claim a previously preclaimed registration. This can only be done after the
preclaim step

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - the result of the claim  

| Param | Type | Default |
| --- | --- | --- |
| name | `String` |  | 
| salt | `String` |  | 
| [options] | `Record` | <code>{}</code> | 

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--preclaim"></a>

### .preclaim(name, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Preclaim a name. Sends a hash of the name and a random salt to the node

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  

| Param | Type | Default |
| --- | --- | --- |
| name | `string` |  | 
| [options] | `Record` | <code>{}</code> | 

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--transfer"></a>

### .transfer(nameId, account, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Transfer a domain to another account

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Category**: async  

| Param | Type | Default |
| --- | --- | --- |
| nameId | `String` |  | 
| account | `String` |  | 
| [options] | `Object` | <code>{}</code> | 

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--revoke"></a>

### .revoke(nameId, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Revoke a domain

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Category**: async  

| Param | Type | Default |
| --- | --- | --- |
| nameId | `String` |  | 
| [options] | `Object` | <code>{}</code> | 

