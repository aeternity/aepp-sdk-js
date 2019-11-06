<a id="module_@aeternity/aepp-sdk/es/chain/node"></a>

## @aeternity/aepp-sdk/es/chain/node
ChainNode module

This is the complement to [@aeternity/aepp-sdk/es/chain](#module_@aeternity/aepp-sdk/es/chain).

**Example**  
```js
import ChainNode from '@aeternity/aepp-sdk/es/chain/node'
```

* [@aeternity/aepp-sdk/es/chain/node](#module_@aeternity/aepp-sdk/es/chain/node)
    * [ChainNode([options])](#exp_module_@aeternity/aepp-sdk/es/chain/node--ChainNode) ⇒ `Object` ⏏
        * ~~[~balance()](#module_@aeternity/aepp-sdk/es/chain/node--ChainNode..balance)~~

<a id="exp_module_@aeternity/aepp-sdk/es/chain/node--ChainNode"></a>

### ChainNode([options]) ⇒ `Object` ⏏
ChainNode Stamp

This is implementation of [module:@aeternity/aepp-sdk/es/chain--Chain](module:@aeternity/aepp-sdk/es/chain--Chain)
composed with [module:@aeternity/aepp-sdk/es/contract/node--ContractNodeAPI](module:@aeternity/aepp-sdk/es/contract/node--ContractNodeAPI) and [module:@aeternity/aepp-sdk/es/oracle/node--OracleNodeAPI](module:@aeternity/aepp-sdk/es/oracle/node--OracleNodeAPI)

**Kind**: Exported function  
**Returns**: `Object` - ChainNode instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

**Example**  
```js
ChainNode({url: 'https://sdk-testnet.aepps.com/'})
```
<a id="module_@aeternity/aepp-sdk/es/chain/node--ChainNode..balance"></a>

#### ~~ChainNode~balance()~~
***Deprecated***

**Kind**: inner method of [`ChainNode`](#exp_module_@aeternity/aepp-sdk/es/chain/node--ChainNode)  
