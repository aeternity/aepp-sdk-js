# Quick Start

## 1. Specify imports
For the following snippets in the guide you need to specify multiple imports. Most imports like `Universal`, `MemoryAccount` & `Node` are [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) that compose certain functionalities. Others utility functions like `generateKeyPair` also can be imported.

```js
import {
  Universal,
  MemoryAccount,
  Node,
  AE_AMOUNT_FORMATS,
  generateKeyPair
} from '@aeternity/aepp-sdk'
```

## 2. Create a Keypair

```js
  const keypair = generateKeyPair()
  console.log(`Secret key: ${keypair.secretKey}`)
  console.log(`Public key: ${keypair.publicKey}`)
```

## 3. Get some _AE_ using the Faucet
To receive some _AE_ you can use the [Faucet](https://faucet.aepps.com/). Just add your publicKey, and you'll immediately get some test coins.

## 4. Interact with the æternity blockchain
This example shows:

- how to create an instance of the SDK using the `Universal` [Stamp](https://stampit.js.org/essentials/what-is-a-stamp)
- how to get the current block height
- how to spend 1 AE from the account the SDK instance was initialized with to some other AE address

```js
const NODE_URL = 'https://testnet.aeternity.io';
const COMPILER_URL = 'https://compiler.aepps.com'; // required for contract interactions (compiling and creating calldata)
const account = MemoryAccount({
  // replace <YOUR_SECRET> and <YOUR_PUBLIC_KEY> with the values from step 2
  keypair: { secretKey: '<YOUR_SECRET>', publicKey: '<YOUR_PUBLIC_KEY>' }
})

(async function () {
  const node = await Node({ url: NODE_URL })
  const aeSdk = await Universal({
     compilerUrl: COMPILER_URL,
     nodes: [ { name: 'testnet', instance: node } ],
     accounts: [ account ]
  })

  const height = await aeSdk.height() // get top keyblock height
  console.log('Current Keyblock Height:', height)

  // spend one AE
  await aeSdk.spend(1, '<RECIPIENT_PUBLIC_KEY>', { // replace <RECIPIENT_PUBLIC_KEY>
      denomination: AE_AMOUNT_FORMATS.AE
  })
})()
```

Note:

- By default the `spend` function expects the amount to be spent in `aettos` (the smallest possible unit)
- Following the example snippet you would specify `AE` as denomination
