## How to build an Aepp using new Wallet API

This guide describing the process of building Aepp using the new Wallet<->Aepp integration API
The full example of implementation you can find here: [AEPP example](https://github.com/aeternity/aepp-sdk-js/tree/develop/examples/browser/vuejs/connect-two-ae/aepp)
### First we need to initialize our `Aepp` stamp

```js
  import { RpcAepp } from '@aeternity/aepp-sdk'

  // Open iframe with Wallet if run in top window
  //  window !== window.parent || await this.getReverseWindow()
   this.client = await RpcAepp({
     name: 'AEPP',
     nodes: [
      { name: 'test-net', instance: await Node({ url: NODE_URL, internalUrl: NODE_INTERNAL_URL}) }
     ],
     compilerUrl: COMPILER_URL,
     // call-back for update network notification
     onNetworkChange (params) {
       if (this.getNetworkId() !== params.networkId) alert(`Connected network ${this.getNetworkId()} is not supported with wallet network ${params.networkId}`)
     },
     // call-back for update address notification
     onAddressChange:  async (addresses) => {
       this.pub = await this.client.address()
       this.balance = await this.client.balance(this.pub).catch(e => '0')
       this.addressResponse = await errorAsField(this.client.address())
     },
     // call-back for update address notification
     onDisconnect (msg) {
     }
   })
   // Start looking for wallets
   await this.scanForWallets() // Start looking for new wallets

```

### Then we need to start looking for available waellets
```js
  import WalletDetector from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-detector'

  async function scanForWallets () {
      // call-back function for new wallet event
      const handleWallets = async function ({ wallets, newWallet }) {
        newWallet = newWallet || Object.values(wallets)[0]
        // ask if you want to connect
        if (confirm(`Do you want to connect to wallet ${newWallet.name}`)) {
          // Stop scanning wallets
          this.detector.stopScan()
          // Connect to wallet
          await this.connectToWallet(newWallet)
        }
      }
      // Create connection object for WalletDetector
      const scannerConnection = await BrowserWindowMessageConnection({
        connectionInfo: { id: 'spy' }
      })
      // Initialize WalletDetector
      this.detector = await WalletDetector({ connection: scannerConnection })
      // Start scanning
      this.detector.scan(handleWallets.bind(this))
  }
```

### The last step is to connect to the Waellet

```js
  async function connectToWallet (wallet) {
      // Connect to the wallet using wallet connection object
      // At this line sdk will send connection request to the wallet and waiting for response
      await this.client.connectToWallet(await wallet.getConnection())
      // After connection established we can subscribe for accounts
      this.accounts = await this.client.subscribeAddress('subscribe', 'connected')
      // Now we have list of available account and we can get the selected account just using usual SDK interface
      this.selectedAccountAddress = await this.client.address()
      // In `client.rpcClient` you can find all information regarding to connected waellet
      this.walletName = this.client.rpcClient.info.name
  }
```
