# Connect an æpp to a wallet

This guide describes the 4 steps that are necessary to connect your application to a wallet using the RPC API.

## Prerequisites

- Install [Superhero Wallet extension](https://wallet.superhero.com/) for simplicity of example.
  You can build your own wallet in the next example

## 1. Specify imports and constants

https://github.com/aeternity/aepp-sdk-js/blob/f60d1b8a1124b32781769342e4941c8dacf6ad53/examples/browser/aepp/src/StoreAeSdkPlugin.js#L1-L5

## 2. Initialize the `AeSdkAepp` class

https://github.com/aeternity/aepp-sdk-js/blob/f60d1b8a1124b32781769342e4941c8dacf6ad53/examples/browser/aepp/src/StoreAeSdkPlugin.js#L34-L49

## 3. Scan for wallets and connect to a wallet

https://github.com/aeternity/aepp-sdk-js/blob/f60d1b8a1124b32781769342e4941c8dacf6ad53/examples/browser/aepp/src/Connect.vue#L66-L85

Alternatively, aepp can request wallet to share node url it connected to. If agreed, then aepp can
connect to the wallet's node.

```js
await this.aeSdk.connectToWallet(wallet.getConnection(), {
  connectNode: true,
  name: 'wallet-node',
  select: true,
});
```

It can be used to

- improve responsiveness by connecting to the exact node that wallet uses;
- allow to connect aepps to private/development networks without changing their configuration;
- simplify configuration on aepp side.

Note:

- The steps above are snippets taken from the full implementation of
  the [Simple æpp](https://github.com/aeternity/aepp-sdk-js/blob/f60d1b8a1124b32781769342e4941c8dacf6ad53/examples/browser/aepp)
