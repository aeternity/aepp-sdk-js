import browser from 'webextension-polyfill'
import {
  RpcWallet, Node, MemoryAccount, generateKeyPair, BrowserRuntimeConnection, WALLET_TYPE,
  RpcConnectionDenyError, RpcRejectedByUserError
} from '@aeternity/aepp-sdk'

(async () => {
  const aeSdk = await RpcWallet({
    compilerUrl: 'https://compiler.aepps.com',
    nodes: [{
      name: 'testnet',
      instance: await Node({ url: 'https://testnet.aeternity.io' })
    }],
    id: browser.runtime.id,
    type: WALLET_TYPE.extension,
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
    onConnection (aepp) {
      if (!confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to connect`)) {
        throw new RpcConnectionDenyError()
      }
    },
    onDisconnect (msg, client) {
      console.log('Client disconnected:', client)
    },
    onSubscription (aepp) {
      if (!confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to subscribe for accounts`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onSign (aepp, { params }) {
      if (!confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to sign tx ${params.tx}`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onAskAccounts (aepp) {
      if (!confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to get accounts`)) {
        throw new RpcRejectedByUserError()
      }
    },
    onMessageSign (aepp, { params }) {
      if (!confirm(`Aepp ${aepp.info.name} with id ${aepp.id} wants to sign msg ${params.message}`)) {
        throw new RpcRejectedByUserError()
      }
    }
  })

  browser.runtime.onConnect.addListener((port) => {
    // create connection
    const connection = new BrowserRuntimeConnection({ port })
    // add new aepp to wallet
    const clientId = aeSdk.addRpcClient(connection)
    // share wallet details
    aeSdk.shareWalletInfo(clientId)
    setInterval(() => aeSdk.shareWalletInfo(clientId), 3000)
  })

  console.log('Wallet initialized!')
})()
