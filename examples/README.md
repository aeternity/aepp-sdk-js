## ⚡ Examples

### 2. VueJS (maintained) Examples

1. [Wallet + Aepp RPC setup](/examples/connect-two-ae)
2. [Suggest another example](https://github.com/aeternity/aepp-sdk-js/issues/new)

### 1. Universal Example (_all_ SDK's functionalities)
> interact with aeternity's blockchain's [**Universal flavor**](docs/usage.md)

```js
// Start the instance using Universal flavor
import Ae from '@aeternity/aepp-sdk/es/ae/universal'

Ae({
  url: 'https://sdk-testnet.aepps.com',
  internalUrl: 'https://sdk-testnet.aepps.com',
  compilerUrl: 'https://compiler.aepps.com',
  keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' },
  networkId: 'aet_ua' // or any other networkId your client should connect to
}).then(ae => {

  // Interacting with the blockchain client
  // getting the latest block height
  ae.height().then(height => {
    // logs current height
    console.log('height', height)
  }).catch(e => {
    // logs error
    console.log(e)
  })

  // getting the balance of a public address
  ae.balance('A_PUB_ADDRESS').then(balance => {
    // logs current balance of "A_PUB_ADDRESS"
    console.log('balance', balance)
  }).catch(e => {
    // logs error
    console.log(e)
  })
})
```

### 3. Wallet Example (_only_ Wallet's functionalities)
> interact with aeternity's blockchain's [**Wallet flavor**](docs/usage.md) – For _Wallet_ development
> You can find a more [complete example using VueJS here](examples/connect-two-ae)


```js
// Start the instance using Wallet flavor
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet'
const walletBalance

// Simple function to Guard SDK actions
const confirmDialog = function (method, params, {id}) {
  return Promise.resolve(window.confirm(`User ${id} wants to run ${method} ${params}`))
}

Wallet({
  url: 'https://sdk-testnet.aepps.com',
  internalUrl: 'https://sdk-testnet.aepps.com',
  compilerUrl: 'https://compiler.aepps.com',
  accounts: [
    MemoryAccount({
      keypair: {
                  secretKey: 'secr3tKeYh3RE',
                  publicKey: 'ak_pUbL1cH4sHHer3'
                }
    })
  ],
  address: 'ak_pUbL1cH4sHHer3',
  onTx: confirmDialog,
  onChain: confirmDialog,
  onAccount: confirmDialog,
  onContract: confirmDialog,
  networkId: 'aet_ua' // or any other networkId your client should connect to
}).then(ae => {

  // Interact with the blockchain!
  ae.balance(this.pub).then(balance => {
    walletBalance = balance
  }).catch(e => {
    walletBalance = 0
  })
})
```

### 3. Aepp Example (Aepp <--> Wallet via RPC)
> interact with aeternity's blockchain's [**Aepp flavor**](docs/usage.md) – For _Aepps_ development AKA DApp development
> You can find a more [complete example using VueJS here](examples/connect-two-ae)


```js
// Start the instance using Aepp flavor
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'
const pubKey

// Here, we're not initialising anything, assuming that this is an Aepp (DApp)
// working inside an Iframe of a "Wallet flavored" JS App
Aepp().then(ae => {

  // Interact with the blockchain!
  ae.address()
    .then(address => {
      //get address of the Wallet used by this Aepp
      pubKey = address
    })
    .catch(e => { console.log(`Rejected: ${e}`) })
})
```
