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

3. **Bundlers Setup**: Do not forget to **allow your bundler (eg. _webpack_) to scan the SDK files** that needs transpilation. This will allow your bundler to transpile the SDK `import`ed modules correctly (_see following example_).


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
elimination). In order to ensure that modules are loaded directly, use the following syntax to load your desired part (aka [_flavor_](../README.md)) of aepp-sdk:

```js
// import Universal stamp
import Universal from '@aeternity/aepp-sdk/es/ae/universal'
// import Node
import Node from '@aeternity/aepp-sdk/es/node'
// import Account
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'

// interact with aeternity's blockchain
(async () => {
  const node = await Node({ url: 'https://sdk-testnet.aepps.com' })
  const account = MemoryAccount({ keypair: 'YOUR_KEYPAIR' })
  // Init client
  const client = await Universal({
     nodes: [{ name: 'test-net', instance: node }],
     accounts: [ account ]
  })
  client.height().then(height => {
    console.log('Current Block', height)
  })
})()
```

[webpack]: https://webpack.js.org/
[Babel]: https://babeljs.io/
[Tree shaking]: https://webpack.js.org/guides/tree-shaking/
