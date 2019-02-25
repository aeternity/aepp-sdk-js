# aepp-sdk

[![Build Status](https://ci.aepps.com/buildStatus/icon?job=aepp-sdk-js/develop)](https://ci.aepps.com/job/aepp-sdk-js/job/develop/)
[![npm](https://img.shields.io/npm/v/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)
[![npm](https://img.shields.io/npm/l/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)

JavaScript SDK for the revolutionary [æternity] blockchain, targeting the
[æternity node] implementation.

aepp-sdk is [hosted on GitHub].

![Concept Drawing of aepp-sdk][concept]

[concept]: concept.png "Concept Drawing of aepp-sdk"

[æternity]: https://aeternity.com/
[æternity node]: https://github.com/aeternity/aeternity
[hosted on GitHub]: https://github.com/aeternity/aepp-sdk-js

#### Disclaimer

This SDK is at an alpha stage where things easily can break. We aim to make our
alpha releases as stable as possible. Neverless it should not be taken as
production-ready. To catch up with the more edgy state of development please
check out the [develop branch].

[develop branch]: https://github.com/aeternity/aepp-sdk-js/tree/develop

## [Usage Documentation]

1. Add the latest `@aeternity/aepp-sdk` release from npmjs.com to your project using one of these commands

```bash
pnpm i @aeternity/aepp-sdk
# or
npm i @aeternity/aepp-sdk
# or
yarn add @aeternity/aepp-sdk
```

**Note:** To install a _Pre-Release_ (latest `beta` or `alpha` version) using on the latest Node version, you have to install the package appending the `@next` tag reference.
```bash
pnpm i @aeternity/aepp-sdk@next
npm i @aeternity/aepp-sdk@next
yarn add @aeternity/aepp-sdk@next
```

> Hint: You can also add a development version from GitHub by dropping the `@` and
> adding `#` and a branch name at the end, for example
> `pnpm i aeternity/aepp-sdk#develop`.

2. Import the right flavor. For this example with get the `Universal` flavor, which contains all the features of the SDK:

```js
import Ae from '@aeternity/aepp-sdk/es/ae/universal' // or any other flavor
```

3. Create an instance and interact with it

```js

// Start the instance

Ae({
  url: 'https://sdk-testnet.aepps.com',
  internalUrl: 'https://sdk-testnet.aepps.com',
  keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' },
  networkId: 'aet_ua' // or any other networkId your client should connect to
}).then(ae => {

  // Interacting with the blockchain client

  // getting the latest block height
  ae.height().then(height => {
    // logs current height
    console.log('height', height)
  }).catch(e => {
    // logs error
    console.log(e)
  })

  // getting the balance of a public address
  ae.balance('A_PUB_ADDRESS').then(balance => {
    // logs current balance of "A_PUB_ADDRESS"
    console.log('balance', balance)
  }).catch(e => {
    // logs error
    console.log(e)
  })
})
```

4. **IMPORTANT:** 🤓 Check out the [Usage Documentation] to avoid common pitfalls!

[Usage Documentation]: docs/usage.md


> Remember: you can also "compose" your own flavor by mixing 2 or more flavors likes so:

```js
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet.js'
import Contract from '@aeternity/aepp-sdk/es/ae/contract.js'
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory.js'

// make a "mixed flavor" containing Wallet and Contracts flavors
Wallet.compose(Contract)({
            url: 'https://sdk-testnet.aepps.com',
            internalUrl: 'https://sdk-testnet.aepps.com',
            accounts: [MemoryAccount({keypair: {secretKey: account.priv, publicKey: account.pub}})],
            address: account.pub,
            onTx: true, // or a function to Guard the Rpc client
            onChain: true, // or a function to Guard the Rpc client
            onAccount: true, // or a function to Guard the Rpc client
            networkId: 'ae_uat'
          }).then(ae => {
            // ae is your initialised client now! :)
            // ...
```
## [Hacking]

For advanced use, development versions and to get a deeper understanding of the
SDK, it is advised to read the [Hacking] documentation.

[Hacking]: docs/hacking.md

## [API]

[API]: docs/api.md

## [Change Log]

[Change Log]: CHANGELOG.md

## License

ISC License (ISC)
Copyright © 2018 aeternity developers

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
