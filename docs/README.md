# JavaScript SDK Documentation

## ⚠️ Disclaimer
We're doing our best to keep the documentation up to date, but [please let us know if you see some out-of-date file](https://github.com/aeternity/aepp-sdk-js/issues/new). Thanks!

## Intro
There are three different ways of incorporating aepp-sdk-js into your project, depending on the particular scenario:
* ES Modules at `es/` (recommended)
* Node.js bundle at `dist/aepp-sdk.js`
* Browser bundle at `dist/aepp-sdk.browser.js`
* Browser bundle for using through \<script\> tag at `dist/aepp-sdk.browser-script.js`

Also, please be aware that using `require` instead of module loader syntax
(`import`) means that the default export automatically becomes exposed as
`default`, which is reflected below in the code examples. This is due to a
recent change in [Babel] compilation and fully compliant with the standard.

### Flavors / Entry Points

The recommended approach to use aepp-sdk is to import one of the following _Ae
Factories_ based on the specific use case:

* [@aeternity/aepp-sdk/es/ae/wallet](api/ae/wallet.md): for **Wallet**'s focused development
* [@aeternity/aepp-sdk/es/ae/contract](api/ae/contract.md): for **Contract**'s focused development
* [@aeternity/aepp-sdk/es/ae/aepp](api/ae/aepp.md): for **Web Aepp**'s focused development ⚠️ **_No Wallet support_**
* [@aeternity/aepp-sdk/es/ae/aens](api/ae/aens.md): for **AENs**' focused development
* [@aeternity/aepp-sdk/es/ae/oracle](api/ae/oracle.md): for **Oracle**'s focused development
* [@aeternity/aepp-sdk/es/ae/universal](api/ae/universal.md): for **Universal** development (includes all SDK features)

In order to cater more specific needs, it is recommended to refer to the
[contributing Docs](contrib/README.md).

### Testing Network
When initialising a client, to test, you can use Aeternity's Test Network URL:

[https://testnet.aeternity.io](https://testnet.aeternity.io)

You can use this URL with any release on [npmjs](https://www.npmjs.com/package/@aeternity/aepp-sdk).
It offers the last stable version of [Node](https://github.com/aeternity/aeternity), used by all of
Aeternity's Dev Tools.

## Guides
### Import SDK
  - Browser
    - [Import SDK bundle with **`<script>`** tag](guides/import-script-tag.md)
    - [Import SDK **ES Modules** (enabling Tree-Shaking)](guides/import-tree-shaking.md)
    - [Import SDK in **VueJS**](guides/import-vuejs.md)
  - NodeJS Environment
    - [Import SDK in **NodeJS**](guides/import-nodejs.md)

### SDK basics
   - [**SDK usage** Understanding low vs high level](guides/low-vs-high-usage.md)

### Contract Usage
 - [Contract ACI](guides/contract-aci-usage.md)
 - [Contract Events](guides/contract-events.md)
 - [AENS delegation signature](guides/delegate-signature-to-contract.md)
 - [AENS usage](guides/aens-usage.md)

### New Wallet/Aepp API
 - [How to build Wallet app/extension](guides/how-to-build-an-wallet-app-or-extension.md)
 - [How to build Aepp](guides/how-to-build-aepp-using-new-wallet-api.md)

## [API Reference](api.md)

## Examples
Check out our [Examples](examples/README.md) for more.
