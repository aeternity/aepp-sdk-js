import '../img/icon-128.png'
import '../img/icon-34.png'

import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet'
import BrowserRuntimeConnection
  from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-connection/browser-runtime'
import { generateKeyPair } from '../../../../../es/utils/crypto'

// const account = MemoryAccount({
//   keypair: {
//     secretKey: 'YOUR_PRIV',
//     publicKey: 'YOUR_PUB'
//   }
// })

const account2 = MemoryAccount({ keypair: generateKeyPair() })

// Init accounts
const accounts = [
  // You can add your own account implementation,
  // Account.compose({
  //     init() {
  //     },
  //     methods: {
  //         /**
  //          * Sign data blob
  //          * @function sign
  //          * @instance
  //          * @abstract
  //          * @category async
  //          * @rtype (data: String) => data: Promise[String]
  //          * @param {String} data - Data blob to sign
  //          * @return {String} Signed data blob
  //          */
  //         async sign(data) {
  //         },
  //         /**
  //          * Obtain account address
  //          * @function address
  //          * @instance
  //          * @abstract
  //          * @category async
  //          * @rtype () => address: Promise[String]
  //          * @return {String} Public account address
  //          */
  //         async address() {
  //         }
  //     }
  // })(),
  // account,
  account2
]
// Send wallet connection info to Aepp throug content script
const NODE_URL = 'https://sdk-testnet.aepps.com'
const NODE_INTERNAL_URL = 'https://sdk-testnet.aepps.com'
const COMPILER_URL = 'https://compiler.aepps.com'

// Init extension stamp from sdk
RpcWallet({
  url: NODE_URL,
  internalUrl: NODE_INTERNAL_URL,
  compilerUrl: COMPILER_URL,
  name: 'ExtensionWallet',
  // By default `ExtesionProvider` use first account as default account. You can change active account using `selectAccount (address)` function
  accounts,
  // Hook for sdk registration
  onConnection (aepp, action) {
    if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to connect`)) {
      action.accept()
    } else {
      action.deny()
    }
  },
  onDisconnect (masg, client) {
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
  chrome.runtime.onConnect.addListener(async function (port) {
    // create Connection
    const connection = await BrowserRuntimeConnection({ connectionInfo: { id: port.sender.frameId }, port })
    // add new aepp to wallet
    wallet.addRpcClient(connection)
    //
    wallet.shareWalletInfo(port.postMessage.bind(port))
    setTimeout(() => wallet.shareWalletInfo(port.postMessage.bind(port)), 3000)
  })
}).catch(err => {
  console.error(err)
})
