# Installation

## Direct `<script>` include via CDN

In case you're not using any JS bundling/compilation technique, the SDK can also be loaded with the traditional `<script>` tag, as follows:

### Latest SDK version

```html
<script src="https://unpkg.com/@aeternity/aepp-sdk/dist/aepp-sdk.browser-script.cjs"></script>
```

### Specific SDK version

```html
<script src="https://unpkg.com/@aeternity/aepp-sdk@VERSION/dist/aepp-sdk.browser-script.cjs"></script>
```

...where `VERSION` is the version number of the SDK you want to use (eg. `14.0.0`).

### Browser `<script>` tag

The bundle will assign the SDK to a global variable called `Aeternity` that makes all functionalities of the SDK accessible.

Usage:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
    <!-- include latest SDK version -->
    <script src="https://unpkg.com/@aeternity/aepp-sdk/dist/aepp-sdk.browser-script.cjs"></script>
    <script type="text/javascript">
      const { AeSdk, Node } = Aeternity;

      const node = new Node('https://testnet.aeternity.io');
      const aeSdk = new AeSdk({
        nodes: [{ name: 'testnet', instance: node }],
      });
      aeSdk.getHeight().then((height) => {
        console.log('Current Block Height:' + height);
      });
    </script>
  </body>
</html>
```

## NPM

### Latest Release

```bash
npm i @aeternity/aepp-sdk
```

### Pre Release

To install a _Pre-Release_ (latest `beta` or `alpha` version) you have to install the package appending the `@next` tag reference.

```bash
npm i @aeternity/aepp-sdk@next
```

### Specific Github Branch

You can also install a version coming from a specific branch. In this case you would install the SDK version of the `develop` branch.

```bash
npm i github:aeternity/aepp-sdk-js#develop
```

### TypeScript projects

To work properly, sdk requires to enable `allowSyntheticDefaultImports` flag and register folder
that contains type definitions for third-party packages sdk depends on.
This may be done in `tsconfig.json`:

```diff
{
  "compilerOptions": {
    ...
+   "typeRoots": [
+     "node_modules/@types",
+     "node_modules/@aeternity/aepp-sdk/src/typings"
+   ],
+   "allowSyntheticDefaultImports": true
  }
}
```

Ensure that you have `strictFunctionTypes` option not enabled (as it is in VS code and `ts-node` by default), otherwise some of SDK types won't work correctly (see [#1793](https://github.com/aeternity/aepp-sdk-js/issues/1793)).

In some environments, TypeScript fails to check types of sdk's dependencies (`@metamask/json-rpc-engine`, `@ledgerhq/hw-transport`), if so you may find [`skipLibCheck`](https://www.typescriptlang.org/tsconfig/#skipLibCheck) useful.

### Vue CLI@4

SDK checks are not working correctly because CLI picks both ESM and CJS versions of `autorest`
dependencies. To fix this, you need to specify aliases in `vue.config.js`.

```diff
module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
+       '@azure/core-client': '@azure/core-client/dist-esm/src/index.js',
+       '@azure/core-rest-pipeline': '@azure/core-rest-pipeline/dist-esm/src/index.js',
      },
    },
  },
};
```

### Vue@3

Reactivity in Vue@3 [based on] Proxy class. Proxy is [not compatible] with private fields of ES
classes. AeSdk, Contract and MemoryAccount classes uses private fields, so if you make an instance of these
classes reactive then the app may fail with

> TypeError: attempted to get private field on non-instance

AeSdk and Contract classes doesn’t have a state intended to be tracked using reactivity. Therefore
to solve this issue we suggest to avoid making their instances reactive using
Vue's integrated utility: [shallowRef]. The idea is to make reactive only the
instance value, to don't make it reactive in deep.

Alternatively, [toRaw] can unwrap the proxy object, returning an unmodified instance and allowing access to its private properties by its methods. It can be useful if you need a reactive array of MemoryAccount.

You can find both approaches used in the [æpp example].

[based on]: https://vuejs.org/guide/extras/reactivity-in-depth.html#how-reactivity-works-in-vue
[not compatible]: https://github.com/tc39/proposal-class-fields/issues/106
[shallowRef]: https://vuejs.org/api/reactivity-advanced.html#shallowref
[toRaw]: https://vuejs.org/api/reactivity-advanced.html#toraw
[æpp example]: https://github.com/aeternity/aepp-sdk-js/blob/ec3b888c653138d5a369b37604bf916428884170/examples/browser/aepp

## Command Line Interface (CLI)

If you don't need to include specific functionality into your application and just want to use or play around with features the SDK provides you can make use of the [💻 CLI](https://github.com/aeternity/aepp-cli-js) and follow the instructions mentioned there.
