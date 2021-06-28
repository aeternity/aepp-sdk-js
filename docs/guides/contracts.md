# Contracts

## Introduction
The smart contract language of the aeternity blockchain is [Sophia](https://github.com/aeternity/aesophia/blob/v6.0.0/docs/sophia.md). It is a functional language in the ML family, strongly typed and has restricted mutable state.

Before interacting with contracts using the SDK you should get familiar with Sophia itself first. Have a look into [aepp-sophia-examples](https://github.com/aeternity/aepp-sophia-examples) and start rapid prototyping using [AEstudio](https://studio.aepps.com).

The SDK needs to interact with following components in order to enable smart contract interactions on the aeternity blockchain:

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

- You can provide multiple accounts to the SDK.
- For each transaction you can choose a specific account to use for signing (by default the first account will be used), see [transaction options](../transaction-options.md).
    - This is specifically important and useful for writing tests.

## 3. Initialize the contract instance
```js
const CONTRACT_SOURCE = ... // source code of the contract
const contractInstance = await client.getContractInstance(CONTRACT_SOURCE)
```

Note:

- If your contract includes external dependencies which are not part of the [standard library](https://github.com/aeternity/aesophia/blob/v6.0.0/docs/sophia_stdlib.md) you should initialize the contract using:
  ```js
  const filesystem = ... // key-value map with name of the include as key and source code of the include as value
  const contractInstance = await client.getContractInstance(CONTRACT_SOURCE, { filesystem })
  ```
- If your contract is already deployed and you know the contract address you can initialize the contract instance using:
  ```js
  const contractAddress = ... // the address of the contract
  const contractInstance = await client.getContractInstance(CONTRACT_SOURCE, { contractAddress })
  ```
- Following attributes can be provided in an `options` object to `getContractInstance`:
    - `aci` (default: obtained via http compiler)
        - The Contract ACI.
    - `contractAddress`
        - The address where the contract is located at.
        - To be used if a contract is already deployed.
    - `filesystem` (default: {})
        - Key-value map with name of the include as key and source code of the include as value.
    - `forceCodeCheck` (default: true)
        - Don't check source code.
    - `opt` (default: {})
        - Object with other [transaction options](../transaction-options.md) which will be provided to **every transaction** that is initiated using the contract instance. You should be aware that:
            - For most of these additional options it doesn't make sense to define them at contract instance level.
            - You wouldn't want to provide an `amount` to each transaction or use the same `nonce` which would result in invalid transactions.
            - For options like `ttl` or `gasPrice` it does absolutely make sense to set this on contract instance level.

## 4. Deploy the contract

If you have a Sophia contract that looks like this:
```sophia
contract Increment =

    record state =
        { count: int }

    entrypoint init(start: int) = 
        { count = start }

    stateful entrypoint increment(value: int) =
        put(state{ count = state.count + value })

    entrypoint get_count() =
        state.count
```

The contract can be deployed using the `contractInstance` in two different ways:

```js
const tx = await contractInstance.deploy([1]) // recommended
// or
const tx = await contractInstance.methods.init(1)

// after successful deployment you can look up the transaction and the deploy information
console.log(tx)
console.log(contractInstance.deployInfo) // { owner, transaction, address, createdAt, result, rawTx }
```

Note:

- The `init` entrypoint is a special function which is only called once for deployment, initializes the contract's state and doesn't require the `stateful` declaration.
- In Sophia all `public functions` are called `entrypoints` and need to be declared as `stateful`
if they should produce changes to the state of the smart contract, see `increment(value: int)`.

## 5. Call contract entrypoints

### a) Stateful entrypoints 
According to the example above you can call the `stateful` entrypoint `increment` by using one of the following lines:

```js
const tx = await contractInstance.methods.increment(3) // recommended
// or
const tx = await contractInstance.methods.increment.send(3)
// or
const tx = await contractInstance.call('increment', [3])
```

Note:

- The functions `send` and `call` provide an explicit way to tell the SDK to sign and broadcast the transaction.
- When using the `increment` function directly the SDK will automatically determine if it's a `stateful` entrypoint.

### b) Regular entrypoints
The aeternity node can expose an API endpoint that allows to execute a `dry-run` for a transaction. You can make use of that functionality to get the result of entrypoints that don't execute state changes. Following lines show how you can do that using the SDK for the `get_count` entrypoint of the example above:

```js
const tx = await contractInstance.methods.get_count() // recommended
// or
const tx = await contractInstance.methods.get_count.get()
// or
const tx = await contractInstance.callStatic('get_count', [])

// access the decoded result returned by the execution of the entrypoint
console.log(tx.decodedResult);
```

Note:

- The functions `get` and `callStatic` provide an explicit way to tell the SDK to perform a `dry-run` and to **NOT** broadcast the transaction.
- When using the `get_count` function directly the SDK will automatically determine that the function is not declared `stateful` and thus perform a `dry-run`, too.

### c) Payable entrypoints
You will probably also write functions that require an amount of `aettos` to be provided. These functions must be declared with `payable` and (most likely) `stateful`. Let's assume you have declared following Sophia entrypoint which checks if a required amount of `aettos` has been provided before it continues execution:

```sophia
payable stateful entrypoint fund_project(project_id: int) =
        require(Call.value >= 50, "at least 50 aettos need to be provided")
        // further logic ...
```

In order to successfully call the `fund_project` entrypoint you need to provide at least 50 `aettos`. You can do this by providing the desired amount of `aettos` using one of the following lines:

```js
const tx = await contractInstance.methods.fund_project(1, { amount: 50 }) // recommended
// or
const tx = await contractInstance.methods.fund_project.send(1, { amount: 50 })
// or
const tx = await contractInstance.call('fund_project', [1], { amount: 50 })
```
