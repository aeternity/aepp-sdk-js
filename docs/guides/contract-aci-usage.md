# Contract Usage

In order to interact with contracts on Aeternity you need to have the following components set up:
 * Compiler (host your own one or use the public compiler at https://latest.compiler.aepps.com)
 * Node (host your own one or use the public testnet node at https://sdk-testnet.aepps.com)
 * SDK
 
 The following example shows how to set up the SDK :
## SDK Setup

```js
const { Universal: Ae, MemoryAccount, Node } = require('@aeternity/aepp-SDK')

const main = async () => {
  const node = await Node({ url: NODE_URL, internalUrl: NODE_INTERNAL_URL })

  // if it's a backend application (Node.JS), implement the keys here.
  const acc = MemoryAccount({ keypair: { secretKey: yourPrivateKey, publicKey: yourPublicKey } })

  const SDKInstance = await Ae({
      nodes: [
        { name: 'testNet', instance: node },
      ],
      compilerUrl: 'COMPILER_URL',
      accounts: [acc],
      // the following account will be set as your active account for 
      // calling functions, which can be changed in runtime:
      address: yourPublicKey 
  })
  const height = await client.height()
  console.log('Current Block Height', height)
  
  // First of all, to interact with a contract, we need to create a contract object

  // contractAddress needs only to be set if you want to interact with an already deployed contract
  const contractObject = await SDKInstance.getContractInstance(CONTRACT_SOURCE, { contractAddress })
  
  // Create contract object for contract which have external dependencies
  const contractObject = await SDKInstance.getContractInstance(CONTRACT_SOURCE, { contractAddress, filesystem })

```

In the last step the SDK calls the compiler and gets the ACI (Aeternity Contract Interface) for the 
provided source code. Based on the ACI the SDK will generate the `js functions` for each of your smart contract functions
which you will then find in `contractObject.methods` object.

## Deploying Smart Contracts
Now we want to deploy our smart contract. If your code has an `init` function like
```
stateful entrypoint init(n: int) => 
    { count: n }
```

you can deploy it like so:

```js
const count = 1

try{
  let transaction = await contractObject.deploy([count])
  // or
  let transaction = await contractObject.methods.init(count)
}
  catch(e){
  console.log("Oh no, something went wrong:", e)
}
```

Now your contract should be deployed and you can find useful information about its deployment here:
```
console.log(transaction)
console.log(contractObject.deployInfo) // { owner, transaction, address, createdAt, result, rawTx }
```
TODO: 
If you want to send some `aetto`s along with your transaction to have them stored in your contract or need other more granular deployment options,, you can pass an `options` object as the last parameter, like `.deploy([count], {amount: "1337"})` For details, please refer to the [API docs](../../flattened/aci-compiler-ga-4-#instancedeploy-contractinstance)

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
