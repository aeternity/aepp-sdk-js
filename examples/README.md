# ⚡ Examples

This folder contains examples of maintained code samples that you can run autonomously.

## VueJS (maintained) Examples to run in the `browser`

1. VueJS [Wallet + Aepp RPC setup](browser/vuejs/connect-two-ae)
2. [Suggest another example](https://github.com/aeternity/aepp-sdk-js/issues/new)

## NodeJS (maintained and tested) Examples to run in the `terminal`

1. [Simple Contract](../docs/examples/node/aecontract.md) - [Code](node/aecontract.js)
2. [Wallet](../docs/examples/node/aewallet.md) - [Code](node/aewallet.js)
3. [Suggest another example](https://github.com/aeternity/aepp-sdk-js/issues/new)

## Quick Standalone _Browser_ Example
> This example interacts with aeternity's blockchain's [**Universal flavor**](docs/usage.md) (_all_ SDK's functionalities, in the Browser)

```js
// Start the instance using Universal flavor
import Ae from '@aeternity/aepp-sdk/es/ae/universal'
import Node from '@aeternity/aepp-sdk/es/node'

// const node1 = await Node({ url })

Ae({
    // This two params deprecated and will be remove in next major release
    url: 'https://sdk-testnet.aepps.com',
    internalUrl: 'https://sdk-testnet.aepps.com',
    // instead use
    nodes: [
    // { name: 'someNode', instance: node1 },
    // mode2
    ],
    compilerUrl: 'https://compiler.aepps.com',
    // `keypair` param deprecated and will be removed in next major release
    keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' },
    // instead use
    accounts: [
      MemoryAccount({ keypair: { secretKey: 'A_PRIV_KEY', publicKey: 'A_PUB_ADDRESS' } }),
    // acc2
    ],
    address: 'SELECTED_ACCOUNT_PUB'
    networkId: 'ae_uat' // or any other networkId your client should connect to
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
## Quick _Browser_ Examples for:
### 1. Wallet Example (_only_ Wallet's functionalities)
> interact with aeternity's blockchain's [**Wallet flavor**](docs/usage.md) – For _Wallet_ development
> You can find a more [complete example using VueJS here](browser/vuejs/connect-two-ae/README.md)


```js
// Start the instance using Wallet flavor
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet'
const walletBalance

// Simple function to Guard SDK actions
const confirmDialog = function (method, params, {id}) {
  return Promise.resolve(window.confirm(`User ${id} wants to run ${method} ${params}`))
}

Wallet({
  // This two params deprecated and will be remove in next major release
  url: 'https://sdk-testnet.aepps.com',
  internalUrl: 'https://sdk-testnet.aepps.com',
  // instead use
  nodes: [
  // { name: 'someNode', instance: node1 },
  // mode2
  ],
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
  networkId: 'ae_uat' // or any other networkId your client should connect to
}).then(ae => {

  // Interact with the blockchain!
  ae.balance(this.pub).then(balance => {
    walletBalance = balance
  }).catch(e => {
    walletBalance = 0
  })
})
```

### 2. Aepp Example (Aepp <--> Wallet via RPC)
> interact with aeternity's blockchain's [**Aepp flavor**](docs/usage.md) – For _Aepps_ development AKA DApp development
> You can find a more [complete example using VueJS here](browser/connect-two-ae)


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
