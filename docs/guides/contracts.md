# Contracts

The SDK needs to interact with following components in order to enable Smart Contract interactions on the aeternity blockchain:

- [aeternity](https://github.com/aeternity/aeternity) (host your own one or use the public testnet node at `https://testnet.aeternity.io`)
- [aesophia_http](https://github.com/aeternity/aesophia_http) (host your own one or use the public compiler at `https://compiler.aepps.com`)

Note:

- For production deployments you should ***always*** host these services by yourself.

## 1. Specify imports
```js
// node.js import
const { Universal, MemoryAccount, Node } = require('@aeternity/aepp-sdk')
// ES import
import { Universal, MemoryAccount, Node } from '@aeternity/aepp-sdk'
```

## 2. Initialize the SDK providing an account
When initializing the SDK you need to provide an account which will be used to sign transactions like `ContractCreateTx` and `ContractCallTx` that will be broadcasted to the network.

```js 
const node = await Node({
  url: 'https://testnet.aeternity.io' // ideally host your own node
})
const account = MemoryAccount({
  // provide a valid keypair with your secretKey and publicKey
  keypair: { secretKey: SECRET_KEY, publicKey: PUBLIC_KEY }
})

const client = await Universal({
  nodes: [
    { name: 'testnet', instance: node }
  ],
  compilerUrl: 'https://compiler.aepps.com', // ideally host your own compiler
  accounts: [account]
})

```

Note:

- You can provide multiple accounts to the SDK
- For each transaction you can choose a specific account to use for signing (by default the first account will be used)

## 3. Initialize the contract instance
```js
const CONTRACT_SOURCE = ... // source code of the contract
const contractInstance = await client.getContractInstance(CONTRACT_SOURCE)
```

Note:

- If your contract includes external dependencies you should initialize the contract using:
  ```js
  const filesystem = ... // key-value map with name of the include as key and source code of the include as value
  const contractInstance = await client.getContractInstance(CONTRACT_SOURCE, { filesystem })
  ```
- If your contract is already deployed and you know the contract address you can initialize the contract instance using:
  ```js
  const contractAddress = ... // the address of the contract
  const contractInstance = await client.getContractInstance(CONTRACT_SOURCE, { contractAddress })
  ```

## 4. Deploy the contract
Now we want to deploy our SC with init function like:
  `stateful function init(n: int) : state => { count: n }`
  ```js
const count = 1
await contractObject.deploy([count])
// or
await contractObject.methods.init(count)

// Now our SC is deployed and we can find a deploy information
console.log(contractObject.deployInfo) // { owner, transaction, address, createdAt, result, rawTx }
 ```

## Call Smart Contract methods
### Simple call
Now we can make call to one of our SC function.
Let's assume that we have a function like:
`function sum (a: int, b: int) : int = a + b`
```js
const callResult = await contractObject.methods.sum(1 , 2)
// or
const callResult = await contractObject.call('sum', [1, 2])

// callResult will contain all info related to contract call transaction
console.log(callResult.decodedRes) // 3
```
### How it works inside

Let's talk more about auto-generated function of `contractObject` 
 >`await contractObject.methods.sum(1 , 2)`
>
Here the SDK will decide:
 - If the function is `stateful`(change SC state) -> `SDK` will prepare and broadcast a `contract call` transaction
 - If function is `not stateful`(state is not changed) -> `SDK` will prepare contract call transaction and `dry-run` it

### Manual control
Also you can manually control this behaviour using the `send` and `get` methods:
```js
// Sign and Broadcast transaction to the chain
const callResult = await contractObject.methods.sum.send(1 , 2)

// Dry-run transaction
// Make sure that you provide the node `internalUrl` which is used for `dry-run` node API endpoint
const callResult = await contractObject.methods.sum.get(1 , 2)
``` 
### Overriding default transaction params
Make contract call and overwrite transaction props passing it as option: `fee, amount, ttl, ...`
 Auto-generate functions (under `methods`) will have the same arguments length and order as we had in our SC source,
 the last arguments is always options object
 if `options` is not provide SDK will use the default options 
 which you can find under the `contractObject.options` 
 ```js
const callResult = await contractObject.methods.sum.get(1 , 2, { amount: 1000, fee: 3232, gas: 123})
// or
const callResult = await contractObject.call('sum', [1 , 2], { amount: 1000, fee: 3232, gas: 123})
```
### Call contract using specific account
You can use `onAccount` option for that which can  one of:
 - `keypair` object({ secretKey, publicKey })
 - `MemoryAccount` instance
 - account `public key`
 ```js
// account must be included in SDK or you can always add it using account management API of SDK
// await SDKInstance.addAccount(MemoryAccount({ keypair }))
const options = { onAccount: keypair || MemoryAccount || publicKey } 
const callResult = await contractObject.methods.sum.get(1 , 2, options)
```
