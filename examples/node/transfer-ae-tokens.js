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

// # Transfer AE tokens
//
// ## Introduction
// The whole script is [located in the repository](https://github.com/aeternity/aepp-sdk-js/blob/master/examples/node/transfer-ae-tokens.js)
// and this page explains in detail how to:
//
//  - initialize the SDK with a pre-funded account
//  - transfer AE tokens to another account

// ## 1. Specify imports
//
// We'll need to import `Universal`, `Node` and `MemoryAccount` [Stamps](https://stampit.js.org/essentials/what-is-a-stamp) from the SDK.
const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk')

// ## 2. Define constants
// The following constants are used in the subsequent code snippets.
const ACCOUNT_KEYPAIR = {
  publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
  secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
}
const NODE_URL = 'https://testnet.aeternity.io';
const [amount = 1, recipient = ACCOUNT_KEYPAIR.publicKey] = process.argv.slice(2);

// Note:
//
//  - The keypair of the account is pre-funded and only used for demonstration purpose
//      - You should replace it with your own keypair (see [Create a Keypair](../../quick-start.md#2-create-a-keypair))
//  - In case the account runs out of funds you can request new AE tokens using the [Faucet](https://faucet.aepps.com/)
//  - By default the script will transfer 1 AE and use the demo account as recipient
//      - Optionally you can provide the amount and a different recipient by providing the arguments when executing the script

// ## 3. Open async codeblock
// Most functions of the SDK return _Promises_, so the recommended way of
// dealing with subsequent actions is running them one by one using `await`.
// Therefore we are putting our logic into an `async` code block
(async () => {
  // ## 4. Create object instances
  const account = MemoryAccount({ keypair: ACCOUNT_KEYPAIR })
  const node = await Node({ url: NODE_URL })
  const client = await Universal({
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [account]
  })

  // The `Universal` [Stamp](https://stampit.js.org/essentials/what-is-a-stamp) itself is asynchronous as it determines the node's version and
  // rest interface automatically. Only once the Promise is fulfilled, we know
  // we have a working object instance which is assigned to the `client` constant in this case.
  // 
  // Note:
  //
  //   - `Universal` is not a constructor but a factory, which means it's *not* invoked with `new`.

  // ## 4. Get AE balance of account
  // T

  // ## 5. Transfer AE tokens
  // Calling the `spend` function will create, sign and broadcast a `SpendTx` to the network.
  const tx = await client.spend(+amount, recipient)
  console.log('Transaction mined', tx)
})()
