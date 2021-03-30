<a id="module_@aeternity/aepp-sdk/es/account/memory"></a>

### @aeternity/aepp-sdk/es/account/memory
Memory Account module

**Example**  
```js
//JS
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'

//NodeJS
const { Universal: MemoryAccount } = require('@aeternity/aepp-sdk')
```
<a id="exp_module_@aeternity/aepp-sdk/es/account/memory--MemoryAccount"></a>

#### MemoryAccount([options]) ⇒ `Account` ⏏
In-memory `Account` factory. The resulting account `stamp` is used in various functions for setting up and configuring the SDK.

**Kind**: Exported function  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| options.keypair | `Object` |  | Key pair to use |
| options.keypair.publicKey | `String` |  | Public key |
| options.keypair.secretKey | `String` |  | Private key |

**Example**  
```js
const account = MemoryAccount({ keypair: { secretKey: 'c3e717...**censored**...33d1d0', publicKey: 'ak_rh5G5EeDNCYyyKUyY9DSrMDjbw325HSvQdLXGgcTmDjaQf1Af', } })
```
