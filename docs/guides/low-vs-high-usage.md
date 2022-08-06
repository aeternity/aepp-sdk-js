# Low vs High level API

## Interactions

> "There are two approaches, purist and high-level."
*Alexander Kahl.*

The purist uses the functions generated out of the Swagger
file. After creating the SDK instance `aeSdk` with the AeSdk class it exposes a mapping of all `operationId`s as functions, converted to camelCase (from PascalCase). So e.g. in order to get a transaction
based on its hash you would invoke `aeSdk.api.getTransactionByHash('th_...')`.

In this way the SDK is simply a mapping of the raw API calls into
JavaScript. It's excellent for low-level control, and as a teaching tool to
understand the node's operations. Most real-world requirements involves a series
of chain operations, so the SDK provides abstractions for these.

## (**Recommended**) High-level SDK usage
Example spend function, using æternity's SDK abstraction.

```js
import { MemoryAccount, Node, AeSdk } from '@aeternity/aepp-sdk'

async function init () {
  const node = new Node('https://testnet.aeternity.io') // ideally host your own node!

  const aeSdk = new AeSdk({
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [new MemoryAccount('<SECRET_KEY_HERE>')],
  })

  // log transaction info
  console.log(await aeSdk.spend(100, 'ak_...'))
}
```

## Low-level SDK usage (use [API](https://aeternity.com/protocol/node/api) endpoints directly)
Example spend function, using the SDK, talking directly to the [**API**](https://aeternity.com/protocol/node/api):
```js
import { MemoryAccount, Node, AeSdk, Tag } from '@aeternity/aepp-sdk'

async function spend (amount, recipient) {
  const node = new Node('https://testnet.aeternity.io') // ideally host your own node!
  const aeSdk = new AeSdk({
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [new MemoryAccount('<SECRET_KEY_HERE>')],
  })

  // builds an unsigned SpendTx using integrated transaction builder
  const spendTx = await aeSdk.buildTx(Tag.SpendTx, {
    senderId: aeSdk.address,
    recipientId: recipient,
    amount, // aettos
    payload: 'using low-level api is funny'
  })

  // sign the encoded transaction
  const signedTx = await aeSdk.signTransaction(spendTx)

  // broadcast the signed tx to the node
  console.log(await aeSdk.api.postTransaction({tx: signedTx}))
}
```

Following functions are available with the low-level API right now:

```js
console.log(aeSdk.api)
/*
{
  getTopHeader: [AsyncFunction (anonymous)],
  getCurrentKeyBlock: [AsyncFunction (anonymous)],
  getCurrentKeyBlockHash: [AsyncFunction (anonymous)],
  getCurrentKeyBlockHeight: [AsyncFunction (anonymous)],
  getPendingKeyBlock: [AsyncFunction (anonymous)],
  getKeyBlockByHash: [AsyncFunction (anonymous)],
  getKeyBlockByHeight: [AsyncFunction (anonymous)],
  getMicroBlockHeaderByHash: [AsyncFunction (anonymous)],
  getMicroBlockTransactionsByHash: [AsyncFunction (anonymous)],
  getMicroBlockTransactionByHashAndIndex: [AsyncFunction (anonymous)],
  getMicroBlockTransactionsCountByHash: [AsyncFunction (anonymous)],
  getCurrentGeneration: [AsyncFunction (anonymous)],
  getGenerationByHash: [AsyncFunction (anonymous)],
  getGenerationByHeight: [AsyncFunction (anonymous)],
  getAccountByPubkey: [AsyncFunction (anonymous)],
  getAccountByPubkeyAndHeight: [AsyncFunction (anonymous)],
  getAccountByPubkeyAndHash: [AsyncFunction (anonymous)],
  getPendingAccountTransactionsByPubkey: [AsyncFunction (anonymous)],
  getAccountNextNonce: [AsyncFunction (anonymous)],
  protectedDryRunTxs: [AsyncFunction (anonymous)],
  getTransactionByHash: [AsyncFunction (anonymous)],
  getTransactionInfoByHash: [AsyncFunction (anonymous)],
  postTransaction: [AsyncFunction (anonymous)],
  getContract: [AsyncFunction (anonymous)],
  getContractCode: [AsyncFunction (anonymous)],
  getContractPoI: [AsyncFunction (anonymous)],
  getOracleByPubkey: [AsyncFunction (anonymous)],
  getOracleQueriesByPubkey: [AsyncFunction (anonymous)],
  getOracleQueryByPubkeyAndQueryId: [AsyncFunction (anonymous)],
  getNameEntryByName: [AsyncFunction (anonymous)],
  getChannelByPubkey: [AsyncFunction (anonymous)],
  getPeerPubkey: [AsyncFunction (anonymous)],
  getStatus: [AsyncFunction (anonymous)],
  getChainEnds: [AsyncFunction (anonymous)]
}
*/
```
