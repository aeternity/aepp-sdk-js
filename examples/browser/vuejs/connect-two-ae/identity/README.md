# Wallet/Identity Base Aepp

This is part of the [connect-two-aepp](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/connect-two-ae) example project.
Ths is an exmaple Aepp (Distributed App) that lives inside an Aeternity Wallet Aepp.

The [connect-two-aepp](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/connect-two-ae) example project has been created to showcase the aeternity SDK implementation for both Base/Wallet Aepps and "regular" Aepps "depending" on a base (Wallet/Identity) Aepp.

## Overview

This is a sample Wallet/Identity Aepp that expects an Aepp to be loaded into an iFrame contained into this base aepp.

### How it works

1. Start this base Aepp, which will start on port `9000`
2. Start the [sample Contract Aepp](https://github.com/aeternity/aepp-sdk-js/tree/develop/examples/connect-two-ae/aepp), which will start on port `9001`
3. Visit `localhost:9000` to see this Aepp included into the Identity (Wallet) Aepp

## Installation

1. Clone this repo with `git clone`
2. Install required dependencies with `yarn install`


## Start the application

```
yarn run start:dev
```

The current form should be self explainatory.

## Build Setup

``` bash
# install dependencies
yarn install

# serve with hot reload at localhost:9001
yarn run start:dev

# build for production with minification
yarn run build

```

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
