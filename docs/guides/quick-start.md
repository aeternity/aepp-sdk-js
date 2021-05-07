# Quick Start

## 1. Install SDK
### A) Simple Usage: with `<script>` tag
For those not using any JS bundling/complilation or compilation technique or tools like [_Codepen_](https://codepen.io/pen/) or similar online Editors, please check our [**Import SDK bundle with `<script>` tag**](import-script-tag.md).

If you're using bundling/compilation techniques (eg. `webpack`), please continue reading.

### B) Advanced Usage: with `npm` or similar
Add the latest `@aeternity/aepp-sdk` release from npmjs.com to your project using one of these commands

```bash
# install using npm
npm i @aeternity/aepp-sdk
```

**Note:** To install a _Pre-Release_ (latest `beta` or `alpha` version) using on the latest Node version, you have to install the package appending the `@next` tag reference, or even use the `#` symbol and the Repo URL to install a version coming from a specific branch.
```bash
# install the @next version of the SDK
npm i @aeternity/aepp-sdk@next

# install the #develop version of the SDK
npm i github:aeternity/aepp-sdk-js#develop
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

## 2. Create an Account
You can do many more things now, but you'll probably have to start with:

### A) Using the Command Line
Create an account using the [💻 CLI](https://github.com/aeternity/aepp-cli-js)

### B) Using the SDK

```javascript
  import { Crypto } from '@aeternity/aepp-sdk'
  const keypair = Crypto.generateKeyPair()
  console.log(`Secret key: ${keypair.secretKey}`)
  console.log(`Public key: ${keypair.publicKey}`)
```

## 3. Give yourself some _AE_ tokens
To get yourself some _AEs_ you can use the [🚰 Faucet Aepp](https://faucet.aepps.com/). Just add your publicKey, and you'll immediately get some test tokens.


## 4. Import (a chosen Flavor)

Import the right [flavor](../README.md#flavors--entry-points). For this example with get the `Universal` flavor, which contains all the features of the SDK:

```js
// Import Flavor
import { Universal } from '@aeternity/aepp-sdk' // or other flavor
```

## 5. Play with Aetenity's blockchain features

```js
// Use Flavor
import { Universal, MemoryAccount, Node, AmountFormatter } from '@aeternity/aepp-sdk'

const NODE_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com' // required for using Contract
const account = MemoryAccount({ keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' } })

(async function () {
  const nodeInstance = await Node({ url: NODE_URL })
  const sdkInstance = await Universal({
     compilerUrl: COMPILER_URL,
     nodes: [ { name: 'test-net', instance: nodeInstance } ],
     accounts: [ account ]
  })

  await sdkInstance.height() // get top block height
  console.log('Current Block Height:', height)

  // spend one AE
  await sdkInstance.spend(1, 'ak_asd23dasdasda...', {
      denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE
  })
})()
```
