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

* [`RpcWallet`](api/ae/wallet.md): for **Wallet**'s focused development
* [`Contract`](api/ae/contract.md): for **Contract**'s focused development
* [`RpcAepp`](api/ae/aepp.md): for **Web Aepp**'s focused development ⚠️ **_No Wallet support_**
* [`Aens`](api/ae/aens.md): for **AENs**' focused development
* [`Oracle`](api/ae/oracle.md): for **Oracle**'s focused development
* [`Universal`](api/ae/universal.md): for **Universal** development (includes all SDK features)

In order to cater more specific needs, it is recommended to refer to the
[contributing Docs](contrib/README.md).

### Testing Network
When initialising a client, to test, you can use Aeternity's Test Network URL:

[https://testnet.aeternity.io](https://testnet.aeternity.io)

You can use this URL with any release on [npmjs](https://www.npmjs.com/package/@aeternity/aepp-sdk).
It offers the last stable version of [Node](https://github.com/aeternity/aeternity), used by all of
Aeternity's Dev Tools.
