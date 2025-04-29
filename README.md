# [æternity](https://aeternity.com)'s JavaScript SDK

[![main action](https://github.com/aeternity/aepp-sdk-js/actions/workflows/main.yml/badge.svg)](https://github.com/aeternity/aepp-sdk-js/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/aeternity/aepp-sdk-js/branch/develop/graph/badge.svg?token=wON6gOciRP)](https://codecov.io/gh/aeternity/aepp-sdk-js)
[![docs](https://github.com/aeternity/aepp-sdk-js/actions/workflows/docs.yml/badge.svg)](https://github.com/aeternity/aepp-sdk-js/actions/workflows/docs.yml)
[![npm](https://img.shields.io/npm/v/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)
[![npm](https://img.shields.io/npm/l/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)

JavaScript SDK for the revolutionary [æternity] blockchain, targeting the
[æternity node] implementation. The aepp-sdk is [hosted on GitHub].

[æternity]: https://aeternity.com
[æternity node]: https://github.com/aeternity/aeternity
[hosted on GitHub]: https://github.com/aeternity/aepp-sdk-js

## Guides & Examples

Introduction

- [Installation](docs/README.md)
- [Quick Start](docs/quick-start.md)

Usage guides:

- [AENS](docs/guides/aens.md) (æternity naming system)
- [Contracts](docs/guides/contracts.md)
- [Contract Events](docs/guides/contract-events.md)
- [Oracles](docs/guides/oracles.md)
- [PayingForTx](docs/guides/paying-for-tx.md) (Meta-Transactions)
- [Batch Transactions](docs/guides/batch-requests.md)
- [Error Handling](docs/guides/error-handling.md)
- [Low vs High level API](docs/guides/low-vs-high-usage.md)
- [Typed data hashing and signing](docs/guides/typed-data.md)
- [Usage with TypeScript](docs/guides/typescript.md)
- [JWT usage](docs/guides/jwt.md)
- [Transaction options](docs/transaction-options.md)
- [Range of possible address length](docs/guides/address-length.md)
- Wallet Interaction
  - [Connect an æpp to a wallet](docs/guides/connect-aepp-to-wallet.md)
  - [How to build a wallet](docs/guides/build-wallet.md)
  - [Ledger Hardware Wallet](docs/guides/ledger-wallet.md)
  - [Aeternity snap for MetaMask](docs/guides/metamask-snap.md)

There are also [examples](examples/README.md) that you can directly use and play with.

### [API Reference](https://sdk.aeternity.io/v14.1.0/api/)

## CLI - Command Line Interface

To quickly test _all_ of æternity's blockchain features from your terminal, you can install and use the [CLI](https://github.com/aeternity/aepp-cli-js) by running:

1. `npm i -g @aeternity/aepp-cli` to globally install the CLI
2. `aecli --help` to get a list of possible commands

## Contributing

For advanced use, to get a deeper understanding of the SDK or to contribute to its development, it is advised to read the [Contributing Guidelines](docs/contrib/README.md) section.

## Changelog

We keep our [Changelog](docs/CHANGELOG.md) up to date.
