# [Æternity](https://aeternity.com/)'s JavaScript SDK

JavaScript SDK for the revolutionary [æternity] blockchain, targeting the
[æternity node] implementation. Aepp-sdk is [hosted on GitHub].

[æternity]: https://aeternity.com/
[æternity node]: https://github.com/aeternity/aeternity
[hosted on GitHub]: https://github.com/aeternity/aepp-sdk-js

[develop branch]: https://github.com/aeternity/aepp-sdk-js/tree/develop

## Table of content

  - [Table of content](#Table-of-content)
  - [Quick Start](./guides/quick-start.md)
    - [1. Install SDK](#1-Install-SDK)
      - [A) Simple Usage: with `&lt; script &gt;` tag](#A-Simple-Usage-with-script-tag)
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
