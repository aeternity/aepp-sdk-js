<a id="module_@aeternity/aepp-sdk/es/ae/wallet"></a>

### @aeternity/aepp-sdk/es/ae/wallet
Wallet module

**Example**  
```js
import { RpcWallet } from '@aeternity/aepp-sdk'
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/wallet--module.exports"></a>

#### module.exports([options]) ⇒ `Object` ⏏
Wallet Stamp

**Kind**: Exported function  
**Returns**: `Object` - Wallet instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| options.url | `String` |  | Node instance to connect to |
| [options.accounts] | `Array.&lt;Account&gt;` |  | Accounts to initialize with |
| [options.account] | `String` |  | Public key of account to preselect |

**Example**  
```js
Wallet({
  url: 'https://testnet.aeternity.io/',
  accounts: [MemoryAccount({keypair})],
  address: keypair.publicKey,
})
```
