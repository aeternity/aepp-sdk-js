# Quick Start

## 1. Define imports
For the following snippets in the guide we specify multiple imports. Most imports like `Universal`, `MemoryAccount` & `Node` are [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) that compose certain functionalities. Others like `AmountFormatter` & `Crypto` are util modules with typical function exports.

```js
import {
  Universal,
  MemoryAccount,
  Node,
  AmountFormatter,
  Crypto
} from '@aeternity/aepp-sdk'
```

## 2. Create a Keypair

```js
  const keypair = Crypto.generateKeyPair()
  console.log(`Secret key: ${keypair.secretKey}`)
  console.log(`Public key: ${keypair.publicKey}`)
```

## 3. Get some _AE_ tokens using the Faucet
To receive some _AE_ you can use the [🚰 Faucet](https://faucet.aepps.com/). Just add your publicKey, and you'll immediately get some test tokens.

## 4. Interact with the aeternity blockchain
This example shows:

- how to initialize the SDK client using the `Universal` [Stamp](https://stampit.js.org/essentials/what-is-a-stamp)
- how to get the current block height
- how to spend 1 AE from the account the SDK was initialized with to some other AE address

```js
const NODE_URL = 'https://testnet.aeternity.io';
const COMPILER_URL = 'https://compiler.aepps.com'; // required for contract interactions (compiling and creating calldata)
const account = MemoryAccount({
  // replace <YOUR_SECRET> and <YOUR_PUBLIC_KEY> with the values from step 2
  keypair: { secretKey: '<YOUR_SECRET>', publicKey: '<YOUR_PUBLIC_KEY>' }
})

(async function () {
  const node = await Node({ url: NODE_URL })
  const client = await Universal({
     compilerUrl: COMPILER_URL,
     nodes: [ { name: 'testnet', instance: node } ],
     accounts: [ account ]
  })

  await client.height() // get top block height
  console.log('Current Block Height:', height)

  // spend one AE
  await client.spend(1, '<RECIPIENT_PUBLIC_KEY>', { // replace <RECIPIENT_PUBLIC_KEY>
      denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
  })
})()
```
