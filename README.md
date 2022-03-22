# [æternity](https://aeternity.com)'s JavaScript SDK

[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/aeternity/aepp-sdk-js.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/aeternity/aepp-sdk-js/context:javascript)
[![npm](https://img.shields.io/npm/v/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)
[![npm](https://img.shields.io/npm/l/@aeternity/aepp-sdk.svg)](https://www.npmjs.com/package/@aeternity/aepp-sdk)

JavaScript SDK for the revolutionary [æternity] blockchain, targeting the
[æternity node] implementation. The aepp-sdk is [hosted on GitHub].

[æternity]: https://aeternity.com
[æternity node]: https://github.com/aeternity/aeternity
[hosted on GitHub]: https://github.com/aeternity/aepp-sdk-js

## Guides & Examples

Introduction
- [Installation](docs/index.md)
- [Quick Start](docs/quick-start.md)

Usage guides:
- [AENS](docs/guides/aens.md) (æternity naming system)
- [Contracts](docs/guides/contracts.md)
- [Contract Events](docs/guides/contract-events.md)
- [Oracles](docs/guides/oracles.md)
- [PayingForTx](docs/guides/paying-for-tx.md) (Meta-Transactions)
- [Batch Transactions](docs/guides//batch-requests.md)
- [Error Handling](docs/guides/error-handling.md)
- [Low vs High level API](docs/guides/low-vs-high-usage.md)
- Wallet Interaction
    - [Connect an æpp to a wallet](docs/guides/connect-aepp-to-wallet.md)
    - [How to build a wallet](docs/guides/build-wallet.md)

There are also [examples](examples/README.md) that you can directly use and play with.

## CLI - Command Line Interface

To quickly test _all_ of æternity's blockchain features from your terminal, you can install and use the [CLI](https://github.com/aeternity/aepp-cli-js) by running:

1. `npm i -g @aeternity/aepp-cli` to globally install the CLI
2. `aecli --help` to get a list of possible commands

## Contributing

For advanced use, to get a deeper understanding of the SDK or to contribute to its development, it is advised to read the [Contributing Guidelines](docs/contrib/README.md) section.

## Changelog

We keep our [Changelog](docs/CHANGELOG.md) up to date.

## License

ISC License (ISC)
Copyright © 2018 æternity developers

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
