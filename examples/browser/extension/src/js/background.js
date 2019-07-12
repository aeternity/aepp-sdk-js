import '../img/icon-128.png'
import '../img/icon-34.png'

import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'
import { RpcWallet } from '@aeternity/aepp-sdk/es/ae/wallet'
import BrowserRuntimeConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-connection/browser-runtime'


const account =  MemoryAccount({
    keypair: {
        secretKey: "YOUR_PUB",
        publicKey: "YOUR_PRIV"
    }
})

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
    account
]
//
const postToContent = (data) => {
    chrome.tabs.query({}, function (tabs) { // TODO think about direct communication with tab
        const message = { method: 'pageMessage', data };
        tabs.forEach(({ id }) => chrome.tabs.sendMessage(id, message)) // Send message to all tabs
    });
}


// Send wallet connection info to Aepp throug content script
const NODE_URL = 'http://localhost:3013'
const NODE_INTERNAL_URL = 'http://localhost:3113'
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
        }
    },
    onDisconnect (port) {
        debugger
    },
    onSubscription (aepp, action) {
        if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} want to subscribe for accounts`)) {
            action.accept()
        }
    },
    onSign (aepp, action) {
        if (confirm(`Aepp ${aepp.info.name} with id ${aepp.id} want to sign tx ${action.params.tx}`)) {
            action.accept()
        }
    }
}).then(wallet => {
    // Subscribe for runtime connection
    chrome.runtime.onConnectExternal.addListener(async (port) => {
        // create Connection
        const connection = await BrowserRuntimeConnection({ connectionInfo: { id: port.sender.frameId }, port })
        // add new aepp to wallet
        wallet.addRpcClient(connection)
    })
    // Share wallet info with extensionId to the page
    debugger
    // Send wallet connection info to Aepp throug content script
    setInterval(() => wallet.shareWalletInfo(postToContent), 5000)
}).catch(err => {
    console.error(err)
})
