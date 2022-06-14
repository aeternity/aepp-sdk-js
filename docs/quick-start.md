# Quick Start
In this example we will send 1 _AE_ coin from one account to another

## 1. Specify imports
For the following snippets in the guide you need to specify multiple imports. Most imports like `Universal`, `MemoryAccount` & `Node` are [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) that compose certain functionalities. Others utility functions like `generateKeyPair` also can be imported.

```js
const {
  Universal,
  MemoryAccount,
  Node,
  AE_AMOUNT_FORMATS,
  generateKeyPair
} = require('@aeternity/aepp-sdk')
```

## 2. Create a Keypair for sender

```js
const keypair = generateKeyPair()
console.log(`Secret key: ${keypair.secretKey}`)
console.log(`Public key: ${keypair.publicKey}`)
```

## 3. Get some _AE_ using the Faucet
To receive some _AE_ you can use the [Faucet](https://faucet.aepps.com/). Just paste sender's publicKey, hit `Top UP` and you'll immediately get some test coins.

## 4. Interact with the æternity blockchain
This example shows:

- how to create an instance of the SDK using the `Universal` [Stamp](https://stampit.js.org/essentials/what-is-a-stamp)
- how to spend (send) 1 AE from the account the SDK instance was initialized with to some other AE address

```js
const NODE_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com' // required for contract interactions
const senderAccount = new MemoryAccount({
  // replace <SENDER_SECRET> and <SENDER_PUBLIC_KEY> with the generated keypair from step 2
  keypair: { secretKey: '<SENDER_SECRET>', publicKey: '<SENDER_PUBLIC_KEY>' }
});

(async function () {
  const node = new Node(NODE_URL)
  const aeSdk = await Universal({
    compilerUrl: COMPILER_URL,
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [senderAccount]
  })

  // spend one AE
  await aeSdk.spend(1, '<RECIPIENT_PUBLIC_KEY>', {
    // replace <RECIPIENT_PUBLIC_KEY>, Ideally you use public key from Superhero Wallet you have created before
    denomination: AE_AMOUNT_FORMATS.AE
  })
})()
```

Note:

- You may remove code from Step 2 as this serves only for one-time creation
- By default the `spend` function expects the amount to be spent in `aettos` (the smallest possible unit)
- Following the example snippet you would specify `AE` as denomination
- See [Testnet Explorer](https://explorer.testnet.aeternity.io/) and track your transactions
