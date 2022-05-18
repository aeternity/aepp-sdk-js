/* global browser */

import {
  RpcWallet, Node, MemoryAccount, generateKeyPair, BrowserRuntimeConnection
} from '@aeternity/aepp-sdk'

(async () => {
  const aeSdk = await RpcWallet({
    compilerUrl: 'https://compiler.aepps.com',
    nodes: [{
      name: 'testnet',
      instance: await Node({ url: 'https://testnet.aeternity.io' })
    }],
    name: 'Wallet WebExtension',
    // The `ExtensionProvider` uses the first account by default.
    // You can change active account using `selectAccount(address)` function
    accounts: [
      MemoryAccount({
        keypair: {
          publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
          secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
        }
      }),
      MemoryAccount({ keypair: generateKeyPair() })
    ],
    // Hook for sdk registration
    onConnection (aepp, action) {
      if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to connect`)) {
        action.accept()
      } else {
        action.deny()
      }
    },
    onDisconnect (msg, client) {
      console.log('Client disconnected:', client)
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
  })

  browser.runtime.onConnect.addListener((port) => {
    // create connection
    const connection = new BrowserRuntimeConnection(
      { connectionInfo: { id: port.sender.frameId }, port }
    )
    // add new aepp to wallet
    aeSdk.addRpcClient(connection)
    // share wallet details
    aeSdk.shareWalletInfo(port.postMessage.bind(port))
    setInterval(() => aeSdk.shareWalletInfo(port.postMessage.bind(port)), 3000)
  })

  console.log('Wallet initialized!')
})()
