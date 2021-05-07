## How to build a wallet

This guide describing the process of building Wallet using the new Wallet<->Aepp integration API
The full example of implementation you can find here:
- [iframe-based Wallet](../../examples/browser/wallet-iframe)
- [Wallet WebExtension](../../examples/browser/wallet-web-extension)

### Extension wallet

- First we need to create an bridge between our extension and page
This can be done by subscribing for window `message` event from the `page`
and redirecting them using chrome|firefox `runtime` connection to the `extension` and back

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
- Then we need to initialize `Wallet` stamp in our extension and subscribe for new `runtime` connection's
After connection will be established we can start to send `announcePresence` message to the `page` to let `Aepp` know about `Wallet`
```js
// background.js

import '../img/icon-128.png'
import '../img/icon-34.png'

import { Node, MemoryAccount, RpcWallet, Crypto } from '@aeternity/aepp-sdk'
import BrowserRuntimeConnection
  from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime'

// const account = MemoryAccount({
//   keypair: {
//     secretKey: 'YOUR_PRIV',
//     publicKey: 'YOUR_PUB'
//   }
// })
const account2 = MemoryAccount({ keypair: Crypto.generateKeyPair() })

// Init accounts
const accounts = [
  // account,
  account2
]
const NODE_URL = 'https://testnet.aeternity.io'
const NODE_INTERNAL_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com'

// Init extension stamp from sdk
RpcWallet({
  nodes: [
    { name: 'test-net', instance: await Node({ url: NODE_URL, internalUrl: NODE_INTERNAL_URL}) }
  ],
  compilerUrl: COMPILER_URL,
  name: 'ExtensionWallet',
  accounts,
  // Call-back for new connection request
  onConnection (aepp, action) {
    if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to connect`)) {
      action.accept()
    } else {
      action.deny()
    }
  },
  // Call-back for disconnect event
  onDisconnect (msg, client) {
    client.disconnect()
  },
  // Call-back for account subscription request
  onSubscription (aepp, action) {
    if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} want to subscribe for accounts`)) {
      // You are able to overwrite access to accounts for specific AEPP
      // Manually prepare and pass as first argument of `accept` function, object with accounts
      // Object should contain current and connected accounts
      // Accounts can be stored outside of sdk(also combined some of accounts store in SDK some of account outside)
      // action.accept({
      //   accounts: {
      //     current: { 'ak_bla23dfas...': {...meta-data} }, // Current account
      //     connected: {  // Connected accounts
      //       'ak_1asdasd...': {},
      //       'ak_1asdasdf23...': {}
      //     }
      //   }
      // })
      action.accept()
    } else {
      action.deny()
    }
  },
  // Call-back for sign request
  onSign (aepp, { params, accept, deny, txObject, onAccount }) {
    if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} want to sign tx ${action.params.tx}`)) {
      // Here we can provide account for signing if it's not stored inside the SDK instance
      // To do that you need to create MemoryAccount instance and provide it as second argument of accept function
      // if (isInStorage(params.onAccount)) {
        // First argument is encode transaction which will be using instead of one from AEPP (if provided)
        // Then this signing request will be signed using the provide MemoryAccount
        // If you do not provide account manually SDK will try to find it inside the instance, else throw error
        // action(null, { onAccount: MemoryAccount({ keypair }) })
      // }
      accept()
    } else {
      deny()
    }
  },
  // Call-back get accounts request
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

### Web Wallet (Iframe/Reverse Iframe)

- This works the same as extension but without `Content Script bridge` in between

```js
  import { MemoryAccount, RpcWallet, Node } from '@aeternity/aepp-sdk/es'
  import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'

  this.client = await RpcWallet({
        nodes: [
          { name: 'test-net', instance: await Node({ url: NODE_URL, internalUrl: NODE_INTERNAL_URL}) }
        ],
        compilerUrl: 'COMPILER_URL', // optional if your wallet don't support contract and all what requred compiler
        accounts: [MemoryAccount({ keypair: { secretKey: 'YOUR_PRIVATE_KEY', publicKey: 'YOUR_PUBLIC_KEY' } })],
        address: 'PUBLIC_KEY_OF_CURRENT_ACCOUNT', // default: first account in `accounts` array,
        name: 'Wallet', // Your wallet name,
        // call-back for connection request
        async onConnection (aepp, { accept, deny }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to connect`)) {
            accept()
          } else { deny() }
        },
        // call-back for subscription request
        async onSubscription (aepp, { accept, deny }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to subscribe address`)) {
            // You are able to overwrite access to accounts for specific AEPP
            // Manually prepare and pass as first argument of `accept` function, object with accounts
            // Object should contain current and connected accounts
            // Accounts can be stored outside of sdk(also combined some of accounts store in SDK some of account outside)
            // action.accept({
            //   accounts: {
            //     current: { 'ak_bla23dfas...': {...meta-data} }, // Current account
            //     connected: {  // Connected accounts
            //       'ak_1asdasd...': {},
            //       'ak_1asdasdf23...': {}
            //     }
            //   }
            // })
            accept()
          } else { deny() }
        },
        // call-back for sign request
        async onSign (aepp, { accept, deny, params }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to ${params.returnSigned ? 'sign' : 'sign and broadcast'} ${JSON.stringify(params.tx)}`)) {
            // Here we can provide account for signing if it's not stored inside the SDK instance
            // To do that you need to create MemoryAccount instance and provide it as second argument of accept function
            // if (isInStorage(params.onAccount)) {
              // First argument is encode transaction which will be using instead of one from AEPP (if provided)
              // Then this signing request will be signed using the provide MemoryAccount
              // If you do not provide account manually SDK will try to find it inside the instance, else throw error
              // action(null, { onAccount: MemoryAccount({ keypair }) })
            // }
            accept()
          } else {
            deny()
          }
        },
        // call-back for get accounts request
        onAskAccounts (aepp, { accept, deny }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to get accounts`)) {
            accept()
          } else {
            deny()
          }
        },
        // call-back for disconnect event
        onDisconnect (message, client) {
          this.shareWalletInfo(connection.sendMessage.bind(connection))
        }
      })
      // Get target. Here we will check if wallet app running in frame or in top window
      // Get target depending on approach iFrame/Reverse Iframe
      const target = !this.runningInFrame ? window.frames.aepp : window.parent
      // Create a connection
      const connection = await BrowserWindowMessageConnection({
        target
      })
      // Add RPC client to wallet
      this.client.addRpcClient(connection)
      // Notifiy AEPP about waellet by sending the `announcePresence` message
      this.shareWalletInfo(connection.sendMessage.bind(connection))
```
