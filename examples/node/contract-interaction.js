#!/usr/bin/env node
/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
// # Compile & Deploy a Sophia Smart Contract
//
// ## Introduction
// The whole script is [located in the repository](https://github.com/aeternity/aepp-sdk-js/blob/master/examples/node/contract.js) and this page explains in detail how to:
//
// - deal with the different phases of compiling Sophia contracts to bytecode
// - deploy the bytecode to get a callable contract address
// - invoke the deployed contract on the æternity blockchain using `callStatic`
// - get the contract instance of an already deployed contract
// - access an `entrypoint` (public contract function) directly without using `call` or `callStatic`

// ## 1. Specify imports
//
// You need to import `Universal`, `Node` and `MemoryAccount` [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) from the SDK.
const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk')

// **Note**:
//
//  - You need to have the SDK installed via `npm i @aetenity/aepp-sdk -g` to run that example code.

// ## 2. Define constants
// The following constants are used in the subsequent code snippets.
const CONTRACT_CODE = // typically you read the source code from a separate .aes file
`
contract Multiplier =
  record state = { factor: int }
  entrypoint init(f : int) : state = { factor = f }
  entrypoint multiplyBy(x : int) = x * state.factor
`
const ACCOUNT_KEYPAIR = {
  publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
  secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
}
const NODE_URL = 'https://testnet.aeternity.io';
const COMPILER_URL = 'https://compiler.aepps.com';

// Note:
//
//  - The keypair of the account is pre-funded and only used for demonstration purpose
//      - You should replace it with your own keypair (see [Create a Keypair](../../quick-start.md#2-create-a-keypair))
//  - In case the account runs out of funds you can always request AE using the [Faucet](https://faucet.aepps.com/)

// ## 3. Open async codeblock
// Most functions of the SDK return _Promises_, so the recommended way of
// dealing with subsequent actions is running them one by one using `await`.
// Therefore you need to put the logic into an `async` code block
(async () => {

  // ## 4. Create object instances
  const account = MemoryAccount({ keypair: ACCOUNT_KEYPAIR })
  const node = await Node({ url: NODE_URL })
  const client = await Universal({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: COMPILER_URL,
    accounts: [account]
  });

  // The `Universal` [Stamp](https://stampit.js.org/essentials/what-is-a-stamp) itself is asynchronous as it determines the node's version and
  // rest interface automatically. Only once the Promise is fulfilled, you know you have a working object instance
  // which is assigned to the `client` constant in this case.
  //
  // Note:
  //
  //   - `Universal` is not a constructor but a factory, which means it's *not* invoked with `new`.

  // ## 5. Compile the contract
  // The `contractCompile` function takes a raw Sophia contract as string and sends it
  // to the HTTP compiler for bytecode compilation. In the future this will be done
  // without talking to the node, but requiring a bytecode compiler
  // implementation directly in the SDK.
  console.log(CONTRACT_CODE);
  const bytecode = await client.contractCompile(CONTRACT_CODE)
  console.log(`Obtained bytecode ${bytecode.bytecode}`)

  // ## 6. Deploy the contract
  // Invoking `deploy` on the bytecode object will result in the `CreateContractTx`
  // being created, signed (using the _secretKey_ of the previously defined `MemoryAccount`) and broadcasted to the network.
  // It will be picked up by the miners and written to the chain.

  const contract = await bytecode.deploy([5])
  console.log(`Contract deployed at ${contract.address}`)

  // Note:
  //
  //  - Sophia contracts always have an `init` function which needs to be invoked.
  //  - The SDK receives the required `calldata` for the provided arguments by calling the HTTP compiler.

  // ## 7. Call a contract function via dry-run
  // Once the `ContractCreateTx` has been successfully mined, you can attempt to invoke
  // any public function (aka `entrypoint` in Sophia) defined within it.
  // In this case you can use `callStatic` which performs a `dry-run` of the transaction which allows you to get the result without having to mine a transaction.

  const call = await contract.callStatic('multiplyBy', [7])

  // **Note**:
  //
  //    - for `stateful entrypoints` that may apply changes to the contract's state you will always have to use `call` which broadcasts the transaction to be mined

  // ## 8. Decode the call result
  // The execution result, if successful, will be an FATE-encoded result value.
  // The `decode` function will use the Sophia HTTP compiler to decode the result value.

  console.log(`Execution result: ${call.decodedResult}`)

  // ## 9. Get contract instance of a deployed contract
  // Knowing the contract address and the source code allows you to
  // initialize a contract instance and interact with the contract in a convenient way.

  const contractInstance = await client.getContractInstance(CONTRACT_CODE, {contractAddress: contract.address})
  const callResult = await contractInstance.methods.multiplyBy(7)
  console.log(`Execution result (via contractInstance initialized with existing contract): ${callResult.decodedResult}`)

  // Note:
  //
  //  - The `contractInstance` automatically chooses to perform a dry-run call as `multiplyBy` is a non-stateful entrypoint
  //      - if `multiplyBy` would be a `stateful entrypoint` the transaction would be broadcasted to the network and picked up by miners
  //  - The `decodedResult` is automatically being included in the `callResult`
  //  - You can also use `getContractInstance` directly to deploy a contract
  //    and avoid having to call `contractCompile` (step 5),  `call`/`callStatic` (step 7) and `decode` (step 8) manually
  //      - see [Contracts Guide](../../guides/contracts.md)

// ## 10. Close and run async codeblock
// Now you can close the async codeblock and execute it at the same time.
})()
