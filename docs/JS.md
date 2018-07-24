# Documentation for the JS SDK

## Principles

The Javascript SDK wraps the æternity API, as explosed by [the swagger file](https://github.com/aeternity/epoch/blob/master/config/swagger.yaml). It aims to abstract the API, while still providing low-level access when necessary.

It uses the following Javascript technologies and principles:

- [Promises](https://developers.google.com/web/fundamentals/primers/promises) for interactions with the node.
- Classless Javascript using composition rather than inheritance, adhering to [Crockford's good Javascript](https://code.tutsplus.com/tutorials/crockford-on-javascript-the-complete-series--net-10952) rules
- modern modules, using `export` and `import`
- we attempt to be completely stateless, to avoid surprise interactions
- [webpack4](https://webpack.js.org/) and the [Babel](https://babeljs.io/) [loader](https://github.com/babel/babel-loader)
- standard linter
- [Ramda](https://ramdajs.com/)
- loose coupling of modules to enable [tree-shaking](https://webpack.js.org/guides/tree-shaking/)
- support for
  - direct-use in node scripts
  - direct use in browser `<script>` tags
  - bundling through webpack
  - source access via webpack, enabling tree-shaking

## Basic structure of an æpp (using JS SDK)

### Including the features you need

The available libraries provided my the SDK are:

* `Ae` - basic æternity structures and routines, including connecting to the node
* `Aens` - the naming system
* `Contract` -
* `Crypto` -
* `Wallet` - send, receive

### On providers

There are two ways that the SDK connects to an Epoch node--either via the public HTTP interface, or via the Websocket interface. By far the most common case, and the one which scales better, is to use the public interface, which accepts signed transactions and sends them to the blockchain. The Websocket interface requires the user to run a full Epoch node themselves. However it is useful for applications such as oracles, which provide services to the blockchain. Currently the two use-cases which require Websockets are oracles and state channels. Oracles is currently being rewritten to reflect recent changes in the SDK, and state channels are currently not completely implemented in æternity. Consequently you won't currently find any Websocket code in this document, and all provider statements look like this one:

```js
const {AeternityClient} = require('../index.js')
const {HttpProvider} = AeternityClient.providers

let client1 = new AeternityClient(new HttpProvider('localhost', 3013, {
  secured: false
}))
```
(from `examples/signing.js`):


the `examples/` directory in the JS SDK's github repo contains examples which exercise æternity's major components. [Here](http://aeternity.com) are the annotated source files. Here we present sections from

### Interactions

> "There are two approaches, purist and high-level."
*Alexander Kahl.*

The purist uses the functions generated out of the Swagger
file. After `create`ing the client and `await`ing it (or use `.then`),
it exposes a mapping of all `operationId`s as functions, converted to
camelCase (from PascalCase). So e.g. in order to get a transaction
based on its hash, you would invoke `client.api.getTx(query)`.

In this way the SDK is simply a mapping of the raw API calls into Javascript. It's excellent for low-level control, and as a teaching tool to understand the node's operations. Most real-world requirements involves a series of chain operations, so the SDK provides abstractions for these. The Javscript Promises framework makes this somewhat easy:

Example spend using the SDK abstraction (**high-level**):

```js
  // AE_SDK_MODULES could be a path or a webpack alias from webpack configuration
  import Wallet from '@aeternity/aepp-sdk/es/ae/wallet' // import from SDK es-modules

  Wallet({
    url: 'HOST_URL_HERE',
    accounts: [MemoryAccount({keypair: {priv: 'PRIV_KEY_HERE', pub: 'PUB_KEY_HERE'}})],
    address: 'PUB_KEY_HERE',
    onTx: confirm, // guard returning boolean
    onChain: confirm, // guard returning boolean
    onAccount: confirm // guard returning boolean
  }).then(ae => ae.spend(parseInt(amount), receiver))
```

The same code, using the SDK, talking directly to the API (**purist**):

```js

  import Tx from '@aeternity/aepp-sdk/es/tx/epoch.js'
  import Chain from '@aeternity/aepp-sdk/es/chain/epoch.js'
  import Account from '@aeternity/aepp-sdk/es/account/memory.js'

  async function spend (amount, recipient, options = {}) {
    // options:
    // { sender, recipient, amount, fee, ttl, nonce, payload }

    const tx = await Tx({url: 'HOST_URL_HERE'})
    const chain = await Chain({url: 'HOST_URL_HERE'})
    const account = Account({keypair: {priv: 'PRIV_KEY_HERE', pub: 'PUB_KEY_HERE'}})
    const spendTx = await tx.spendTx({sender: 'PUB_KEY_HERE', recipient, amount}))

    const signed = await account.signTransaction(spendTx, 'PUB_KEY_HERE')
    return chain.sendTransaction(signed, opt)

  }
```


