


# Simple Sophia Contract Compiler

This script demonstrates how to

* deal with the different phases of compiling Sophia contracts to bytecode,
* deploying the bytecode to get a callable contract address and ultimately,
* invoke the deployed contract on the æternity blockchain.


We'll need the main client module `Sdk` in the `Universal` flavor from the SDK.


```js
const { Universal: Sdk, Node, MemoryAccount } = require('../../dist/aepp-sdk')
```

Define some constants


```js
const CONTRACT_CODE = `
contract Multiplier =
  record state = { factor: int }
  entrypoint init(f : int) : state = { factor = f }
  entrypoint multiplyBy(x : int) = x * state.factor
`
const ACCOUNT_KEYPAIR = {
  publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
  secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
}
const NODE_URL = 'https://testnet.aeternity.io'
```

Generate the account instance based on the keypair


```js
const account = MemoryAccount({ keypair: ACCOUNT_KEYPAIR });
```

Most methods in the SDK return _Promises_, so the recommended way of
dealing with subsequent actions is running them one by one using `await`.


```js
(async () => {
  const node = await Node({ url: NODE_URL })
```

`Sdk` itself is asynchronous as it determines the node's version and
rest interface automatically. Only once the Promise is fulfilled, we know
we have a working `Sdk` instance. Please take note `Sdk` is not a constructor but
a factory, which means it's *not* invoked with `new`.


```js
  const sdk = await Sdk({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: 'https://compiler.aepps.com',
    accounts: [account]
  })
```

`contractCompile` takes a raw Sophia contract in string form and sends it
off to the HTTP compiler for bytecode compilation. In the future this will be done
without talking to the node, but requiring a bytecode compiler
implementation directly in the SDK.


```js
  const bytecode = await sdk.contractCompile(CONTRACT_CODE)
  console.log(`Obtained bytecode ${bytecode.bytecode}`)
```

Invoking `deploy` on the bytecode object will result in the contract
being written to the chain, once the block has been mined.
Sophia contracts always have an `init` method which needs to be invoked,
even when the contract's `state` is `unit` (`()`). The arguments to
`init` have to be provided at deployment time and will be written to the
block as well, together with the contract's bytecode.


```js
  const deployed = await bytecode.deploy(['5'])
  console.log(`Contract deployed at ${deployed.address}`)
```

Once the contract has been successfully mined, we can attempt to invoke
any public function defined within it. The miner who found the next block
will not only be rewarded a fixed amount, but also an amount depending on
the amount of gas spend.


```js
  const call = await deployed.call('multiplyBy', ['7'])
  console.log(`Contract call transaction hash ${call.hash}`)
```

The execution result, if successful, will be an FATE-encoded result value.
We are using HTTP compiler to decode the result value.


```js
  console.log(`Execution result: ${await call.decode()}`)
})()
```

,



# Simple AE Token Spending Script

This script shows how to use the SDK to send AE to other addresses.


We'll need the main client module `Sdk` in the `Universal` flavor from the SDK.


```js
const { Universal: Sdk, Node, MemoryAccount } = require('../../dist/aepp-sdk')
```

Define some constants


```js
const ACCOUNT_KEYPAIR = {
  publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
  secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
}
const NODE_URL = 'https://testnet.aeternity.io'
```

Generate the account instance based on the keypair


```js
const account = MemoryAccount({ keypair: ACCOUNT_KEYPAIR })
```

Receive optional amount and address from command line arguments


```js
const [amount = 1, receiverAddress = ACCOUNT_KEYPAIR.publicKey] = process.argv.slice(2);
```

Most methods in the SDK return _Promises_, so the recommended way of
dealing with subsequent actions is running them one by one using `await`.


```js
(async () => {
  const node = await Node({ url: NODE_URL })
```

`Sdk` itself is asynchronous as it determines the node's version and
rest interface automatically. Only once the Promise is fulfilled, we know
we have a working `Sdk` instance. Please take note `Sdk` is not a constructor but
a factory, which means it's *not* invoked with `new`.


```js
  const sdk = await Sdk({
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [account]
  })
```

Invoking the spend method on `Sdk` instance.


```js
  const tx = await sdk.spend(+amount, receiverAddress)
  console.log('Transaction mined', tx)
})()
```

,
### Node.js bundle

The Node.js bundle is primarily interesting for scripts which use non-transpiled
code, such as the ones provided in the [`examples/node` directory](../examples/node) of the project.

```js
const { Universal: Ae, MemoryAccount, Node } = require('@aeternity/aepp-sdk')

const node1 = Node({ url: 'https://testnet.aeternity.io', internalUrl: 'https://testnet.aeternity.io' })
// const node2 = ...

const acc1 = MemoryAccount({ keypair: { publicKey: 'YOUR_PUBLIC_KEY', secretKey: 'YOUR_PRIVATE_KEY' } })
// const acc2 = ...
Promise.all([
  node1
]).then(nodes => {
    Ae({
      nodes: [
        { name: 'someNode', instance: nodes[0] },
      ],
      compilerUrl: 'COMPILER_URL',
      accounts: [
        acc1,
      ]
    }).then(ae => {
      ae.height().then(height => {
        console.log('Current Block', height)
      })
    })
})


// same with async
const main = async () => {
  const node1 = await Node({ url: 'https://testnet.aeternity.io', internalUrl: 'https://testnet.aeternity.io' })
  // const node2 = ...

  const acc1 = MemoryAccount({ keypair: { publicKey: 'YOUR_PUBLIC_KEY', secretKey: 'YOUR_PRIVATE_KEY' } })
  // const acc2 = ...

  const client = await Ae({
      nodes: [
        { name: 'someNode', instance: node1 },
      ],
      compilerUrl: 'COMPILER_URL',
      accounts: [
        acc1,
      ],
      address: 'SELECTED_ACCOUNT_PUB'
  })
  const height = await client.height()
  console.log('Current Block', height)
}

// call main
main()
```
,
,
