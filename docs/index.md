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
The bundle will assign the SDK to a global variable called `Ae` that makes all functionalities of the SDK accessible.

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
    const node = new Ae.Node('https://testnet.aeternity.io')
    const aeSdk = new Ae.AeSdk({
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

## Command Line Interface (CLI)
If you don't need to include specific functionality into your application and just want to use or play around with features the SDK provides you can make use of the [💻 CLI](https://github.com/aeternity/aepp-cli-js) and follow the instructions mentioned there.
