#!/usr/bin/env node
// # Simple Sophia Contract Compiler
//
// This script demonstrates how to
//
// * deal with the different phases of compiling Sophia contracts to bytecode,
// * deploying the bytecode to get a callable contract address and ultimately,
// * invoke the deployed contract on the æternity blockchain.
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

// We'll need the main client module `Sdk` in the `Universal` flavor from the SDK.
const { Universal: Sdk, Node, MemoryAccount } = require('../../dist/aepp-sdk')

// Define some constants
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

// Generate the account instance based on the keypair
const account = MemoryAccount({ keypair: ACCOUNT_KEYPAIR });

// Most methods in the SDK return _Promises_, so the recommended way of
// dealing with subsequent actions is running them one by one using `await`.
(async () => {
  const node = await Node({ url: NODE_URL })

  // `Sdk` itself is asynchronous as it determines the node's version and
  // rest interface automatically. Only once the Promise is fulfilled, we know
  // we have a working `Sdk` instance. Please take note `Sdk` is not a constructor but
  // a factory, which means it's *not* invoked with `new`.
  const sdk = await Sdk({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: 'https://compiler.aepps.com',
    accounts: [account]
  })

  // `contractCompile` takes a raw Sophia contract in string form and sends it
  // off to the HTTP compiler for bytecode compilation. In the future this will be done
  // without talking to the node, but requiring a bytecode compiler
  // implementation directly in the SDK.
  const bytecode = await sdk.contractCompile(CONTRACT_CODE)
  console.log(`Obtained bytecode ${bytecode.bytecode}`)

  // Invoking `deploy` on the bytecode object will result in the contract
  // being written to the chain, once the block has been mined.
  // Sophia contracts always have an `init` method which needs to be invoked,
  // even when the contract's `state` is `unit` (`()`). The arguments to
  // `init` have to be provided at deployment time and will be written to the
  // block as well, together with the contract's bytecode.
  const deployed = await bytecode.deploy(['5'])
  console.log(`Contract deployed at ${deployed.address}`)

  // Once the contract has been successfully mined, we can attempt to invoke
  // any public function defined within it. The miner who found the next block
  // will not only be rewarded a fixed amount, but also an amount depending on
  // the amount of gas spend.
  const call = await deployed.call('multiplyBy', ['7'])
  console.log(`Contract call transaction hash ${call.hash}`)

  // The execution result, if successful, will be an FATE-encoded result value.
  // We are using HTTP compiler to decode the result value.
  console.log(`Execution result: ${await call.decode()}`)
})()
