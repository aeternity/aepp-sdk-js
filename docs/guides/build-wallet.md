# How to build a wallet

This guide shows how to build either an **WebExtension Wallet** or a **iFrame-based Wallet**.

## WebExtension wallet
The full implementation of this example can be found here:

- [WebExtension Wallet Example](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/browser/wallet-web-extension)


Note:

- If you want to see a more advanced implementation you can take a look into the repository of the [Superhero Wallet](https://github.com/aeternity/superhero-wallet)

### 1. Create bridge between extension and page
First you need to create a bridge between your extension and the page. This can be done as follows:

https://github.com/aeternity/aepp-sdk-js/blob/32fbb8b44b08025d7abe53bdfa275893271cbf56/examples/browser/wallet-web-extension/src/content-script.js#L1-L27

### 2. Initialize `AeSdkWallet` class
Then you need to initialize `AeSdkWallet` class in your extension and subscribe for new `runtime` connections.
After the connection is established you can share the wallet details with the application.

https://github.com/aeternity/aepp-sdk-js/blob/32fbb8b44b08025d7abe53bdfa275893271cbf56/examples/browser/wallet-web-extension/src/background.js#L1-L75

## iFrame-based Wallet
The **iFrame-based** approach works similar to the **WebExtension** approach except that the `connectionProxy` in between isn't needed.

You can take a look into the implementation of the following example to see how it works:

- [iFrame-based Wallet Example](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/browser/wallet-iframe)
