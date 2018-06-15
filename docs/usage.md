# Usage

There are three different ways of incorporating aepp-sdk into your project, depending on the particular scenario:
* Node.js bundle at `dist/aepp-sdk.js`
* Browser bundle at `dist/aepp-sdk.browser.js`
* ES Modules at `src/`

Also, please be aware that using `require` instead of module loader syntax
(`import`) means that the default export automatically becomes exposed as
`default`, which is reflected below in the code examples. This is due to a
recent change in [Babel] compilation and fully compliant with the standard.

## ES Modules

In is generally advised to use ESM (EcmaScript Modules), whenever possible. At
this point however, this requires a modern _bundler_ which understands ES2015
`import/export` syntax, such as [webpack] 4 (or newer). In addition, a compiler
which translates the subset of ES used by aepp-sdk will have to be used, such as
[Babel] - `.babelrc` in the project's root directory shows which plugins are
required, at least.  
Using this method also enables the use of [Tree shaking] (dead code
elimination).  
aepp-sdk's `package.json` specifies a seperate entry point for any such tool
that understands ESM. In order to make sure the modules are loaded directly, use
the following syntax to load parts of aepp-sdk:

```js
import Ae from '@aeternity/aepp-sdk/src/client'

Ae.create('https://sdk-testnet.aepps.com').then(client => {
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
    Ae.default.create('https://sdk-testnet.aepps.com').then(client => {
      client.height().then(height => {
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
import Ae, { Wallet } from '@aeternity/aepp-sdk'

Ae.create('https://sdk-testnet.aepps.com').then(client => {
  client.height().then(height => {
    console.log('Current Block', height)
  })
})
```

## Node.js bundle

The Node.js bundle is primarily interesting for scripts which use non-transpiled
code, such as the ones provided in the `bin/` directory of the project.

```js
const { default: Ae } = require('@aeternity/aepp-sdk')

Ae.create('https://sdk-testnet.aepps.com').then(client => {
  client.height().then(height => {
    console.log('Current Block', height)
  })
})

// same with async
const main = async () => {
  const client = await Ae.create('https://sdk-testnet.aepps.com')
  const height = await client.height()
  console.log('Current Block', height)
}

main()
```

## [Vue.js]

Adding aepp-sdk to a Vue.js project requires nothing special, but it should be
noted that `Ae.create` is asynchronous which needs to be taken into account.

```
vue init webpack my-project
cd my-project
yarn add @aeternity/aepp-sdk
```

```js
# src/components/HelloWorld.vue

<script>
import Ae from '@aeternity/aepp-sdk'
const ae = Ae.create('https://sdk-testnet.aepps.com')
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  async mounted () {
    const client = await ae
    const height = await client.height()
    this.msg = 'Current Block: ' + height
  }
}
</script>
```

[Vue.js]: https://vuejs.org/

