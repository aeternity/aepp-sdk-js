# [Æternity](https://aeternity.com/)'s Javascript SDK

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Build Status](https://ci.aepps.com/buildStatus/icon?job=aepp-sdk-js/develop)](https://ci.aepps.com/job/aepp-sdk-js/job/develop/)
[![npm](https://img.shields.io/npm/v/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)
[![npm](https://img.shields.io/npm/l/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)

JavaScript SDK for the revolutionary [æternity] blockchain, targeting the
[æternity node] implementation. Aepp-sdk is [hosted on GitHub].

[æternity]: https://aeternity.com/
[æternity node]: https://github.com/aeternity/aeternity
[hosted on GitHub]: https://github.com/aeternity/aepp-sdk-js

#### Disclaimer

This SDK is in continuos development where things can easily break. We aim to make all our
 releases as stable as possible, neverless it should not be taken as
production-ready.

To catch up with the more edgy state of development please
check out the [develop branch].

[develop branch]: https://github.com/aeternity/aepp-sdk-js/tree/develop

## Table of Content
1. [Quick Start](#quick-start)
2.


## Quick Start

### 1. Install the SDK
Add the latest `@aeternity/aepp-sdk` release from npmjs.com to your project using one of these commands

```bash
# install using npm...or yarn or pnpm
npm i @aeternity/aepp-sdk
```

**Note:** To install a _Pre-Release_ (latest `beta` or `alpha` version) using on the latest Node version, you have to install the package appending the `@next` tag reference, or even use the `#` symbol and the Repo URL to install a version coming from a specific branch.
```bash
# install the @next version of the SDK
npm i @aeternity/aepp-sdk@next

# install the #develop version of the SDK
npm i https://github.com/aeternity/aepp-sdk-js#develop
```

### 2. Import (a chosen Flavor)

Import the right [flavor](docs/usage.md). For this example with get the `Universal` flavor, which contains all the features of the SDK:

```js
import Ae from '@aeternity/aepp-sdk/es/ae/universal' // or other flavor
```

### 3. Start interacting with aeternity's blockchain

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

### 4. Check out the [Usage Documentation] to avoid common pitfalls.

[Usage Documentation]: docs/usage.md


## [Contributing]

For advanced use, to contribute to development of new versions and to get a deeper understanding of the SDK, it is advised to read the [Contributing] section.

[Contributing]: docs/contributing.md

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
