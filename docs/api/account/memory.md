<a id="module_@aeternity/aepp-sdk/es/account/memory"></a>

## @aeternity/aepp-sdk/es/account/memory
Memory Account module

**Example**  
```js
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
```

* [@aeternity/aepp-sdk/es/account/memory](#module_@aeternity/aepp-sdk/es/account/memory)
    * [MemoryAccount([options])](#exp_module_@aeternity/aepp-sdk/es/account/memory--MemoryAccount) ⇒ `Account` ⏏
    * _instance_
        * [.setKeypair(keypair)](#exp_module_@aeternity/aepp-sdk/es/account/memory--setKeypair) ⇒ `Void` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/account/memory--MemoryAccount"></a>

### MemoryAccount([options]) ⇒ `Account` ⏏
In-memory `Account` factory

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| options.keypair | `Object` |  | Key pair to use |
| options.keypair.publicKey | `String` |  | Public key |
| options.keypair.secretKey | `String` |  | Private key |

<a id="exp_module_@aeternity/aepp-sdk/es/account/memory--setKeypair"></a>

### .setKeypair(keypair) ⇒ `Void` ⏏
Select specific account

**Kind**: instance method of [`@aeternity/aepp-sdk/es/account/memory`](#module_@aeternity/aepp-sdk/es/account/memory)  
**rtype**: `(keypair: {publicKey: String, secretKey: String}) => Void`

| Param | Type | Description |
| --- | --- | --- |
| keypair | `Object` | Key pair to use |
| keypair.publicKey | `String` | Public key |
| keypair.secretKey | `String` | Private key |

**Example**  
```js
setKeypair(keypair)
```
