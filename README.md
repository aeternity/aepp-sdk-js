# [Æternity](https://aeternity.com/)'s Javascript SDK

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Build Status](https://ci.aepps.com/buildStatus/icon?job=aepp-sdk-js/develop)](https://ci.aepps.com/job/aepp-sdk-js/job/develop/)
[![npm](https://img.shields.io/npm/v/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)
[![npm](https://img.shields.io/npm/l/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk) [![Greenkeeper badge](https://badges.greenkeeper.io/aeternity/aepp-sdk-js.svg)](https://greenkeeper.io/)

JavaScript SDK for the revolutionary [æternity] blockchain, targeting the
[æternity node] implementation. Aepp-sdk is [hosted on GitHub].

[æternity]: https://aeternity.com/
[æternity node]: https://github.com/aeternity/aeternity
[hosted on GitHub]: https://github.com/aeternity/aepp-sdk-js

[develop branch]: https://github.com/aeternity/aepp-sdk-js/tree/develop

## Table of content
- [Æternity's Javascript SDK](#%C3%86ternitys-Javascript-SDK)
  - [Table of content](#Table-of-content)
  - [Quick Start](#Quick-Start)
    - [1. Install SDK](#1-Install-SDK)
      - [A) Simple Usage: with `<script>` tag](#A-Simple-Usage-with-script-tag)
      - [B) Advanced Usage: with `npm` or similar](#B-Advanced-Usage-with-npm-or-similar)
    - [2. Create an Account](#2-Create-an-Account)
      - [A) Using the Command Line](#A-Using-the-Command-Line)
      - [B) Using the SDK](#B-Using-the-SDK)
    - [3. Give yourself some _AE_ tokens](#3-Give-yourself-some-AE-tokens)
    - [4. Import (a chosen Flavor)](#4-Import-a-chosen-Flavor)
    - [5. Play with Aetenity's blockchain features](#5-Play-with-Aetenitys-blockchain-features)
  - [More: Guides & Examples](#More-Guides--Examples)
  - [CLI - Command Line Client](#CLI---Command-Line-Client)
  - [Contributing](#Contributing)
  - [Change Log](#Change-Log)
  - [License](#License)

## Quick Start

### 1. Install SDK
#### A) Simple Usage: with `<script>` tag
For those not using any JS bundling/complilation or compilation technique or tools like [_Codepen_](https://codepen.io/pen/) or similar online Editors, please check our [**Import SDK bundle with `<script>` tag**](docs/guides/import-script-tag.md).

If you're using bundling/compilation techniques (eg. `webpack`), please continue reading.

#### B) Advanced Usage: with `npm` or similar
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

**Note** : If you experience errors during the installation, you might need to install build tools for your OS.

Windows: Windows Build Tools
```
npm install -g windows-build-tools
```
Ubuntu / Debian: Build Essential
```
sudo apt-get update
sudo apt-get install build-essential
```
Mac:
Download [Xcode](https://apps.apple.com/de/app/xcode/id497799835?mt=12) from AppStore, then run
```
xcode-select --install
```

### 2. Create an Account
You can do many more things now, but you'll probably have to start with:

#### A) Using the Command Line
Create an account using the [💻 CLI](#cli---command-line-client)

#### B) Using the SDK

```javascript
  import { Crypto } from '@aeternity/aepp-sdk/es'
  const keypair = Crypto.generateKeyPair()
  console.log(`Secret key: ${keypair.secretKey}`)
  console.log(`Public key: ${keypair.publicKey}`)
```

### 3. Give yourself some _AE_ tokens
To get yourself some _AEs_ you can use the [🚰 Faucet Aepp](https://faucet.aepps.com/). Just add your publicKey, and you'll immediately get some test tokens.


### 4. Import (a chosen Flavor)

Import the right [flavor](docs/README.md#flavors--entry-points). For this example with get the `Universal` flavor, which contains all the features of the SDK:

```js
// Import Flavor
import Ae from '@aeternity/aepp-sdk/es/ae/universal' // or other flavor
```

### 5. Play with Aetenity's blockchain features

```js
// Use Flavor
import Ae from '@aeternity/aepp-sdk/es/ae/universal' // or other flavor
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory' // or other flavor
import Node from '@aeternity/aepp-sdk/es/node' // or other flavor

Promise.all([
  Node({ url, internalUrl })
]).then(nodes => {
    Ae({
        // This two params deprecated and will be remove in next major release
        url: 'https://sdk-testnet.aepps.com',
        internalUrl: 'https://sdk-testnet.aepps.com',
        // instead use
        nodes: [
          { name: 'someNode', instance: nodes[0] },
        // mode2
        ],
        compilerUrl: 'COMPILER_URL',
        // `keypair` param deprecated and will be removed in next major release
        keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' },
        // instead use
        accounts: [
          MemoryAccount({ keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' } }),
        // acc2
        ],
        address: 'SELECTED_ACCOUNT_PUB',
        networkId: 'ae_uat' // or any other networkId your client should connect to
    }).then(ae => {
      // Interacting with the blockchain client
      // getting the latest block height
      ae.height().then(height => {
        // logs current height
        console.log('Current Block Height:', height)
      }).catch(e => {
        // logs error
        console.log(e)
      })
    })
})

```

## More: Guides & Examples

Check out our [Guides](docs/README.md) and [Examples](examples/README.md).

## CLI - Command Line Client

To quickly test _all_ of Aeternity's blockchain features from your Terminal, you can Install and use our **NodeJS [CLI](https://github.com/aeternity/aepp-cli-js)** by running:

1. `npm i -g @aeternity/aepp-cli` to globally install the CLI
2. `aecli --help` to get a list of possible commands

_eg._ Create an Account:

`aecli account create testWhateverAccountName`

## Contributing

For advanced use, to get a deeper understanding of the SDK or to contribute to its development, it is advised to read the [Contributing Guidelines](docs/contrib/README.md) section.

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
