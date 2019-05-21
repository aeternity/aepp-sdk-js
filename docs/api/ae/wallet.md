<a id="module_@aeternity/aepp-sdk/es/ae/wallet"></a>

## @aeternity/aepp-sdk/es/ae/wallet
Wallet module

**Example**  
```js
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet'
```
<a id="exp_module_@aeternity/aepp-sdk/es/ae/wallet--Wallet"></a>

### Wallet([options]) ⇒ `Object` ⏏
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
| [options.onTx] | `function` |  | Tx method protector function |
| [options.onChain] | `function` |  | Chain method protector function |
| [options.onAccount] | `function` |  | Account method protector function |
| [options.onContract] | `function` |  | Contract method protector function |

**Example**  
```js
Wallet({
  url: 'https://sdk-testnet.aepps.com/',
  accounts: [MemoryAccount({keypair})],
  address: keypair.publicKey,
  onTx: confirm,
  onChain: confirm,
  onAccount: confirm
  onContract: confirm
})
```
