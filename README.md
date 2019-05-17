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

This SDK is in continuos development where things can easily break, especially if you're not an officially released version. We aim to make all our
 releases as stable as possible, neverless it should not be taken as
production-ready.

To catch up with the more edgy state of development please
check out the [develop branch].

[develop branch]: https://github.com/aeternity/aepp-sdk-js/tree/develop

## Table of content
- [Æternity's Javascript SDK](#%C3%A6ternitys-javascript-sdk)
      - [Disclaimer](#disclaimer)
  - [Table of content](#table-of-content)
  - [⚡ Quick Start](#%E2%9A%A1-quick-start)
    - [1. Install the SDK](#1-install-the-sdk)
    - [2. Import (a chosen Flavor)](#2-import-a-chosen-flavor)
    - [3. Create an Account and get some _AEs_](#3-create-an-account-and-get-some-aes)
  - [⚡ Examples](#%E2%9A%A1-examples)
    - [VueJS (maintained) Examples](#vuejs-maintained-examples)
    - [1. Universal Example (_all_ SDK's functionalities)](#1-universal-example-all-sdks-functionalities)
    - [2. Wallet Example (_only_ Wallet's functionalities)](#2-wallet-example-only-wallets-functionalities)
    - [3. Aepp Example (Aepp <--> Wallet via RPC)](#3-aepp-example-aepp----wallet-via-rpc)
  - [Usage Documentation](#usage-documentation)
  - [CLI - Command Line Client](#cli---command-line-client)
  - [Contributing](#contributing)
  - [Change Log](#change-log)
  - [License](#license)

## ⚡ Quick Start

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

### 3. Create an Account and get some _AEs_
You can do many more things now, but you'll probably have to start by:

1. Create an account using the [💻 CLI](#cli---command-line-client)
2. Give yourself some initial _AEs_ using the [🚰 Faucet Aepp](https://faucet.aepps.com/)
3. Enjoy building Aepps 🤓

## ⚡ Examples

### VueJS (maintained) Examples

1. [Wallet + Aepp RPC setup](/examples/connect-two-ae)
2. [Suggest another example](https://github.com/aeternity/aepp-sdk-js/issues/new)

### 1. Universal Example (_all_ SDK's functionalities)
> interact with aeternity's blockchain's [**Universal flavor**](docs/usage.md)

```js
// Start the instance using Universal flavor
import Ae from '@aeternity/aepp-sdk/es/ae/universal'

Ae({
  url: 'https://sdk-testnet.aepps.com',
  internalUrl: 'https://sdk-testnet.aepps.com',
  compilerUrl: 'https://compiler.aepps.com',
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

### 2. Wallet Example (_only_ Wallet's functionalities)
> interact with aeternity's blockchain's [**Wallet flavor**](docs/usage.md) – For _Wallet_ development
> You can find a more [complete example using VueJS here](examples/connect-two-ae)


```js
// Start the instance using Wallet flavor
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet'
const walletBalance

// Simple function to Guard SDK actions
const confirmDialog = function (method, params, {id}) {
  return Promise.resolve(window.confirm(`User ${id} wants to run ${method} ${params}`))
}

Wallet({
  url: 'https://sdk-testnet.aepps.com',
  internalUrl: 'https://sdk-testnet.aepps.com',
  compilerUrl: 'https://compiler.aepps.com',
  accounts: [
    MemoryAccount({
      keypair: {
                  secretKey: 'secr3tKeYh3RE',
                  publicKey: 'ak_pUbL1cH4sHHer3'
                }
    })
  ],
  address: 'ak_pUbL1cH4sHHer3',
  onTx: confirmDialog,
  onChain: confirmDialog,
  onAccount: confirmDialog,
  onContract: confirmDialog,
  networkId: 'aet_ua' // or any other networkId your client should connect to
}).then(ae => {

  // Interact with the blockchain!
  ae.balance(this.pub).then(balance => {
    walletBalance = balance
  }).catch(e => {
    walletBalance = 0
  })
})
```

### 3. Aepp Example (Aepp <--> Wallet via RPC)
> interact with aeternity's blockchain's [**Aepp flavor**](docs/usage.md) – For _Aepps_ development AKA DApp development
> You can find a more [complete example using VueJS here](examples/connect-two-ae)


```js
// Start the instance using Aepp flavor
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'
const pubKey

// Here, we're not initialising anything, assuming that this is an Aepp (DApp)
// working inside an Iframe of a "Wallet flavored" JS App
Aepp().then(ae => {

  // Interact with the blockchain!
  ae.address()
    .then(address => {
      //get address of the Wallet used by this Aepp
      pubKey = address
    })
    .catch(e => { console.log(`Rejected: ${e}`) })
})
```

## Usage Documentation

Generic [Usage Documentation](docs/usage.md).

## CLI - Command Line Client

To quickly test _all_ of Aeternity's blockchain features from your Terminal, you can Install and use our **NodeJS [CLI](https://github.com/aeternity/aepp-cli-js)** by running:

1. `npm i -g @aeternity/aepp-cli` to globally install the CLI
2. `aecly --help` to get a list of possible commands

_eg._ Create an Account:

`aecli account create testWhateverAccountName`


## Contributing

For advanced use, to get a deeper understanding of the SDK or to contribute to its development, it is advised to read the [Contributing Guidelines](docs/contributing.md) section.

## Change Log

We keep our [Changelog](CHANGELOG.md) up to date.

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

