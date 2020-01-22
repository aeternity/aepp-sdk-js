## Basic structure of a Browser æpp

### Interactions

> "There are two approaches, purist and high-level."
*Alexander Kahl.*

The purist uses the functions generated out of the Swagger
file. After `create`ing the client and `await`ing it (or use `.then`),
it exposes a mapping of all `operationId`s as functions, converted to
camelCase (from PascalCase). So e.g. in order to get a transaction
based on its hash, you would invoke `client.api.getTx(query)`.

In this way the SDK is simply a mapping of the raw API calls into
Javascript. It's excellent for low-level control, and as a teaching tool to
understand the node's operations. Most real-world requirements involves a series
of chain operations, so the SDK provides abstractions for these. The Javscript
Promises framework makes this somewhat easy:

### (**Recommended**) High-level SDK usage
Example spend function, using aeternity's SDK abstraction
```js
  // Import necessary Modules by simply importing the Wallet module
  import Universal from '@aeternity/aepp-sdk/es/ae/wallet' // import from SDK es-modules
  import Node from '@aeternity/aepp-sdk/es/node' // import from SDK es-modules
  
  async function init () {
    const node = await Node({ url, internalUrl })
    
    const sdkInstance = await Universal({
        nodes: [{ name: 'test-net-node', instance: node }],    
        compilerUrl: 'COMPILER_URL_HERE',
        accounts: [MemoryAccount({keypair: {secretKey: 'PRIV_KEY_HERE', publicKey: 'PUB_KEY_HERE'}})],
        address: 'SELECTED_ACCOUNT_PUB_KEY_HERE',
      })
   // Spend transaction info 
   console.log(await sdkInstance.spend(parseInt(amount), 'RECEIVER_PUB_KEY'))
  }
 
```

### Low-level SDK usage (use [API](https://github.com/aeternity/protocol/tree/master/node/api) endpoints directly)
Example spend function, using the SDK, talking directly to the [**API**](https://github.com/aeternity/protocol/tree/master/node/api):
```js
  // Import necessary Modules
  import Tx from '@aeternity/aepp-sdk/es/tx/tx.js'
  import Chain from '@aeternity/aepp-sdk/es/chain/node.js'
  import Account from '@aeternity/aepp-sdk/es/account/memory.js'
  import Node from '@aeternity/aepp-sdk/es/node' // import from SDK es-modules

  async function spend (amount, receiver_pub_key) {
    const node = await Node({ url, internalUrl })
    const nodes = [{ name: 'testnet-node', instance: node }]

    const tx = await Tx({ nodes })
    const chain = await Chain({ nodes })
    const account = Account({keypair: {secretKey: 'PRIV_KEY_HERE', publicKey: 'PUB_KEY_HERE'}, networkId: 'NETWORK_ID_HERE'})
    const spendTx = await tx.spendTx({ sender: 'PUB_KEY_HERE', receiver_pub_key, amount })

    const signed = await account.signTransaction(spendTx)
    return chain.sendTransaction(signed, opt)

  }
```
