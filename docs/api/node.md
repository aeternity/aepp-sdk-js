<a id="module_@aeternity/aepp-sdk/es/node"></a>

### @aeternity/aepp-sdk/es/node
Node module

**Example**  
```js
import { Node } from '@aeternity/aepp-sdk'
```

* [@aeternity/aepp-sdk/es/node](#module_@aeternity/aepp-sdk/es/node)
    * [Node([options])](#exp_module_@aeternity/aepp-sdk/es/node--Node) ⇒ `Object` ⏏
        * _static_
            * _async_
                * [.getNetworkId()](#module_@aeternity/aepp-sdk/es/node--Node.getNetworkId) ⇒ `String`
        * _inner_
            * [~getConsensusProtocolVersion(protocols, height)](#module_@aeternity/aepp-sdk/es/node--Node..getConsensusProtocolVersion) ⇒ `Number`

<a id="exp_module_@aeternity/aepp-sdk/es/node--Node"></a>

#### Node([options]) ⇒ `Object` ⏏
[genSwaggerClient](genSwaggerClient) based Node remote API Stamp

**Kind**: Exported function  
**Returns**: `Object` - Node client  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Options |
| options.url | `String` |  | Base URL for Node |
| options.internalUrl | `String` |  | Base URL for internal requests |
| options.axiosConfig | `String` |  | Object with axios configuration. Example { config: {}, errorHandler: (err) => throw err } |

**Example**  
```js
Node({url: 'https://testnet.aeternity.io'})
```
<a id="module_@aeternity/aepp-sdk/es/node--Node.getNetworkId"></a>

##### Node.getNetworkId() ⇒ `String`
Obtain networkId from account or node

**Kind**: static method of [`Node`](#exp_module_@aeternity/aepp-sdk/es/node--Node)  
**Returns**: `String` - NetworkId  
**Category**: async  
**rtype**: `() => networkId: String`
<a id="module_@aeternity/aepp-sdk/es/node--Node..getConsensusProtocolVersion"></a>

##### Node~getConsensusProtocolVersion(protocols, height) ⇒ `Number`
get consensus protocol version

**Kind**: inner method of [`Node`](#exp_module_@aeternity/aepp-sdk/es/node--Node)  
**Returns**: `Number` - version Protocol version  

| Param | Type | Description |
| --- | --- | --- |
| protocols | `Array` | Array of protocols |
| height | `Number` | Height |

