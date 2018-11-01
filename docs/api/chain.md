<a id="module_@aeternity/aepp-sdk/es/chain"></a>

## @aeternity/aepp-sdk/es/chain
Chain module

**Export**: Chain  
**Example**  
```js
import Chain from '@aeternity/aepp-sdk/es/chain'
```

* [@aeternity/aepp-sdk/es/chain](#module_@aeternity/aepp-sdk/es/chain)
    * [Chain([options])](#exp_module_@aeternity/aepp-sdk/es/chain--Chain) ⇒ `Object` ⏏
        * _instance_
            * _async_
                * *[.sendTransaction(tx, [options])](#module_@aeternity/aepp-sdk/es/chain--Chain+sendTransaction) ⇒ `String` \| `String`*
                * *[.height()](#module_@aeternity/aepp-sdk/es/chain--Chain+height) ⇒ `Number`*
                * *[.awaitHeight([options])](#module_@aeternity/aepp-sdk/es/chain--Chain+awaitHeight) ⇒ `Number`*
                * *[.poll([options])](#module_@aeternity/aepp-sdk/es/chain--Chain+poll) ⇒ `String`*
                * *[.balance(address, [options])](#module_@aeternity/aepp-sdk/es/chain--Chain+balance) ⇒ `String`*
                * *[.tx(hash)](#module_@aeternity/aepp-sdk/es/chain--Chain+tx) ⇒ `String`*
                * *[.getTxInfo(hash)](#module_@aeternity/aepp-sdk/es/chain--Chain+getTxInfo) ⇒ `String`*
                * *[.mempool()](#module_@aeternity/aepp-sdk/es/chain--Chain+mempool) ⇒ `Array.&lt;String&gt;`*
        * _static_
            * [.waitMined(bool)](#module_@aeternity/aepp-sdk/es/chain--Chain.waitMined) ⇒ `Stamp`

<a id="exp_module_@aeternity/aepp-sdk/es/chain--Chain"></a>

### Chain([options]) ⇒ `Object` ⏏
Basic Chain Stamp

Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

**Kind**: Exported function  
**Returns**: `Object` - Chain instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+sendTransaction"></a>

#### *chain.sendTransaction(tx, [options]) ⇒ `String` \| `String`*
Submit a signed transaction for mining

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `String` \| `String` - Transaction or transaction hash  
**Category**: async  
**rtype**: `(tx: String, options?: Object) => tx: Promise[String]|txHash: Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| tx | `String` |  | Transaction to submit |
| [options] | `String` | <code>{}</code> | Options to pass to the implementation |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+height"></a>

#### *chain.height() ⇒ `Number`*
Obtain current height of the chain

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Number` - Current chain height  
**Category**: async  
**rtype**: `() => height: Number`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+awaitHeight"></a>

#### *chain.awaitHeight([options]) ⇒ `Number`*
Wait for the chain to reach a specific height

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Number` - Current chain height  
**Category**: async  
**rtype**: `(height: Number, options?: Object) => height: Number`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Options |
| options.interval | `Number` |  | Interval (in ms) at which to poll the chain |
| options.attempts | `Number` |  | Number of polling attempts after which to fail |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+poll"></a>

#### *chain.poll([options]) ⇒ `String`*
Wait for a transaction to be mined

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `String` - The transaction as it was mined  
**Category**: async  
**rtype**: `(th: String, options?: Object) => tx: String`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Options |
| options.interval | `Number` |  | Interval (in ms) at which to poll the chain |
| options.blocks | `Number` |  | Number of blocks mined after which to fail |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+balance"></a>

#### *chain.balance(address, [options]) ⇒ `String`*
Request the balance of specified account

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `String` - The transaction as it was mined  
**Category**: async  
**rtype**: `(address: String, options?: Object) => balance: Number`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| address | `String` |  | The public account address to obtain the balance for |
| [options] | `Object` | <code>{}</code> | Options |
| options.height | `Number` |  | The chain height at which to obtain the balance for (default: top of chain) |
| options.hash | `String` |  | TODO |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+tx"></a>

#### *chain.tx(hash) ⇒ `String`*
Obtain a transaction based on its hash

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `String` - Transaction  
**Category**: async  
**rtype**: `(hash: String) => tx: String`

| Param | Type | Description |
| --- | --- | --- |
| hash | `String` | Transaction hash |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getTxInfo"></a>

#### *chain.getTxInfo(hash) ⇒ `String`*
Obtain a transaction info based on its hash

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `String` - Transaction  
**Category**: async  
**rtype**: `(hash: String) => tx: String`

| Param | Type | Description |
| --- | --- | --- |
| hash | `String` | Transaction hash |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+mempool"></a>

#### *chain.mempool() ⇒ `Array.&lt;String&gt;`*
Obtain transaction's from mempool

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Array.&lt;String&gt;` - Transactions  
**Category**: async  
**rtype**: `() => txs: [...String]`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain.waitMined"></a>

#### Chain.waitMined(bool) ⇒ `Stamp`
Reconfigure Stamp to (not) wait until transactions are mined

**Kind**: static method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Stamp` - Reconfigured Chain Stamp  
**rtype**: `(bool: Boolean) => Stamp`

| Param | Type | Description |
| --- | --- | --- |
| bool | `boolean` | Whether to wait for transactions |

