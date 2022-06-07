# How to build a wallet

This guide shows how to build either an **WebExtension Wallet** or a **iFrame-based Wallet**.

## WebExtension wallet
The full implementation of this example can be found here:

- [WebExtension Wallet Example](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/browser/wallet-web-extension)


Note:

- If you want to see a more advanced implementation you can take a look into the repository of the [Superhero Wallet](https://github.com/aeternity/superhero-wallet)

### 1. Create bridge between extension and page
First you need to create a bridge between your extension and the page. This can be done as follows:

```js
import browser from 'webextension-polyfill'
import {
  BrowserRuntimeConnection, BrowserWindowMessageConnection, MESSAGE_DIRECTION, connectionProxy
} from '@aeternity/aepp-sdk'

const readyStateCheckInterval = setInterval(function () {
  if (document.readyState === 'complete') {
    clearInterval(readyStateCheckInterval)

    const port = browser.runtime.connect()
    const extConnection = new BrowserRuntimeConnection({ port })
    const pageConnection = new BrowserWindowMessageConnection({
      target: window,
      origin: window.origin,
      sendDirection: MESSAGE_DIRECTION.to_aepp,
      receiveDirection: MESSAGE_DIRECTION.to_waellet
    })
    connectionProxy(pageConnection, extConnection)
  }
}, 10)
```

### 2. Initialize `RpcWallet` Stamp
Then you need to initialize `RpcWallet` Stamp in your extension and subscribe for new `runtime` connections.
After the connection is established you can share the wallet details with the application.

```js
import browser from 'webextension-polyfill'
// ideally this can be configured by the users of the extension
const NODE_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com'
const accounts = [
  MemoryAccount({ keypair: generateKeyPair() }), // generate keypair for account1
  MemoryAccount({ keypair: generateKeyPair() })  // generate keypair for account2
]
const aeppInfo = {}

async function init () {
  // Init extension stamp from sdk
  RpcWallet({
    compilerUrl: COMPILER_URL,
    nodes: [{ name: 'testnet', instance: await Node({ url: NODE_URL }) }],
    id: browser.runtime.id,
    type: WALLET_TYPE.extension,
    name: 'Wallet WebExtension',
    // The `ExtensionProvider` uses the first account by default. You can change active account using `selectAccount(address)` function
    accounts,
    // Hook for sdk registration
    onConnection (aeppId, params) {
      if (!confirm(`Aepp ${params.name} with id ${aeppId} wants to connect`)) {
        throw new RpcConnectionDenyError()
      }
      aeppInfo[aeppId] = params
    },
    onDisconnect (msg, client) {
      console.log('Disconnect client: ', client)
    },
    onSubscription (aeppId) {
      const { name } = aeppInfo[aeppId]
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to subscribe for accounts`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onSign (aeppId, params) {
      const { name } = aeppInfo[aeppId]
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to sign tx ${params.tx}`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onAskAccounts (aeppId) {
      const { name } = aeppInfo[aeppId]
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to get accounts`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onMessageSign (aeppId, params) {
      const { name } = aeppInfo[aeppId]
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to sign msg ${params.message}`)) {
        throw new RpcRejectedByUserError()
      }
    }
  }).then(wallet => {
    chrome.runtime.onConnect.addListener(async function (port) {
      // create connection
      const connection = new BrowserRuntimeConnection({ port })
      // add new aepp to wallet
      const clientId = aeSdk.addRpcClient(connection)
      // share wallet details
      aeSdk.shareWalletInfo(clientId)
      setInterval(() => aeSdk.shareWalletInfo(clientId), 3000)
    })
  }).catch(err => {
    console.error(err)
  })
}

init().then(_ => console.log('Wallet initialized!'))
```

## 2. Sharing wallet node with AEPP
AEPP can request the wallet for its connected node URLs. Wallet can selectively accept or reject the connection request using the AEPP information(name, id, domain)

```js
// ideally this can be configured by the users of the extension
const NODE_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com'
const accounts = [
  MemoryAccount({ keypair: generateKeyPair() }), // generate keypair for account1
  MemoryAccount({ keypair: generateKeyPair() })  // generate keypair for account2
]

async function init () {
  // Init extension stamp from sdk
  RpcWallet({
    compilerUrl: COMPILER_URL,
    nodes: [{ name: 'testnet', instance: await Node({ url: NODE_URL }) }],
    id: browser.runtime.id,
    type: WALLET_TYPE.extension,
    name: 'Wallet WebExtension',
    // The `ExtensionProvider` uses the first account by default. You can change active account using `selectAccount(address)` function
    accounts,
    // Hook for sdk registration
    onConnection (aeppId, params, origin) {
      if (confirm(`Aepp ${params.name} with id ${aeppId} wants to connect`)) {
        // Whitelist aepp domains for node connection
        const aepps = ['https://test', 'https://aepp.aeternity.com']
        if (params.connectNode && aepps.includes(origin)) {}
        else throw new RpcConnectionDenyError()
        // Connect to aepp without sharing node URLs
      } else {
        throw new RpcConnectionDenyError()
      }
      aeppInfo[aeppId] = params
    },
    onDisconnect (msg, client) {
      console.log('Disconnect client: ', client)
    },
    onSubscription (aeppId) {
      const { name } = aeppInfo[aeppId]
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to subscribe for accounts`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onSign (aeppId, params) {
      const { name } = aeppInfo[aeppId]
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to sign tx ${params.tx}`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onAskAccounts (aeppId) {
      const { name } = aeppInfo[aeppId]
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to get accounts`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onMessageSign (aeppId, params) {
      const { name } = aeppInfo[aeppId]
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to sign msg ${params.message}`)) {
        throw new RpcRejectedByUserError()
      }
    }
  }).then(wallet => {
    chrome.runtime.onConnect.addListener(async function (port) {
      // create connection
      const connection = new BrowserRuntimeConnection({ port })
      // add new aepp to wallet
      const clientId = aeSdk.addRpcClient(connection)
      // share wallet details
      aeSdk.shareWalletInfo(clientId)
      setInterval(() => aeSdk.shareWalletInfo(clientId), 3000)
    })
  }).catch(err => {
    console.error(err)
  })
}

init().then(_ => console.log('Wallet initialized!'))
```

## iFrame-based Wallet
The **iFrame-based** approach works similar to the **WebExtension** approach except that the `connectionProxy` in between isn't needed.

You can take a look into the implementation of the following example to see how it works:

- [iFrame-based Wallet Example](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/browser/wallet-iframe)
