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
  import Wallet from '@aeternity/aepp-sdk/es/ae/wallet' // import from SDK es-modules
  import Node from '@aeternity/aepp-sdk/es/node' // import from SDK es-modules
  
  // const node1 = await Node({ url, internalUrl })

  Wallet({
    // This two params deprecated and will be remove in next major release
    url: 'https://sdk-testnet.aepps.com',
    internalUrl: 'https://sdk-testnet.aepps.com',
    // instead use
    nodes: [
        // { name: 'someNode', instance: node1 },
        // mode2
    ],    
    compilerUrl: 'COMPILER_URL_HERE',
    accounts: [MemoryAccount({keypair: {secretKey: 'PRIV_KEY_HERE', publicKey: 'PUB_KEY_HERE'}, networkId: 'NETWORK_ID_HERE'})],
    address: 'PUB_KEY_HERE',
    onTx: confirm, // guard returning boolean
    onChain: confirm, // guard returning boolean
    onAccount: confirm, // guard returning boolean
    onContract: confirm, // guard returning boolean
    networkId: 'ae_uat' // or any other networkId your client should connect to
  }).then(ae => ae.spend(parseInt(amount), receiver_pub_key))
```

### Low-level SDK usage (use [API](../docs/api.md) endpoints directly)
Example spend function, using the SDK, talking directly to the [**API**](../docs/api.md):
```js
  // Import necessary Modules
  import Tx from '@aeternity/aepp-sdk/es/tx/tx.js'
  import Chain from '@aeternity/aepp-sdk/es/chain/node.js'
  import Account from '@aeternity/aepp-sdk/es/account/memory.js'

  async function spend (amount, receiver_pub_key) {

    const tx = await Tx({url: 'HOST_URL_HERE', internalUrl: 'HOST_URL_HERE'})
    const chain = await Chain({url: 'HOST_URL_HERE', internalUrl: 'HOST_URL_HERE'})
    const account = Account({keypair: {secretKey: 'PRIV_KEY_HERE', publicKey: 'PUB_KEY_HERE'}, networkId: 'NETWORK_ID_HERE'})
    const spendTx = await tx.spendTx({ sender: 'PUB_KEY_HERE', receiver_pub_key, amount })

    const signed = await account.signTransaction(spendTx)
    return chain.sendTransaction(signed, opt)

  }
```
