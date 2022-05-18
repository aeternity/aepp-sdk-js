# Connect an æpp to a wallet

This guide describes the 4 steps that are necessary to connect your application to a wallet using the RPC API.

## Prerequisites

- Install [Superhero Wallet extension](https://wallet.superhero.com/) for simplicity of example.
You can build your own wallet in the next example

## 1. Specify imports and constants and state

```js
import { RpcAepp, WalletDetector, BrowserWindowMessageConnection, Node } from '@aeternity/aepp-sdk'

const TESTNET_NODE_URL = 'https://testnet.aeternity.io'
const MAINNET_NODE_URL = 'https://mainnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com';

export default {
  data: () => ({
    aeSdk: null,
    address: '',
    balance: 0,
    nodeInfo: null,
    connectedAccounts: null
  }),
}
```

## 2. Initialize the `RpcAepp` Stamp

```js
async created () {
  this.aeSdk = await RpcAepp({
    name: 'Simple Aepp',
    nodes: [
      { name: 'ae_uat', instance: await Node({ url: TESTNET_NODE_URL }) },
      { name: 'ae_mainnet', instance: await Node({ url: MAINNET_NODE_URL }) }
    ],
    compilerUrl: COMPILER_URL,
    onNetworkChange: async ({ networkId }) => {
      this.aeSdk.selectNode(networkId)
      this.nodeInfo = await this.aeSdk.getNodeInfo()
    },
    onAddressChange: async () => {
      this.address = await this.aeSdk.address()
      this.balance = await this.aeSdk.getBalance(this.address)
    },
    onDisconnect: () => {
      // you may want to reset state here
      alert('Disconnected')
    }
  })
  this.scanForWallets()
}
```

## 3. Scan for wallets
```js
methods: {
  async scanForWallets()  {
    const handleWallets = async function ({ wallets, newWallet }) {
      newWallet = newWallet || Object.values(wallets)[0]
      if (confirm(`Do you want to connect to wallet ${newWallet.name}`)) {
        detector.stopScan()
        // connect to the wallet, see step 4.
        await this.connect(newWallet)
      }
    }

    const scannerConnection = new BrowserWindowMessageConnection({
      connectionInfo: { id: 'spy' }
    })

    const detector = await new WalletDetector({ connection: scannerConnection })
    detector.scan(handleWallets.bind(this))
  }
}
```

## 4. Connect to a wallet

Append method for wallet connection

```js
async connect(wallet) {
  await this.aeSdk.connectToWallet(await wallet.getConnection())
  this.connectedAccounts = await this.aeSdk.subscribeAddress('subscribe', 'connected')
  this.address = await this.aeSdk.address()
  this.balance = await this.aeSdk.getBalance(this.address).catch(() => '0')
  this.nodeInfo = await this.aeSdk.getNodeInfo()
}
```

## 4. Use Wallet's Node for chain communication

Aepp can request the wallet to share its connected node URLs if any to interact with the chain.

```js
async connect (wallet) {
    await this.aeSdk.connectToWallet(await wallet.getConnection(), { connectNode: true, name: 'wallet-node', select: true })
}
```

Note:

- The steps above are snippets taken from the full implementation of
  the [Simple æpp](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/browser/aepp)

