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
  - [Quick Start](#quick-start)
    - [1. Install the SDK](#1-install-the-sdk)
    - [2. Import (a chosen Flavor)](#2-import-a-chosen-flavor)
    - [3. Create an Account and get some _AEs_](#3-create-an-account-and-get-some-aes)
  - [Guides & Examples](#guides--examples)
  - [CLI - Command Line Client](#cli---command-line-client)
  - [Contributing](#contributing)
  - [Change Log](#change-log)
  - [License](#license)

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

### 2. Create a Keypair

```javascript
import { Crypto } from '@aeternity/aepp-sdk/es'
const keypair = Crypto.generateKeyPair()
console.log(`Secret key: ${keypair.secretKey}`)
console.log(`Public key: ${keypair.publicKey}`)
```

### 3. Give yourself some _AEs_

Paste your public key in the [🚰 Faucet Aepp](https://faucet.aepps.com/) and enjoy some initial _AEs_ for testing!

## Guides & Examples

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

