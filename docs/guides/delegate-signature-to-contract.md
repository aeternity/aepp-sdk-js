# Delegate Signature to Contract

The [Sophia](https://github.com/aeternity/protocol/blob/aeternity-node-v5.4.1/contracts/sophia.md) language for smart contracts allow to delegate
the transaction execution to a contract by providing
delegation signatures.


## Delegate signatures for AENS

The following code snippet shows how to generate
signatures for name transactions delegation to a contract

```js
import { Universal, MemoryAccount, Crypto } from '@aeternity/aepp-sdk'

// Init account
const keypair = Crypto.generateKeyPair()
const account = MemoryAccount({ keypair })

// Contract address
const contractId = 'ct_asd2ks...'

// Init sdk
const sdkInstance = await Universal({ accounts: [account] })


// An example name
const name = 'example.chain'

// option can be `{ onAccount: String | KeypairObject | MemoryAccount }`
// name preclaim signature delegation
const sig = sdkInstance.delegateNamePreclaimSignature(contractId, option)

// name claim signature delegation
const sig = sdkInstance.delegateNameClaimSignature(contractId, name, option)

// name transfer signature delegation
const sig = sdkInstance.delegateNameTransferSignature(contractId, name, option)

// name revoke signature delegation
const sig = sdkInstance.delegateNameRevokeSignature(contractId, name, option)
```
