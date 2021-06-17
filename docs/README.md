# JavaScript SDK Documentation

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

### Stamps (composable factory functions)

Currently the SDK is making heavy use of [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) that compose certain functionalities:

* [`Universal`](api/ae/universal.md): for all the typical use cases

* [`RpcWallet`](api/ae/wallet.md): for **Wallet**'s focused development
* [`Contract`](api/ae/contract.md): for **Contract**'s focused development
* [`RpcAepp`](api/ae/aepp.md): for **Web Aepp**'s focused development
* [`Aens`](api/ae/aens.md): for **AENs**' focused development
* [`Oracle`](api/ae/oracle.md): for **Oracle**'s focused development

In order to cater more specific needs, it is recommended to refer to the
[contributing Docs](contrib/README.md).

### Testing Network
When initialising a client, to test, you can use Aeternity's Test Network URL:

[https://testnet.aeternity.io](https://testnet.aeternity.io)

You can use this URL with any release on [npmjs](https://www.npmjs.com/package/@aeternity/aepp-sdk).
It offers the last stable version of [Node](https://github.com/aeternity/aeternity), used by all of
Aeternity's Dev Tools.
