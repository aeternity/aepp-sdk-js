# Contract Usage

To have ability to interact with Aeternity Smart Contracts you need:
 - Compiler
 - Node
 - SDK
 
## Account Management

```js
const { Universal: Ae, MemoryAccount, Node } = require('@aeternity/aepp-SDK')

// same with async
const main = async () => {
  const node1 = await Node({ url: NODE_URL, internalUrl: NODE_INTERNAL_URL })
  const acc = MemoryAccount({ keypair: KEYPAIR })

  const SDKInstance = await Ae({
      nodes: [
        { name: 'testNet', instance: node },
      ],
      compilerUrl: 'COMPILER_URL',
      accounts: [acc],
      address: KEYPAIR.publicKey
  })
  const height = await client.height()
  console.log('Current Block Height', height)
  
  // Contract ACI. First of all we need to create a contract object
  // contractAddress is optional
  const contractObject = await SDKInstance.getContractInstance(CONTRACT_SOURCE, { contractAddress })
  // Create contract object for contract which have external dependencies
  const contractObject = await SDKInstance.getContractInstance(CONTRACT_SOURCE, { contractAddress, filesystem })
  // In this step SDK will call the compiler and get the ACI for provided source code
  // base on ACI SDK will generate the `js functions` for each of your SC method
  // which you will find in `contractObject.methods` object
```
## Deploying Smart Contract
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
