# Contracts

## Introduction
The smart contract language of the æternity blockchain is [Sophia](https://docs.aeternity.com/aesophia). It is a functional language in the ML family, strongly typed and has restricted mutable state.

Before interacting with contracts using the SDK you should get familiar with Sophia itself first. Have a look into [aepp-sophia-examples](https://github.com/aeternity/aepp-sophia-examples) and start rapid prototyping using [AEstudio](https://studio.aepps.com).

## 1. Specify imports
```js
// node.js import
const { AeSdk, MemoryAccount, Node } = require('@aeternity/aepp-sdk')
// ES import
import { AeSdk, MemoryAccount, Node } from '@aeternity/aepp-sdk'
// additionally you may need to import CompilerCli or CompilerHttp
```

## 2. Setup compiler
Compiler primarily used to generate bytecode to deploy a contract.
Skip this step if you have a contract bytecode or need to interact with an already deployed contract.
Out-of-the-box SDK supports [aesophia_cli](https://github.com/aeternity/aesophia_cli) and [aesophia_http](https://github.com/aeternity/aesophia_http) implemented in [CompilerCli](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/api/classes/CompilerCli.html) and [CompilerHttp](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/api/classes/CompilerHttp.html) respectively.

CompilerCli is available only in Node.js and requires Erlang installed (`escript` available in `$PATH`), Windows is supported.
```js
const compiler = new CompilerCli()
```

CompilerHttp requires a hosted compiler service. Preferable to host your own compiler service since [compiler.aepps.com](https://v7.compiler.aepps.com/api) is planned to be decommissioned. An example of how to run it using [docker-compose](https://github.com/aeternity/aepp-sdk-js/blob/cd8dd7f76a6323383349b48400af0d69c2cfd88e/docker-compose.yml#L11-L14).
```js
const compiler = new CompilerHttp('https://v7.compiler.aepps.com') // host your own compiler
```

Both compiler classes implement the [same interface](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/api/classes/CompilerBase.html) that can be used to generate bytecode and ACI without a Contract instance.

## 3. Create an instance of the SDK
When creating an instance of the SDK you need to provide an account which will be used to sign transactions like `ContractCreateTx` and `ContractCallTx` that will be broadcasted to the network.

```js
const node = new Node('https://testnet.aeternity.io') // ideally host your own node
const account = new MemoryAccount(SECRET_KEY)

const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [account],
  onCompiler: compiler, // remove if step #2 skipped
})
```

Note:

- You can provide multiple accounts to the SDK.
- For each transaction you can choose a specific account to use for signing (by default the first account will be used), see [transaction options](../transaction-options.md).
    - This is specifically important and useful for writing tests.

## 4. Initialize the contract instance

To do so, we need to prepare an options object, which can be done in multiple ways.

### By source code

```js
const sourceCode = ... // source code of the contract
const options = { sourceCode }
```

Note:

- If your contract includes external dependencies which are not part of the [standard library](https://docs.aeternity.com/aesophia/latest/sophia_stdlib) you should initialize the contract using:
  ```js
  const fileSystem = ... // key-value map with name of the include as key and source code of the include as value
  const options = { sourceCode, fileSystem }
  ```

### By path to source code (available only in Node.js)
It can be used with both CompilerCli and CompilerHttp. This way contract imports would be handled automatically, with no need to provide `fileSystem` option.
```js
const sourceCodePath = './example.aes'
const options = { sourceCodePath }
```

### By ACI and bytecode
If you pre-compiled the contracts you can also initialize a contract instance by providing ACI and bytecode:

```js
const aci = ... // ACI of the contract
const bytecode = ... // bytecode of the contract
const options = { aci, bytecode }
```

### By ACI and contract address
In many cases an application doesn't need to deploy a contract or verify its bytecode. In this case you'd want to initialize the instance by just providing the ACI and the contract address. This is also possible:

```js
const aci = ... // ACI of the contract
const address = ... // the address of the contract
const options = { aci, address }
```

### Create contract instance
Do it by `Contract::initialize`.
```js
const contract = await Contract.initialize({ ...aeSdk.getContext(), ...options })
```
`AeSdk:getContext` is used to get base options to instantiate contracts. These options include the current account, node, and compiler. They are referenced using Proxy class, pointing to the latest values specified in AeSdk. So, if you change the selected node in the AeSdk instance, it will be also changed in bound contract instances.

### Options

- Following attributes can be provided via `options` to `Contract::initialize`:
    - `aci` (default: obtained via `onCompiler`)
        - The Contract ACI.
    - `address`
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

### Keep bytecode and ACI for future use
After the contract is initialized you can persist values of `contract._aci` and `contract.$options.bytecode`.
They can be provided for subsequent contract initializations to don't depend on a compiler.

## 5. Deploy the contract

If you have a Sophia contract source code that looks like this:
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

The contract can be deployed using the `contract` in two different ways:

```js
const tx = await contract.$deploy([1])
// or
const tx = await contract.init(1)

// after successful deployment you can look up the transaction and the deploy information
console.log(tx) // { owner, transaction, address, result, rawTx }
```

Note:

- Deployment is only possible if the contract instance was initialized by providing source code or bytecode.
- The `init` entrypoint is a special function which is only called once for deployment, initializes the contract's state and doesn't require the `stateful` declaration.
- In Sophia all `public functions` are called `entrypoints` and need to be declared as `stateful`
if they should produce changes to the state of the smart contract, see `increment(value: int)`.

## 6. Call contract entrypoints

### a) Stateful entrypoints
According to the example above you can call the `stateful` entrypoint `increment` by using one of the following lines:

```js
const tx = await contract.increment(3) // recommended
// or
const tx = await contract.increment(3, { callStatic: false })
// or
const tx = await contract.$call('increment', [3])
```

Note:

- The `callStatic: false` option provide an explicit way to tell the SDK to sign and broadcast the transaction.
- When using the `increment` function directly the SDK will automatically determine if it's a `stateful` entrypoint.

### b) Regular entrypoints
The æternity node can expose an API endpoint that allows to execute a `dry-run` for a transaction. You can make use of that functionality to get the result of entrypoints that don't execute state changes. Following lines show how you can do that using the SDK for the `get_count` entrypoint of the example above:

```js
const tx = await contract.get_count() // recommended
// or
const tx = await contract.get_count({ callStatic: true })

// access the decoded result returned by the execution of the entrypoint
console.log(tx.decodedResult);
```

Note:

- The `callStatic` option provide an explicit way to tell the SDK to perform a `dry-run` and to **NOT** broadcast the transaction.
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
const tx = await contract.fund_project(1, { amount: 50 }) // recommended
// or
const tx = await contract.$call('fund_project', [1], { amount: 50 })
```

## Transaction options
As already stated various times in the guide it is possible to provide [transaction options](../transaction-options.md) as object to a function of the SDK that builds and potentially broadcasts a transaction. This object can be passed as additional param to each of these functions and overrides the default settings.

## Sophia datatype cheatsheet
Sometimes you might wonder how to pass params to the JavaScript method that calls an entrypoint of your Sophia smart contract.
The conversion between JS and Sophia values is handled by aepp-calldata library.
Refer to [its documentation](https://www.npmjs.com/package/@aeternity/aepp-calldata#data-types) to find the right type to use.

## Generate file system object in Node.js
To do so you can use [getFileSystem](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/api/functions/getFileSystem.html) function.
In most cases, you don't need to do it explicitly. Prefer to use `sourceCodePath` instead `sourceCode` in
[Contract::initialize](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/api/classes/_internal_.Contract.html#initialize),
and [compile](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/api/classes/CompilerBase.html#compile)
instead [compileBySourceCode](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/api/classes/CompilerBase.html#compileBySourceCode) in CompilerBase.
