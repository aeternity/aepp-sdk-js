# Contracts

## Introduction
The smart contract language of the æternity blockchain is [Sophia](https://aeternity.com/aesophia). It is a functional language in the ML family, strongly typed and has restricted mutable state.

Before interacting with contracts using the SDK you should get familiar with Sophia itself first. Have a look into [aepp-sophia-examples](https://github.com/aeternity/aepp-sophia-examples) and start rapid prototyping using [AEstudio](https://studio.aepps.com).

The SDK needs to interact with following components in order to enable smart contract interactions on the æternity blockchain:

- [æternity](https://github.com/aeternity/aeternity) (host your own one or use the public testnet node at `https://testnet.aeternity.io`)
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

## 2. Create an instance of the SDK
When creating an instance of the SDK you need to provide an account which will be used to sign transactions like `ContractCreateTx` and `ContractCallTx` that will be broadcasted to the network.

```js
const node = await Node({
  url: 'https://testnet.aeternity.io' // ideally host your own node
})
const account = MemoryAccount({
  // provide a valid keypair with your secretKey and publicKey
  keypair: { secretKey: SECRET_KEY, publicKey: PUBLIC_KEY }
})

const aeSdk = await Universal({
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

### By sourcecode

```js
const CONTRACT_SOURCE = ... // source code of the contract
const contractInstance = await aeSdk.getContractInstance({ source: CONTRACT_SOURCE })
```

Note:

- If your contract includes external dependencies which are not part of the [standard library](https://aeternity.com/aesophia/latest/sophia_stdlib) you should initialize the contract using:
  ```js
  const fileSystem = ... // key-value map with name of the include as key and source code of the include as value
  const contractInstance = await aeSdk.getContractInstance({ source: CONTRACT_SOURCE, fileSystem })
  ```

### By ACI and bytecode
If you pre-compiled the contracts you can also initialize a contract instance by providing ACI and bytecode:

```js
const aci = ... // ACI of the contract
const bytecode = ... // bytecode of the contract
const contractInstance = await aeSdk.getContractInstance({ aci, bytecode })
```

### By ACI and contract address
In many cases an application doesn't need to deploy a contract or verify its bytecode. In this case you'd want to initialize the instance by just providing the ACI and the contract address. This is also possible:

```js
const aci = ... // ACI of the contract
const contractAddress = ... // the address of the contract
const contractInstance = await aeSdk.getContractInstance({ aci, contractAddress })
```

### Options

- Following attributes can be provided via `options` to `getContractInstance`:
    - `aci` (default: obtained via http compiler)
        - The Contract ACI.
    - `contractAddress`
        - The address where the contract is located at.
        - To be used if a contract is already deployed.
    - `fileSystem` (default: {})
        - Key-value map with name of the include as key and source code of the include as value.
    - `validateBytecode` (default: false)
        - Compare source code with on-chain version.
    - other [transaction options](../transaction-options.md) which will be provided to **every transaction** that is initiated using the contract instance. You should be aware that:
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
console.log(contractInstance.deployInfo) // { owner, transaction, address, result, rawTx }
```

Note:

- Deployment is only possible if the contract instance was initialized by providing sourcecode or bytecode.
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
The æternity node can expose an API endpoint that allows to execute a `dry-run` for a transaction. You can make use of that functionality to get the result of entrypoints that don't execute state changes. Following lines show how you can do that using the SDK for the `get_count` entrypoint of the example above:

```js
const tx = await contractInstance.methods.get_count() // recommended
// or
const tx = await contractInstance.methods.get_count.get()

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
        require(Call.value >= 50, 'at least 50 aettos need to be provided')
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

## Transaction options
As already stated various times in the guide it is possible to provide [transaction options](../transaction-options.md) as object to a function of the SDK that builds and potentially broadcasts a transaction. This object can be passed as additional param to each of these functions and overrides the default settings.

## Sophia datatype cheatsheet
Sometimes you might wonder how to pass params to the JavaScript method that calls an entrypoint of your Sophia smart contract. The following table may help you out.

| Type      | Sophia entrypoint definition      | JavaScript method call                           |
|-----------|-----------------------------------|--------------------------------------------------|
| int       | `add_two(one: int, two: int)`     | `add_two(1 , 2)`                                 |
| address   | `set_owner(owner: address)`       | `set_owner('ak_1337...')`                        |
| bool      | `is_it_true(answer: bool)`        | `is_it_true(true)`                               |
| bits      | `give_me_bits(input: bits)`       | `give_me_bits(0b10110n)`                         |
| bytes     | `get_bytes(test: bytes(3))`       | `get_bytes(new Uint8Array([0x1, 0x1f, 0x10]))`   |
| string    | `hello_world(say_hello: string)`  | `hello_world('Hello!')`                          |
| list      | `have_a_few(candy: list(string))` | `have_a_few(['Skittles', 'M&Ms', 'JellyBelly'])` |
| tuple     | `a_few_things(things: (string * int * map(address, bool)))` | `a_few_things(['hola', 3, new Map([['ak_1337...', true]])])` |
| record    | `record user = {`<br />&nbsp; &nbsp; &nbsp; &nbsp; `firstname: string,` <br /> &nbsp; &nbsp; &nbsp; &nbsp; `lastname: string` <br /> `}` <br />  <br />  `get_firstname(input: user): string`    |  `get_firstname({'firstname': 'Alfred', 'lastname': 'Mustermann'})`  |
| map       | `balances(values: map(address, int))`      |  `balances(new Map([['ak_1337...', 123], ['ak_FCKGW...', 321], ['ak_Rm5U...', 999]]))`  |
| option()  | `number_defined(value: option(int)): bool = `<br />  &nbsp; &nbsp; &nbsp; &nbsp; `Option.is_some(value)`       |  `// the datatype in the option()` <br /> `number_defined(1337) // int in this case`  |
| hash      | `a_gram(of: hash)`      | `// 32 bytes signature` <br />  `a_gram('af01...490f')`  |
| signature | `one_signature(sig: signature)`      |  `// 64 bytes signature` <br />  `one_signature('af01...490f')`  |
| functions | (Higher order) functions are not allowed in `entrypoint` params     |    |
