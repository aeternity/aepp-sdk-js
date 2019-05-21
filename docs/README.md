# Using the Javascript SDK

There are three different ways of incorporating aepp-sdk-js into your project, depending on the particular scenario:
* ES Modules at `es/` (recommended)
* Node.js bundle at `dist/aepp-sdk.js`
* Browser bundle at `dist/aepp-sdk.browser.js`

Also, please be aware that using `require` instead of module loader syntax
(`import`) means that the default export automatically becomes exposed as
`default`, which is reflected below in the code examples. This is due to a
recent change in [Babel] compilation and fully compliant with the standard.

## Flavors

The recommended approach to using aepp-sdk is to import one of the following _Ae
Factories_ based on the specific use case:

* [@aeternity/aepp-sdk/es/ae/aepp](api/ae/aepp.md): **Web Aepp** development
* [@aeternity/aepp-sdk/es/ae/aens](api/ae/aens.md): **AENs** development
* [@aeternity/aepp-sdk/es/ae/wallet](api/ae/wallet.md): **Wallet** development
* [@aeternity/aepp-sdk/es/ae/oracle](api/ae/oracle.md): **Oracle** development
* [@aeternity/aepp-sdk/es/ae/contract](api/ae/contract.md): **Contract** development
* [@aeternity/aepp-sdk/es/ae/universal](api/ae/universal.md): **Universal** development (includes all SDK features)

In order to cater to more specific needs, it is recommended to refer to the
[hacking documentation](hacking.md).

## Testing Networks
When initialising a client, to test, you can choose from 2 URLs:

### **Testnet** (https://sdk-testnet.aepps.com)
You can use this URL with any releasee on [npmjs](https://www.npmjs.com/package/@aeternity/aepp-sdk). It offers the last stable version of [Node](https://github.com/aeternity/aeternity), used by all of of Aeternity's Dev Tools.

## ES Modules (enable Tree-Shaking)

It is generally advised to use ESM (EcmaScript Modules), whenever possible. At
this point however, this requires a modern _bundler_ which understands ES2015
`import/export` syntax, such as [webpack] 4 (or newer).

> In addition, **a compiler
which translates the subset of ES used by aepp-sdk will have to be used**, such as
[Babel] - `.babelrc` in the project's root directory, shows which transpilation plugins are required, at least.

### Common Mistakes/Pitfalls

1. **Dev Dependencies**: Make sure to do not forget to double check the `devDependencies` of the `package.json` of this SDK, looking for `@babel`/packages that might be helping you to correctly transpile the SDK code `import`ed into your project, as modules.

2. **ES Modules Transpilation**: Include all the babel packages and plugins needed to transpile _your_ code to the `.babelrc` (or `babel.config.js`) of your project.

3. **Bundlers Setup**: Do not forget to **allow your bundler (eg. _webpack_) to scan the SDK files** that needs transpilation. This will allow your bundler to transpile the SDK `import`ed modules correctly.


##### Webpack Example:
```js
 // ... webpack config
 entry: {
    rules: [
      {
        test: /\.js$/,
        // standard setting for most bundlers web-app setup
        // entirely excludes the node_modules folder
        exclude: [/node_modules/],
        // ...but when using external ES Modules you need to
        // include required externals ES modules (eg. our Aepp-SDK) like so:
        include: [/node_modules\/@aeternity/, /node_modules\/rlp/],
        loader: 'babel-loader'
      }
      // ... more rules here (SASS, CSS, etc.)
    }
  }
```

Using this method also enables the use of [Tree shaking] (dead code
elimination).
aepp-sdk's `package.json` specifies a seperate entry point for any such tool
that understands ESM. In order to make sure the modules are loaded directly, use
the following syntax to load parts of aepp-sdk:

```js
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'

Aepp().then(client => {
  client.height().then(height => {
    console.log('Current Block', height)
  })
})
```

[webpack]: https://webpack.js.org/
[Babel]: https://babeljs.io/
[Tree shaking]: https://webpack.js.org/guides/tree-shaking/

## Browser bundle

The browser bundle is relevant in two seperate cases: Either the SDK is to be
loaded traditionally through a `<script>` tag, or the bundler / compiliation is
not sufficient to use and compile the SDK's ES Modules.

### Browser `<script>` tag

The bundle will assign the SDK to a global `var` called `Ae`.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  <script src="aepp-sdk.browser.js"></script>
  <script type="text/javascript">
    Ae.Aepp.default().then(ae => {
      ae.height().then(height => {
        console.log('Current Block', height)
      })
    })
  </script>
</body>
</html>
```

### Bundler

The bundle is wrapped in UMD format, which is understood by webpack and
automatically used if no `/src` suffix is given.

```js
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'

Aepp().then(ae => {
  ae.height().then(height => {
    console.log('Current Block', height)
  })
})
```

## Node.js bundle

The Node.js bundle is primarily interesting for scripts which use non-transpiled
code, such as the ones provided in the `bin/` directory of the project.

```js
const {Universal: Ae} = require('@aeternity/aepp-sdk')

Ae({ url: 'https://sdk-testnet.aepps.com', internalUrl: 'https://sdk-testnet.aepps.com', compilerUrl: 'COMPILER_URL', keypair: 'YOUR_KEYPAIR_OBJECT' }).then(ae => {
  ae.height().then(height => {
    console.log('Current Block', height)
  })
})

// same with async
const main = async () => {
  const client = await Ae({url: 'https://sdk-testnet.aepps.com', internalUrl: 'https://sdk-testnet.aepps.com', compilerUrl: 'COMPILER_URL', keypair: 'YOUR_KEYPAIR_OBJECT'})
  const height = await client.height()
  console.log('Current Block', height)
}

main()
```

## [Vue.js]

Adding aepp-sdk to a Vue.js project requires nothing special, but it should be
noted that `Ae.create` is asynchronous which needs to be taken into account.

```bash
vue init webpack my-project
cd my-project
yarn add @aeternity/aepp-sdk
```

```html
# src/components/HelloWorld.vue

<script>
// import Aepp
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'
// Init Ae Client
const ae = Aepp()

export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  async mounted () {
    // Wait Ae client
    const client = await ae
    // Start Using Ae client
    const height = await client.height()
    this.msg = 'Current Block: ' + height
  }
}
</script>
```

[Vue.js]: https://vuejs.org/

## Basic structure of an æpp

### Interactions

> "There are two approaches, purist and high-level."
*Alexander Kahl.*

The purist uses the functions generated out of the Swagger
file. After `create`ing the client and `await`ing it (or use `.then`),
it exposes a mapping of all `operationId`s as functions, converted to
camelCase (from PascalCase). So e.g. in order to get a transaction
based on its hash, you would invoke `client.api.getTx(query)`.

In this way the SDK is simply a mapping of the raw API calls into
Javascript. It's excellent for low-level control, and as a teaching tool to
understand the node's operations. Most real-world requirements involves a series
of chain operations, so the SDK provides abstractions for these. The Javscript
Promises framework makes this somewhat easy:

### High-level SDK usage, recommended
Example spend function, using aeternity's SDK abstraction
```js
  // Import necessary Modules by simply importing the Wallet module
  import Wallet from '@aeternity/aepp-sdk/es/ae/wallet' // import from SDK es-modules

  Wallet({
    url: 'HOST_URL_HERE',
    internalUrl: 'HOST_URL_HERE',
    compilerUrl: 'COMPILER_URL_HERE',
    accounts: [MemoryAccount({keypair: {secretKey: 'PRIV_KEY_HERE', publicKey: 'PUB_KEY_HERE'}, networkId: 'NETWORK_ID_HERE'})],
    address: 'PUB_KEY_HERE',
    onTx: confirm, // guard returning boolean
    onChain: confirm, // guard returning boolean
    onAccount: confirm, // guard returning boolean
    onContract: confirm, // guard returning boolean
    networkId: 'ae_uat' // or any other networkId your client should connect to
  }).then(ae => ae.spend(parseInt(amount), receiver_pub_key))
```

### Low-level SDK usage (use [API](../docs/api.md) endpoints directly)
Example spend function, using the SDK, talking directly to the [**API**](../docs/api.md):
```js
  // Import necessary Modules
  import Tx from '@aeternity/aepp-sdk/es/tx/tx.js'
  import Chain from '@aeternity/aepp-sdk/es/chain/node.js'
  import Account from '@aeternity/aepp-sdk/es/account/memory.js'

  async function spend (amount, receiver_pub_key) {

    const tx = await Tx({url: 'HOST_URL_HERE', internalUrl: 'HOST_URL_HERE'})
    const chain = await Chain({url: 'HOST_URL_HERE', internalUrl: 'HOST_URL_HERE'})
    const account = Account({keypair: {secretKey: 'PRIV_KEY_HERE', publicKey: 'PUB_KEY_HERE'}, networkId: 'NETWORK_ID_HERE'})
    const spendTx = await tx.spendTx({sender: 'PUB_KEY_HERE', receiver_pub_key, amount})

    const signed = await account.signTransaction(spendTx)
    return chain.sendTransaction(signed, opt)

  }
```
