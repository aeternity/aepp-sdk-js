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

// # InnerTx: ContractCallTx
//
// ## Introduction
// The whole script is [located in the repository](https://github.com/aeternity/aepp-sdk-js/blob/master/examples/node/paying-for-tx-contract-call-tx.js)
// and this page explains in detail how to:
//
//  - Create and sign a `ContractCallTx` with the `innerTx` option for an account that has no balance.
//  - Wrap the signed `ContractCallTx` in a `PayingForTx` using an account with balance to pay the fees of the inner transaction.
//
// Note:
//
//  - This can be done for ***any*** transaction type!
//
// ### UseCases
// This functionality allows **every service** to let their users interact with their
// decentralized aepp without having them to buy AE by covering their fees.
//
// Examples:
//
//  - Game developers that want to quickly onboard new users.
//  - Governance æpps that want people to vote on important proposals without having them to pay anything.
//  - Custodians that want to offer an additional services to cover the transaction fees of their clients.
//  - ... many more!

// ## 1. Specify imports
// You need to import `Universal`, `Node` and `MemoryAccount` [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) from the SDK.
// Additionally you import the `Crypto` utility module to generate a new keypair.
const { Universal, Node, MemoryAccount, Crypto } = require('@aeternity/aepp-sdk')

// **Note**:
//
//  - You need to have the SDK installed via `npm i @aetenity/aepp-sdk -g` to run that example code.

// ## 2. Define constants
// The following constants are used in the subsequent code snippets.
const PAYER_ACCOUNT_KEYPAIR = {
  publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
  secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
}
const NODE_URL = 'https://testnet.aeternity.io';
const COMPILER_URL = 'https://compiler.aepps.com';
const CONTRACT_ADDRESS = 'ct_iy86kak8GGt4U5VjDFNQf1a9qjbyxKpmGVNe3UuKwnmcM6LW8';
const CONTRACT_SOURCE =
`
@compiler >= 6

contract PayingForTxExample =

    record state = { last_caller: option(address) }

    entrypoint init() =
        { last_caller = None }

    stateful entrypoint set_last_caller() =
        put(state{last_caller = Some(Call.caller)})

    entrypoint get_last_caller() : option(address) =
        state.last_caller
`
const NEW_USER_KEYPAIR = Crypto.generateKeyPair();

// Note:
//
//  - The keypair of the account is pre-funded and only used for demonstration purpose
//      - You can replace it with your own keypair (see [Create a Keypair](../../quick-start.md#2-create-a-keypair))
//      - In case the account runs out of funds you can always request AE using the [Faucet](https://faucet.aepps.com/)
//  - The contract is already deployed at the defined address.
//  - The `NEW_USER_KEYPAIR` is used to call the contract. The `PayingForTx` allows the new user to perform a contract call without having any funds.

// ## 3. Open async codeblock
// Most functions of the SDK return _Promises_, so the recommended way of
// dealing with subsequent actions is running them one by one using `await`.
// Therefore we are putting our logic into an `async` code block
(async () => {

  // ## 4. Create object instances
  const payerAccount = MemoryAccount({ keypair: PAYER_ACCOUNT_KEYPAIR })
  const newUserAccount = MemoryAccount({ keypair: NEW_USER_KEYPAIR })
  const node = await Node({ url: NODE_URL })
  const client = await Universal({
    nodes: [{ name: 'testnet', instance: node }],
    compilerUrl: COMPILER_URL,
    accounts: [payerAccount, newUserAccount],
  })

  // The `Universal` [Stamp](https://stampit.js.org/essentials/what-is-a-stamp) itself is asynchronous as it determines the node's version and
  // rest interface automatically. Only once the Promise is fulfilled, you know you have a working object instance
  // which is assigned to the `client` constant in this case.
  //
  // Note:
  //
  //  - `Universal` is not a constructor but a factory, which means it's *not* invoked with `new`.

  // ## 5. Create and sign `ContractCallTx` on behalf of new user
  // Currently there is no high-level API available that allows you to create and sign the `ContractCallTx`
  // by invoking the generated contract method on the contract instance that you typically use for contract calls.
  //
  // Following 3 steps need to be done:
  //
  //  1. Create calldata by calling the http compiler using `contractEncodeCallDataAPI` and providing
  //     the contract source, the name of the `entrypoint` to call as well as the required params.
  //      - The `entrypoint` with the name `set_latest_caller` doesn't require any params so you can provide an empty array
  //  1. Create the `ContractCreateTx` by providing all required params.
  //      - You could omit `amount`, `gas` and `gasPrice` if you choose to stick to the default values (see [transaction options](../../../transaction-options#contractcreatetx-contractcalltx))
  //  1. Sign the transaction by providing `innerTx: true` as transaction option.
  //      - The transaction will be signed in a special way that is required for inner transactions.
  //
  const calldata = await client.contractEncodeCallDataAPI(CONTRACT_SOURCE, "set_last_caller", [])
  const contractCallTx = await client.contractCallTx({ callerId: await newUserAccount.address(), contractId: CONTRACT_ADDRESS, amount: 0, gas: 1000000, gasPrice: 1500000000, callData: calldata })
  const signedContractCallTx = await client.signTransaction(contractCallTx, { onAccount: newUserAccount, innerTx: true })

  // ## 6. Create, sign & broadcast the `PayingForTx` as payer
  const payForTx = await client.payForTransaction(signedContractCallTx, { onAccount: payerAccount })
  console.log(payForTx)

  // ## 7. Check that last caller is the new user
  // Knowing the contract address and the source code allows you to
  // initialize a contract instance and interact with the contract in a convenient way.
  const contractInstance = await client.getContractInstance(CONTRACT_SOURCE, { contractAddress: CONTRACT_ADDRESS })
  const dryRunTx = await contractInstance.methods.get_last_caller()
  console.log(`New user: ${await newUserAccount.address()}`)
  console.log(`Last caller:`, dryRunTx.decodedResult)

  // Note:
  //
  //  - Last caller should now be the address of the new user.
  //  - For regular (non-stateful) entrypoints the SDK automatically performs a dry-run which allows to perform read-only calls for free, see [Contract guide](../../guides/contracts.md#b-regular-entrypoints).

// ## 8. Close and run async codeblock
// Now you can close the async codeblock and execute it at the same time.
})()
