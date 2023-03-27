# Installation

## Direct `<script>` include via CDN
In case you're not using any JS bundling/compilation technique, the SDK can also be loaded with the traditional `<script>` tag, as follows:

### Latest SDK version

```html
<script src="https://unpkg.com/@aeternity/aepp-sdk/dist/aepp-sdk.browser-script.js"></script>
```

### Specific SDK version
```html
<script src="https://unpkg.com/@aeternity/aepp-sdk@VERSION/dist/aepp-sdk.browser-script.js"></script>
```
...where `VERSION` is the version number of the SDK you want to use (eg. `8.1.0`).

### Browser `<script>` tag
The bundle will assign the SDK to a global variable called `Aeternity` that makes all functionalities of the SDK accessible.

Usage:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  <!-- include latest SDK version -->
  <script src="https://unpkg.com/@aeternity/aepp-sdk/dist/aepp-sdk.browser-script.js"></script>
  <script type="text/javascript">
    const { AeSdk, Node } = Aeternity

    const node = new Node('https://testnet.aeternity.io')
    const aeSdk = new AeSdk({
      nodes: [{ name: 'testnet', instance: node }]
    })
    aeSdk.getHeight().then(height => {
      console.log("Current Block Height:" + height)
    })
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
SDK uses modern features available since typescript@4.7. Though SDK is still compatible with typescript@4.1 and above using types generated separately, but these types are less accurate.

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

## Command Line Interface (CLI)
If you don't need to include specific functionality into your application and just want to use or play around with features the SDK provides you can make use of the [💻 CLI](https://github.com/aeternity/aepp-cli-js) and follow the instructions mentioned there.
