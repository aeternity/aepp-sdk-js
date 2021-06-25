# Low vs High level API

## Interactions

> "There are two approaches, purist and high-level."
*Alexander Kahl.*

The purist uses the functions generated out of the Swagger
file. After instantiating a `client` with the Universal Stamp it exposes a mapping of all `operationId`s as functions, converted to camelCase (from PascalCase). So e.g. in order to get a transaction
based on its hash you would invoke `client.api.getTransactionByHash('th_...')`.

In this way the SDK is simply a mapping of the raw API calls into
JavaScript. It's excellent for low-level control, and as a teaching tool to
understand the node's operations. Most real-world requirements involves a series
of chain operations, so the SDK provides abstractions for these.

## (**Recommended**) High-level SDK usage
Example spend function, using aeternity's SDK abstraction.

```js
import { MemoryAccount, Node, Universal } from '@aeternity/aepp-sdk'

async function init () {
  const node = await Node({ 'https://testnet.aeternity.io' }) // ideally host your own node!

  const client = await Universal({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: 'https://compiler.aepps.com', // ideally host your own compiler!
    accounts: [MemoryAccount({keypair: {secretKey: '<PRIV_KEY_HERE>', publicKey: '<PUB_KEY_HERE>'}})],
  })

  // log transaction info
  console.log(await client.spend(100, 'ak_...'))
}
```

## Low-level SDK usage (use [API](https://github.com/aeternity/protocol/tree/master/node/api) endpoints directly)
Example spend function, using the SDK, talking directly to the [**API**](https://github.com/aeternity/protocol/tree/master/node/api):
```js
import { MemoryAccount, Node, Universal } from '@aeternity/aepp-sdk'

async function spend (amount, recipient) {
  const node = await Node({ 'https://testnet.aeternity.io' }) // ideally host your own node!
  const client = await Universal({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: 'https://compiler.aepps.com', // ideally host your own compiler!
    accounts: [MemoryAccount({keypair: {secretKey: '<PRIV_KEY_HERE>', publicKey: '<PUB_KEY_HERE>'}})],
  })

  // builds an unsigned SpendTx using the debug endpoint of the node's API
  const spendTxResponse = await client.api.postSpend({
      sender_id: await client.address(),
      recipient_id: recipient,
      fee: 18000000000000, // you must provide enough fee
      amount, // aettos
      payload: 'using low-level api is funny'
  })

  // sign the encoded transaction returned by the node
  const signedTx = await client.signTransaction(spendTxResponse.tx)

  // broadcast the signed tx to the node
  console.log(await client.api.postTransaction({tx: signedTx}))
}
```
