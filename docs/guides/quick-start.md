# Quick Start

## 1. Setup the SDK
### A) Simple Usage: with `<script>` tag
For those not using any JS bundling/complilation or compilation technique or tools like [_CodePen_](https://codepen.io/pen/) or similar online Editors, please check our [**Import SDK bundle with `<script>` tag**](import-script-tag.md).

If you're using bundling/compilation techniques (e.g. `webpack`), please continue reading.

### B) Advanced Usage: with `npm` or similar

#### Latest Release

```bash
npm i @aeternity/aepp-sdk
```

#### Pre Release
To install a _Pre-Release_ (latest `beta` or `alpha` version) you have to install the package appending the `@next` tag reference.
```bash
npm i @aeternity/aepp-sdk@next
```

#### Specific Github Branch
You can also install a version coming from a specific branch. In this case you would install the SDK version of the `develop` branch.
```bash
npm i github:aeternity/aepp-sdk-js#develop
```

------------------------------

**Note**: If you experience errors during the installation, you might need to install build tools for your OS.

**Windows: Windows Build Tools**
```bash
npm install -g windows-build-tools
```

**Ubuntu / Debian: Build Essential**
```bash
sudo apt-get update
sudo apt-get install build-essential
```

**Mac**

Download [Xcode](https://apps.apple.com/de/app/xcode/id497799835?mt=12) from AppStore, then run
```
xcode-select --install
```

### C) Using the Command Line Interface (CLI)
If you don't need to include specific functionality into your application and just want to use or play around with features the SDK provides you can make use of the [💻 CLI](https://github.com/aeternity/aepp-cli-js) and follow the instructions mentioned there.

## 2. Import modules
For the following snippets in the guide we specify multiple module imports. Most of the modules like `Universal`, `MemoryAccount` & `Node` are [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) that compose certain functionalities. Other modules like `AmountFormatter` & `Crypto` are just utils with regular function exports.

```js
import {
  Universal,
  MemoryAccount,
  Node,
  AmountFormatter,
  Crypto
} from '@aeternity/aepp-sdk'
```

## 3. Create an Account

```js
  const keypair = Crypto.generateKeyPair()
  console.log(`Secret key: ${keypair.secretKey}`)
  console.log(`Public key: ${keypair.publicKey}`)
```

## 4. Get some _AE_ tokens on Testnet
To receive some _AE_ you can use the [🚰 Faucet Aepp](https://faucet.aepps.com/). Just add your publicKey, and you'll immediately get some test tokens.

## 5. Interact with the aeternity blockchain
This example shows:

- how to initialize the SDK client using the `Universal` [Stamp](https://stampit.js.org/essentials/what-is-a-stamp)
- how to get the current block height
- how to spend 1 AE from the account the SDK was inizialized with to some AE address

```js
const NODE_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com' // required for contract interactions (compiling and creating calldata)
const account = MemoryAccount({ keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' } }) // replace secretKey and publicKey

(async function () {
  const node = await Node({ url: NODE_URL })
  const client = await Universal({
     compilerUrl: COMPILER_URL,
     nodes: [ { name: 'testnet', instance: node } ],
     accounts: [ account ]
  })

  await client.height() // get top block height
  console.log('Current Block Height:', height)

  // spend one AE
  await client.spend(1, 'ak_asd23dasdasda...', {
      denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
  })
})()
```
