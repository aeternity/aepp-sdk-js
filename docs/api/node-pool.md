<a id="module_@aeternity/aepp-sdk/es/node-pool"></a>

## @aeternity/aepp-sdk/es/node-pool
NodePool module

**Example**  
```js
import NodePool from '@aeternity/aepp-sdk/es/node-pool'
```

* [@aeternity/aepp-sdk/es/node-pool](#module_@aeternity/aepp-sdk/es/node-pool)
    * [exports.NodePool([options])](#exp_module_@aeternity/aepp-sdk/es/node-pool--exports.NodePool) ⇒ `Object` ⏏
    * [addNode(name, nodeInstance, select)](#exp_module_@aeternity/aepp-sdk/es/node-pool--addNode) ⇒ `Void` ⏏
    * [selectNode(name)](#exp_module_@aeternity/aepp-sdk/es/node-pool--selectNode) ⇒ `Void` ⏏
    * [getNetworkId()](#exp_module_@aeternity/aepp-sdk/es/node-pool--getNetworkId) ⇒ `String` ⏏
    * [isNodeConnected()](#exp_module_@aeternity/aepp-sdk/es/node-pool--isNodeConnected) ⇒ `Boolean` ⏏
    * [getNodeInfo()](#exp_module_@aeternity/aepp-sdk/es/node-pool--getNodeInfo) ⇒ `Object` ⏏
    * [getNodesInPool()](#exp_module_@aeternity/aepp-sdk/es/node-pool--getNodesInPool) ⇒ `Array.&lt;Object&gt;` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--exports.NodePool"></a>

### exports.NodePool([options]) ⇒ `Object` ⏏
Node Pool Stamp
This stamp allow you to make basic manipulation(add, remove, select) on list of nodes

**Kind**: Exported function  
**Returns**: `Object` - NodePool instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.nodes] | `Array` |  | Array with Node instances |

<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--addNode"></a>

### addNode(name, nodeInstance, select) ⇒ `Void` ⏏
Add Node

**Kind**: Exported function  
**rtype**: `(name: String, nodeInstance: Object, select: Boolean) => Void`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Node name |
| nodeInstance | `Object` | Node instance |
| select | `Boolean` | Select this node as current |

**Example**  
```js
nodePool.addNode('testNode', awaitNode({ url, internalUrl }), true) // add and select new node with name 'testNode'
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--selectNode"></a>

### selectNode(name) ⇒ `Void` ⏏
Select Node

**Kind**: Exported function  
**rtype**: `(name: String) => Void`

| Param | Type | Description |
| --- | --- | --- |
| name | `String` | Node name |

**Example**  
```js
nodePool.selectNode('testNode')
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--getNetworkId"></a>

### getNetworkId() ⇒ `String` ⏏
Get NetworkId of current Node

**Kind**: Exported function  
**rtype**: `() => String`
**Example**  
```js
nodePool.getNetworkId()
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--isNodeConnected"></a>

### isNodeConnected() ⇒ `Boolean` ⏏
Check if you have selected node

**Kind**: Exported function  
**rtype**: `() => Boolean`
**Example**  
```js
nodePool.isNodeConnected()
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--getNodeInfo"></a>

### getNodeInfo() ⇒ `Object` ⏏
Get information about node

**Kind**: Exported function  
**rtype**: `() => Object`
**Example**  
```js
nodePool.getNodeInfo() // { name, version, networkId, protocol, ... }
```
<a id="exp_module_@aeternity/aepp-sdk/es/node-pool--getNodesInPool"></a>

### getNodesInPool() ⇒ `Array.&lt;Object&gt;` ⏏
Get array of available nodes

**Kind**: Exported function  
**rtype**: `() => Object[]`
**Example**  
```js
nodePool.getNodesInPool()
```
