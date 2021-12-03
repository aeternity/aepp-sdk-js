/* global chrome */

import '../img/icon-128.png'
import '../img/icon-34.png'

import { RpcWallet, Node, MemoryAccount, Crypto, BrowserRuntimeConnection } from 'AE_SDK_MODULES'

// ideally this can be configured by the users of the extension
const NODE_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com'
const accounts = [
  MemoryAccount({ keypair: Crypto.generateKeyPair() }), // generate keypair for account1
  MemoryAccount({ keypair: Crypto.generateKeyPair() }) // generate keypair for account2
]

async function init () {
  // Init extension stamp from sdk
  RpcWallet({
    compilerUrl: COMPILER_URL,
    nodes: [{ name: 'testnet', instance: await Node({ url: NODE_URL }) }],
    name: 'Wallet WebExtension',
    // The `ExtensionProvider` uses the first account by default.
    // You can change active account using `selectAccount(address)` function
    accounts,
    // Hook for sdk registration
    onConnection (aepp, action) {
      if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to connect`)) {
        action.accept()
      } else {
        action.deny()
      }
    },
    onDisconnect (msg, client) {
      console.log('Disconnect client: ', client)
    },
    onSubscription (aepp, action) {
      if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to subscribe for accounts`)) {
        action.accept()
      } else {
        action.deny()
      }
    },
    onSign (aepp, action) {
      if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to sign tx ${action.params.tx}`)) {
        action.accept()
      } else {
        action.deny()
      }
    },
    onAskAccounts (aepp, action) {
      if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to get accounts`)) {
        action.accept()
      } else {
        action.deny()
      }
    },
    onMessageSign (aepp, action) {
      if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to sign msg ${action.params.message}`)) {
        action.accept()
      } else {
        action.deny()
      }
    }
  }).then(wallet => {
    chrome.runtime.onConnect.addListener(async function (port) {
      // create connection
      const connection = await BrowserRuntimeConnection(
        { connectionInfo: { id: port.sender.frameId }, port }
      )
      // add new aepp to wallet
      wallet.addRpcClient(connection)
      // share wallet details
      wallet.shareWalletInfo(port.postMessage.bind(port))
      setTimeout(() => wallet.shareWalletInfo(port.postMessage.bind(port)), 3000)
    })
  }).catch(err => {
    console.error(err)
  })
}

init().then(_ => console.log('Wallet initialized!'))
