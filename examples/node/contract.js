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
// This script is [located in the repository](https://github.com/aeternity/aepp-sdk-js/blob/master/examples/node/contract.js) and this page explains in detail how to:
//
// * deal with the different phases of compiling Sophia contracts to bytecode
// * deploy the bytecode to get a callable contract address
// * invoke the deployed contract on the æternity blockchain using `callStatic`
// * get the contract instance of an already deployed contract
// * access an `entrypoint` (public contract function) directly without using `call` or `callStatic`


// ## 1. Specify imports
//
// We'll need to import `Universal`, `Node` and `MemoryAccount` [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) from the SDK.
const { Universal, Node, MemoryAccount } = require('@aetenity/aepp-sdk')

// **Note**:

//    - you need to have the SDK installed via `npm i @aetenity/aepp-sdk -g` to run that example code

// ## 2. Define constants
// The following constants are used in the subsequent code snippets.
const CONTRACT_CODE =
  `contract Multiplier =
    record state = { factor: int }
    stateful entrypoint init(f : int) : state = { factor = f }
    entrypoint multiplyBy(x : int) = x * state.factor`

const ACCOUNT_KEYPAIR = {
  publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
  secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
}
const NODE_URL = 'https://testnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com'

// ## 3. Async codeblock
// Most functions of the SDK return _Promises_, so the recommended way of
// dealing with subsequent actions is running them one by one using `await`.
// Therefore we are putting our logic into an `async` code block
(async () => {

  // ## 4. Create object instances
  const account = MemoryAccount({ keypair: ACCOUNT_KEYPAIR })
  const node = await Node({ url: NODE_URL })

  // The `Universal` [Stamp](https://stampit.js.org/essentials/what-is-a-stamp) itself is asynchronous as it determines the node's version and
  // rest interface automatically. Only once the Promise is fulfilled, we know
  // we have a working object instance which is assigned to the `client` constant in this case. Please take note `Universal` is not a constructor but
  // a factory, which means it's *not* invoked with `new`.
  const client = await Universal({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: COMPILER_URL,
    accounts: [account]
  })

  // ## 5. Compile the contract
  // The `contractCompile` function takes a raw Sophia contract as string and sends it
  // to the HTTP compiler for bytecode compilation. In the future this will be done
  // without talking to the node, but requiring a bytecode compiler
  // implementation directly in the SDK.
  const bytecode = await client.contractCompile(CONTRACT_CODE)
  console.log(`Obtained bytecode ${bytecode.bytecode}`)

  // Invoking `deploy` on the bytecode object will result in the contract
  // being written to the chain, once the block has been mined.
  // Sophia contracts always have an `init` method which needs to be invoked. In this case this is done via the `deploy` method.
  // The arguments to `init` have to be provided at deployment time.
  // If the `init` function doesn't expect an argument you need to provide an empty array.

  const contract = await bytecode.deploy(['5'])
  console.log(`Contract deployed at ${contract.address}`)

  // Once the `ContractCreateTx` has been successfully mined, we can attempt to invoke
  // any public function (aka `entrypoint` in Sophia) defined within it.

  const call = await contract.callStatic('multiplyBy', ['7'])
  console.log(call)
  console.log(`Contract call transaction hash ${call.hash}`)

  // The execution result, if successful, will be an FATE-encoded result value.
  // We are using HTTP compiler to decode the result value.

  console.log(`Execution result: ${await call.decode()}`)

  // We now 
})()
