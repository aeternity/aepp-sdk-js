<a id="module_@aeternity/aepp-sdk/es/ae/aens"></a>

### @aeternity/aepp-sdk/es/ae/aens
Aens module - routines to interact with the æternity naming system

The high-level description of the naming system is
https://github.com/aeternity/protocol/blob/master/AENS.md in the protocol
repository.

**Example**  
```js
import { Aens } from '@aeternity/aepp-sdk'
```

* [@aeternity/aepp-sdk/es/ae/aens](#module_@aeternity/aepp-sdk/es/ae/aens)
    * [Aens([options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--Aens) ⇒ `Object` ⏏
    * _instance_
        * _async_
            * [.revoke(name, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--revoke) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.update(name, pointers, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--update) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.transfer(name, account, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--transfer) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.query(name, opt)](#exp_module_@aeternity/aepp-sdk/es/ae/aens--query) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.claim(name, salt, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--claim) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.preclaim(name, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--preclaim) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.bid(name, nameFee, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/aens--bid) ⇒ `Promise.&lt;Object&gt;` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--Aens"></a>

#### Aens([options]) ⇒ `Object` ⏏
Aens Stamp

Aens provides name-system related methods atop
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Aens instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--revoke"></a>

#### .revoke(name, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Revoke a name

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - Transaction result  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | Name hash |
| [options] | `Object` | <code>{}</code> | options |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |

**Example**  
```js
const name = 'test.chain'
const nameObject = await sdkInstance.aensQuery(name)

await sdkInstance.aensRevoke(name, { fee, ttl , nonce })
// or
await nameObject.revoke({ fee, ttl, nonce })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--update"></a>

#### .update(name, pointers, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Update a name

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Category**: async  
**Throws**:

- Invalid pointer array error


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | AENS name |
| pointers | `Array.&lt;String&gt;` |  | Array of name pointers. Can be oracle|account|contract|channel public key |
| [options] | `Object` | <code>{}</code> |  |
| [options.extendPointers] | `Boolean` | <code>false</code> | extendPointers Get the pointers from the node and merge with provided one. Pointers with the same type will be overwrited |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |
| [options.nameTtl] | `Number` \| `String` \| `BigNumber` | <code>50000</code> | nameTtl Name ttl represented in number of blocks (Max value is 50000 blocks) |
| [options.clientTtl] | `Number` \| `String` \| `BigNumber` | <code>84600</code> | clientTtl a suggestion as to how long any clients should cache this information |

**Example**  
```js
const name = 'test.chain'
const pointersArray = ['ak_asd23dasdas...,' 'ct_asdf34fasdasd...']
const nameObject = await sdkInstance.aensQuery(name)

await sdkInstance.aensUpdate(name, pointersArray, { nameTtl, ttl, fee, nonce, clientTtl })
// or
await nameObject.update(pointersArray, { nameTtl, ttl, fee, nonce, clientTtl })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--transfer"></a>

#### .transfer(name, account, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Transfer a domain to another account

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - Transaction result  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | AENS name |
| account | `String` |  | Recipient account publick key |
| [options] | `Object` | <code>{}</code> |  |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |

**Example**  
```js
const name = 'test.chain'
const recipientPub = 'ak_asd23dasdas...'
const nameObject = await sdkInstance.aensQuery(name)

await sdkInstance.aensTransfer(name, recipientPub, { ttl, fee, nonce })
// or
await nameObject.transfer(recipientPub, { ttl, fee, nonce })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--query"></a>

#### .query(name, opt) ⇒ `Promise.&lt;Object&gt;` ⏏
Query the AENS name info from the node
and return the object with info and predefined functions for manipulating name

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| name | `String` |  |
| opt | `Object` | Options |

**Example**  
```js
const nameObject = sdkInstance.aensQuery('test.chain')
console.log(nameObject)
{
 id, // name hash
 pointers, // array of pointers
 update, // Update name function
 extendTtl, // Extend Ttl name function
 transfer, // Transfer name function
 revoke // Revoke name function
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--claim"></a>

#### .claim(name, salt, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Claim a previously preclaimed registration. This can only be done after the
preclaim step

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - the result of the claim  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  |  |
| salt | `Number` |  | Salt from pre-claim, or 0 if it's a bid |
| [options] | `Object` | <code>{}</code> | options |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |
| [options.nameFee] | `Number` \| `String` |  | Name Fee (By default calculated by sdk) |
| [options.vsn] | `Number` \| `String` | <code>2</code> | Transaction vsn from Lima is 2 |

**Example**  
```js
const name = 'test.chain'
const salt = preclaimResult.salt // salt from pre-claim transaction

await sdkInstance.aensClaim(name, salt, { ttl, fee, nonce, nameFee })
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--preclaim"></a>

#### .preclaim(name, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Preclaim a name. Sends a hash of the name and a random salt to the node

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  |  |
| [options] | `Object` | <code>{}</code> |  |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |

**Example**  
```js
const name = 'test.chain'
const salt = preclaimResult.salt // salt from pre-claim transaction

await sdkInstance.aensPreclaim(name, { ttl, fee, nonce })
{
  ...transactionResult,
  claim, // Claim function (options={}) => claimTransactionResult
  salt,
  commitmentId
}
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/aens--bid"></a>

#### .bid(name, nameFee, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Bid to name auction

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/aens`](#module_@aeternity/aepp-sdk/es/ae/aens)  
**Returns**: `Promise.&lt;Object&gt;` - Transaction result  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | `String` |  | Domain name |
| nameFee | `String` \| `Number` |  | Name fee (bid fee) |
| [options] | `Object` | <code>{}</code> |  |
| [options.onAccount] | `String` \| `Object` |  | onAccount Make operation on specific account from sdk(you pass publickKey) or using provided KeyPair(Can be keypair object or MemoryAccount) |
| [options.fee] | `Number` \| `String` \| `BigNumber` |  | fee |
| [options.ttl] | `Number` \| `String` \| `BigNumber` |  | ttl |
| [options.nonce] | `Number` \| `String` \| `BigNumber` |  | nonce |

**Example**  
```js
const name = 'test.chain'
const bidFee = computeBidFee(name, startFee, incrementPercentage)

await sdkInstance.aensBid(name, 213109412839123, { ttl, fee, nonce })
```
