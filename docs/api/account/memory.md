<a id="module_@aeternity/aepp-sdk/es/account/memory"></a>

## @aeternity/aepp-sdk/es/account/memory
Memory Account module

**Example**  
```js
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
```
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

