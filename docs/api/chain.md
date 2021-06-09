<a id="module_@aeternity/aepp-sdk/es/chain"></a>

### @aeternity/aepp-sdk/es/chain
Chain module

**Example**  
```js
import { Chain } from '@aeternity/aepp-sdk'
```

* [@aeternity/aepp-sdk/es/chain](#module_@aeternity/aepp-sdk/es/chain)
    * [Chain([options])](#exp_module_@aeternity/aepp-sdk/es/chain--Chain) ⇒ `Object` ⏏
        * _instance_
            * _async_
                * *[.sendTransaction(tx, [options])](#module_@aeternity/aepp-sdk/es/chain--Chain+sendTransaction) ⇒ `Object`*
                * *[.height()](#module_@aeternity/aepp-sdk/es/chain--Chain+height) ⇒ `Number`*
                * *[.awaitHeight([options])](#module_@aeternity/aepp-sdk/es/chain--Chain+awaitHeight) ⇒ `Number`*
                * *[.poll([options])](#module_@aeternity/aepp-sdk/es/chain--Chain+poll) ⇒ `Object`*
                * *[.balance(address, [options])](#module_@aeternity/aepp-sdk/es/chain--Chain+balance) ⇒ `Object`*
                * *[.tx(hash, info)](#module_@aeternity/aepp-sdk/es/chain--Chain+tx) ⇒ `Object`*
                * *[.getTxInfo(hash)](#module_@aeternity/aepp-sdk/es/chain--Chain+getTxInfo) ⇒ `Object`*
                * *[.mempool()](#module_@aeternity/aepp-sdk/es/chain--Chain+mempool) ⇒ `Array.&lt;Object&gt;`*
                * *[.getCurrentGeneration()](#module_@aeternity/aepp-sdk/es/chain--Chain+getCurrentGeneration) ⇒ `Object`*
                * *[.getGeneration(hashOrHeight)](#module_@aeternity/aepp-sdk/es/chain--Chain+getGeneration) ⇒ `Object`*
                * *[.waitForTxConfirm(txHash, [options])](#module_@aeternity/aepp-sdk/es/chain--Chain+waitForTxConfirm) ⇒ `Promise.&lt;Number&gt;`*
                * *[.getMicroBlockTransactions()](#module_@aeternity/aepp-sdk/es/chain--Chain+getMicroBlockTransactions) ⇒ `Array.&lt;Object&gt;`*
                * *[.getKeyBlock()](#module_@aeternity/aepp-sdk/es/chain--Chain+getKeyBlock) ⇒ `Object`*
                * *[.getMicroBlockHeader()](#module_@aeternity/aepp-sdk/es/chain--Chain+getMicroBlockHeader) ⇒ `Object`*
                * *[.getAccount(address, [options])](#module_@aeternity/aepp-sdk/es/chain--Chain+getAccount) ⇒ `Object`*
                * *[.txDryRun(tx, accountAddress)](#module_@aeternity/aepp-sdk/es/chain--Chain+txDryRun) ⇒ `Object`*
        * _static_
            * [.waitMined(bool)](#module_@aeternity/aepp-sdk/es/chain--Chain.waitMined) ⇒ `Stamp`

<a id="exp_module_@aeternity/aepp-sdk/es/chain--Chain"></a>

#### Chain([options]) ⇒ `Object` ⏏
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

##### *chain.sendTransaction(tx, [options]) ⇒ `Object`*
Submit a signed transaction for mining

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(tx: String, options?: Object) => tx: Promise[Object]|txHash: Promise[String]`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| tx | `String` |  | Transaction to submit |
| [options] | `String` | <code>{}</code> | Options to pass to the implementation |
| [options.verify] | `String` | <code>false</code> | Verify transaction before broadcast. |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+height"></a>

##### *chain.height() ⇒ `Number`*
Obtain current height of the chain

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Number` - Current chain height  
**Category**: async  
**rtype**: `() => height: Number`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+awaitHeight"></a>

##### *chain.awaitHeight([options]) ⇒ `Number`*
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

##### *chain.poll([options]) ⇒ `Object`*
Wait for a transaction to be mined

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - The transaction as it was mined  
**Category**: async  
**rtype**: `(th: String, options?: Object) => tx: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Options |
| options.interval | `Number` |  | Interval (in ms) at which to poll the chain |
| options.blocks | `Number` |  | Number of blocks mined after which to fail |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+balance"></a>

##### *chain.balance(address, [options]) ⇒ `Object`*
Request the balance of specified account

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - The transaction as it was mined  
**Category**: async  
**rtype**: `(address: String, options?: Object) => balance: Number`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| address | `String` |  | The public account address to obtain the balance for |
| [options] | `Object` | <code>{}</code> | Options |
| options.height | `Number` |  | The chain height at which to obtain the balance for (default: top of chain) |
| options.hash | `String` |  | The block hash on which to obtain the balance for (default: top of chain) |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+tx"></a>

##### *chain.tx(hash, info) ⇒ `Object`*
Obtain a transaction based on its hash

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(hash: String, info = false) => tx: Object`

| Param | Type | Description |
| --- | --- | --- |
| hash | `String` | Transaction hash |
| info | `Boolean` | Retrieve additional transaction date. Works only for (ContractCreate and ContractCall transaction's) |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getTxInfo"></a>

##### *chain.getTxInfo(hash) ⇒ `Object`*
Obtain a transaction info based on its hash

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(hash: String) => tx: Object`

| Param | Type | Description |
| --- | --- | --- |
| hash | `String` | Transaction hash |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+mempool"></a>

##### *chain.mempool() ⇒ `Array.&lt;Object&gt;`*
Obtain transaction's from mempool

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Array.&lt;Object&gt;` - Transactions  
**Category**: async  
**rtype**: `() => txs: [...Object]`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getCurrentGeneration"></a>

##### *chain.getCurrentGeneration() ⇒ `Object`*
Obtain current generation

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Current Generation  
**Category**: async  
**rtype**: `() => generation: Object`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getGeneration"></a>

##### *chain.getGeneration(hashOrHeight) ⇒ `Object`*
Get generation by hash or height

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Generation  
**Category**: async  
**rtype**: `(hashOrHeight) => generation: Object`

| Param | Type | Description |
| --- | --- | --- |
| hashOrHeight | `String` \| `Number` | Generation hash or height |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+waitForTxConfirm"></a>

##### *chain.waitForTxConfirm(txHash, [options]) ⇒ `Promise.&lt;Number&gt;`*
Wait for transaction confirmation

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Promise.&lt;Number&gt;` - Current Height  
**Category**: async  
**rtype**: `(txHash: String, { confirm: Number | Boolean } = { confirm: 3 }) => Promise<Number>`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| txHash | `String` |  | Transaction hash |
| [options] | `Object` |  | options |
| [options.confirm] | `Number` | <code>3</code> | Number of blocks to wait for transaction confirmation |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getMicroBlockTransactions"></a>

##### *chain.getMicroBlockTransactions() ⇒ `Array.&lt;Object&gt;`*
Get micro block transactions

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Array.&lt;Object&gt;` - Transactions  
**Category**: async  
**rtype**: `(hash) => txs: [...Object]`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getKeyBlock"></a>

##### *chain.getKeyBlock() ⇒ `Object`*
Get key block

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Key Block  
**Category**: async  
**rtype**: `(hashOrHeight) => keyBlock: Object`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getMicroBlockHeader"></a>

##### *chain.getMicroBlockHeader() ⇒ `Object`*
Get micro block header

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Micro block header  
**Category**: async  
**rtype**: `(hash) => header: Object`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getAccount"></a>

##### *chain.getAccount(address, [options]) ⇒ `Object`*
Get account by account public key

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Account  
**Category**: async  
**rtype**: `(address, { hash, height }) => account: Object`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| address | `String` |  | Account public key |
| [options] | `Object` | <code>{}</code> | Options |
| [options.height] | `Number` |  | Get account on specific block by block height |
| [options.hash] | `String` |  | Get account on specific block by block hash |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+txDryRun"></a>

##### *chain.txDryRun(tx, accountAddress) ⇒ `Object`*
Transaction dry-run

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Result  
**Category**: async  
**rtype**: `(tx, accountAddress, options) => result: Object`

| Param | Type | Description |
| --- | --- | --- |
| tx | `String` | transaction to execute |
| accountAddress | `String` | address that will be used to execute transaction |
| [options.top] | `String` \| `Number` | hash of block on which to make dry-run |
| [options.txEvents] | `Boolean` | collect and return on-chain tx events that would result from the call |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain.waitMined"></a>

##### Chain.waitMined(bool) ⇒ `Stamp`
Reconfigure Stamp to (not) wait until transactions are mined

**Kind**: static method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Stamp` - Reconfigured Chain Stamp  
**rtype**: `(bool: Boolean) => Stamp`

| Param | Type | Description |
| --- | --- | --- |
| bool | `boolean` | Whether to wait for transactions |

