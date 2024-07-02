# Quick Start
In this example we will send 1 _AE_ coin from one account to another.
For more specific information on setups with Frameworks and TypeScript, please refer to the [installation instructions](./README.md).

## 1. Specify imports
For the following snippets in the guide you need to specify multiple imports.

```js
const {
  AeSdk,
  MemoryAccount,
  Node,
  CompilerHttp,
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

- how to create an instance of the SDK using the `Aesdk` class
- how to spend (send) 1 AE from the account the SDK instance was initialized with to some other AE address

```js
const NODE_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://v8.compiler.aepps.com' // required for contract interactions
// replace <SENDER_SECRET_KEY> with the generated secretKey from step 2
const senderAccount = new MemoryAccount('<SENDER_SECRET_KEY>');

(async function () {
  const node = new Node(NODE_URL)
  const aeSdk = new AeSdk({
    onCompiler: new CompilerHttp(COMPILER_URL),
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [senderAccount],
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
