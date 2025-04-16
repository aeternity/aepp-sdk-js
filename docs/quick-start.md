# Quick Start

In this example we will send 1 _AE_ coin from one account to another.
For more specific information on setups with Frameworks and TypeScript, please refer to the [installation instructions](./README.md).

## 1. Specify imports

For the following snippets in the guide you need to specify multiple imports.

```js
const { AeSdk, AccountMemory, Node, AE_AMOUNT_FORMATS } = require('@aeternity/aepp-sdk');
```

## 2. Create a sender account

```js
const sender = AccountMemory.generate();
console.log('Sender address:', sender.address);
console.log('Sender secret key:', sender.secretKey);
```

## 3. Get some _AE_ using the Faucet

To receive some _AE_ you can use the [Faucet](https://faucet.aepps.com/). Just paste sender's address, hit `Top UP` and you'll immediately get some test coins.

## 4. Interact with the æternity blockchain

This example shows:

- how to create an instance of the SDK using the `AeSdk` class
- how to spend (send) 1 AE from the account the SDK instance was initialized with to some other AE address

```js
const NODE_URL = 'https://testnet.aeternity.io';
// replace <SENDER_SECRET_KEY> with the generated secretKey from step 2
const sender = new AccountMemory('<SENDER_SECRET_KEY>');

(async function () {
  const node = new Node(NODE_URL);
  const aeSdk = new AeSdk({
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [sender],
  });

  // spend one AE
  await aeSdk.spend(1, '<RECIPIENT_ADDRESS>', {
    // replace <RECIPIENT_ADDRESS>, Ideally you use address from Superhero Wallet you have created before
    denomination: AE_AMOUNT_FORMATS.AE,
  });
})();
```

Note:

- You may remove code from Step 2 as this serves only for one-time creation
- By default the `spend` function expects the amount to be spent in `aettos` (the smallest possible unit)
- Following the example snippet you would specify `AE` as denomination
- See [Testnet Explorer](https://testnet.aescan.io/) and track your transactions
