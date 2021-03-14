## chain
 
<a id="module_@aeternity/aepp-sdk/es/chain"></a>

### chain
**Module Path:** @aeternity/aepp-sdk/es/chain 

Chain module

**Example**  
```js
import Chain from '@aeternity/aepp-sdk/es/chain'
```

        
            
        

<a id="exp_module_@aeternity/aepp-sdk/es/chain--Chain"></a>

#### Chain

**Type Sig:** Chain([options]) ⇒ `Object` 

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

##### sendTransaction
**Type Sig:** chain.sendTransaction(tx, [options]) ⇒ `Object`
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

##### height
**Type Sig:** chain.height() ⇒ `Number`
Obtain current height of the chain

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Number` - Current chain height  
**Category**: async  
**rtype**: `() => height: Number`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+awaitHeight"></a>

##### awaitHeight
**Type Sig:** chain.awaitHeight([options]) ⇒ `Number`
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

##### poll
**Type Sig:** chain.poll([options]) ⇒ `Object`
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

##### balance
**Type Sig:** chain.balance(address, [options]) ⇒ `Object`
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

##### tx
**Type Sig:** chain.tx(hash, info) ⇒ `Object`
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

##### getTxInfo
**Type Sig:** chain.getTxInfo(hash) ⇒ `Object`
Obtain a transaction info based on its hash

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Transaction  
**Category**: async  
**rtype**: `(hash: String) => tx: Object`

| Param | Type | Description |
| --- | --- | --- |
| hash | `String` | Transaction hash |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+mempool"></a>

##### mempool
**Type Sig:** chain.mempool() ⇒ `Array.&lt;Object&gt;`
Obtain transaction's from mempool

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Array.&lt;Object&gt;` - Transactions  
**Category**: async  
**rtype**: `() => txs: [...Object]`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getCurrentGeneration"></a>

##### getCurrentGeneration
**Type Sig:** chain.getCurrentGeneration() ⇒ `Object`
Obtain current generation

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Current Generation  
**Category**: async  
**rtype**: `() => generation: Object`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getGeneration"></a>

##### getGeneration
**Type Sig:** chain.getGeneration(hashOrHeight) ⇒ `Object`
Get generation by hash or height

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Generation  
**Category**: async  
**rtype**: `(hashOrHeight) => generation: Object`

| Param | Type | Description |
| --- | --- | --- |
| hashOrHeight | `String` \| `Number` | Generation hash or height |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+waitForTxConfirm"></a>

##### waitForTxConfirm
**Type Sig:** chain.waitForTxConfirm(txHash, [options]) ⇒ `Promise.&lt;Number&gt;`
Wait for transaction confirmation

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Promise.&lt;Number&gt;` - Current Height  
**Category**: async  
**rtype**: `(txHash: String, { confirm: Number | Boolean } = { confirm: 3 }) => Promise<Number>`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| txHash | `String` |  | Generation hash or height |
| [options] | `String` | <code>{}</code> | options |
| [options.confirm] | `String` | <code>3</code> | Block confirmation count |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getMicroBlockTransactions"></a>

##### getMicroBlockTransactions
**Type Sig:** chain.getMicroBlockTransactions() ⇒ `Array.&lt;Object&gt;`
Get micro block transactions

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Array.&lt;Object&gt;` - Transactions  
**Category**: async  
**rtype**: `(hash) => txs: [...Object]`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getKeyBlock"></a>

##### getKeyBlock
**Type Sig:** chain.getKeyBlock() ⇒ `Object`
Get key block

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Key Block  
**Category**: async  
**rtype**: `(hashOrHeight) => keyBlock: Object`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getMicroBlockHeader"></a>

##### getMicroBlockHeader
**Type Sig:** chain.getMicroBlockHeader() ⇒ `Object`
Get micro block header

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Micro block header  
**Category**: async  
**rtype**: `(hash) => header: Object`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getAccount"></a>

##### getAccount
**Type Sig:** chain.getAccount(address, [options]) ⇒ `Object`
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

##### txDryRun
**Type Sig:** chain.txDryRun(txs, accounts, hashOrHeight) ⇒ `Object`
Transaction dry-run

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Result  
**Category**: async  
**rtype**: `(txs, accounts, hashOrHeight) => result: Object`

| Param | Type | Description |
| --- | --- | --- |
| txs | `Array` | Array of transaction's |
| accounts | `Array` | Array of account's |
| hashOrHeight | `String` \| `Number` | hash or height of block on which to make dry-run |

<a id="module_@aeternity/aepp-sdk/es/chain--Chain+getInfo"></a>

##### getInfo
**Type Sig:** chain.getInfo() ⇒ `Object`
Get Node Info

**Kind**: instance abstract method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Object` - Result  
**Category**: async  
**rtype**: `() => result: Object`
<a id="module_@aeternity/aepp-sdk/es/chain--Chain.waitMined"></a>

##### waitMined
**Type Sig:** Chain.waitMined(bool) ⇒ `Stamp`
Reconfigure Stamp to (not) wait until transactions are mined

**Kind**: static method of [`Chain`](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)  
**Returns**: `Stamp` - Reconfigured Chain Stamp  
**rtype**: `(bool: Boolean) => Stamp`

| Param | Type | Description |
| --- | --- | --- |
| bool | `boolean` | Whether to wait for transactions |

,
<a id="module_@aeternity/aepp-sdk/es/chain/node"></a>

### chain/node
**Module Path:** @aeternity/aepp-sdk/es/chain/node 

ChainNode module

This is the complement to [@aeternity/aepp-sdk/es/chain](#module_@aeternity/aepp-sdk/es/chain).

**Example**  
```js
import ChainNode from '@aeternity/aepp-sdk/es/chain/node'
```
<a id="exp_module_@aeternity/aepp-sdk/es/chain/node--ChainNode"></a>

#### ChainNode

**Type Sig:** ChainNode([options]) ⇒ `Object` 

ChainNode Stamp

This is implementation of [Chain](#exp_module_@aeternity/aepp-sdk/es/chain--Chain)
composed with [module:@aeternity/aepp-sdk/es/contract/node--ContractNodeAPI](module:@aeternity/aepp-sdk/es/contract/node--ContractNodeAPI) and [module:@aeternity/aepp-sdk/es/oracle/node--OracleNodeAPI](module:@aeternity/aepp-sdk/es/oracle/node--OracleNodeAPI)

**Kind**: Exported function  
**Returns**: `Object` - ChainNode instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

**Example**  
```js
ChainNode({url: 'https://testnet.aeternity.io/'})
```
,
