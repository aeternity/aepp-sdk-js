## How to build an wallet

### Extension wallet

- First we need to create an bridge between our extension and page

```js
// inject.js file
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'
import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'
import { getBrowserAPI } from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/helpers'
import { MESSAGE_DIRECTION } from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/schema'
import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge'

const readyStateCheckInterval = setInterval(function () {
  // Wait until load
  if (document.readyState === 'complete') {
    clearInterval(readyStateCheckInterval)

    // Create runtime connection with extension
    const port = getBrowserAPI().runtime.connect()
    // Create connection object for extension using `runtime` connection
    const extConnection = BrowserRuntimeConnection({
      connectionInfo: {
        description: 'Content Script to Extension connection',
        origin: window.origin
      },
      port
    })
    // Create connection object for page using `window.postMessage`
    const pageConnection = BrowserWindowMessageConnection({
      connectionInfo: {
        description: 'Content Script to Page  connection',
        origin: window.origin
      },
      origin: window.origin,
      sendDirection: MESSAGE_DIRECTION.to_aepp,
      receiveDirection: MESSAGE_DIRECTION.to_waellet
    })

    // Init ContentScriptBridge stamp
    const bridge = ContentScriptBridge({ pageConnection, extConnection })
    // Run. Start redirecting messages between extension and page
    bridge.run()
  }
}, 10)

```
- then init Wallet stamp in our extension
```js
// background.js

import '../img/icon-128.png'
import '../img/icon-34.png'

import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet'
import BrowserRuntimeConnection
  from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'
import { generateKeyPair } from '@aeternity/aepp-sdk/es/utils/crypto'

// const account = MemoryAccount({
//   keypair: {
//     secretKey: 'YOUR_PRIV',
//     publicKey: 'YOUR_PUB'
//   }
// })
const account2 = MemoryAccount({ keypair: generateKeyPair() })

// Init accounts
const accounts = [
  // account,
  account2
]
const NODE_URL = 'https://sdk-testnet.aepps.com'
const NODE_INTERNAL_URL = 'https://sdk-testnet.aepps.com'
const COMPILER_URL = 'https://compiler.aepps.com'

// Init extension stamp from sdk
RpcWallet({
  url: NODE_URL,
  internalUrl: NODE_INTERNAL_URL,
  compilerUrl: COMPILER_URL,
  name: 'ExtensionWallet',
  accounts,
  onConnection (aepp, action) {
    if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to connect`)) {
      action.accept()
    } else {
      action.deny()
    }
  },
  onDisconnect (msg, client) {
    client.disconnect()
  },
  onSubscription (aepp, action) {
    if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} want to subscribe for accounts`)) {
      action.accept()
    } else {
      action.deny()
    }
  },
  onSign (aepp, action) {
    if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} want to sign tx ${action.params.tx}`)) {
      action.accept()
    } else {
      action.deny()
    }
  },
  onAskAccounts (aepp, { accept, deny }) {
    if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to get accounts`)) {
      accept()
    } else {
      deny()
    }
  }
}).then(wallet => {
  // Subscribe for `runtime` connection from Content Script
  chrome.runtime.onConnect.addListener(async function (port) {
    // create BrowserRuntimeConnection
    const connection = await BrowserRuntimeConnection({ connectionInfo: { id: port.sender.frameId }, port })
    // add rpc client to wallet
    wallet.addRpcClient(connection)
    // Share wallet details. Inform aepp about wallet
    wallet.shareWalletInfo(port.postMessage.bind(port))
    setTimeout(() => wallet.shareWalletInfo(port.postMessage.bind(port)), 3000)
  })
}).catch(err => {
  console.error(err)
})

```
