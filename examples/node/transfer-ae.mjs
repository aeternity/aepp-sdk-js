#!/usr/bin/env node
// # Transfer AE
//
// ## Introduction
// The whole script is [located in the repository](https://github.com/aeternity/aepp-sdk-js/blob/master/examples/node/transfer-ae.mjs)
// and this page explains in detail how to:
//
//  - initialize an instance of the SDK with a pre-funded account
//  - transfer AE to another account

// ## 1. Specify imports
// You need to import `AeSdk`, `Node` and `MemoryAccount` classes from the SDK.
import { AeSdk, Node, MemoryAccount } from '@aeternity/aepp-sdk';

// **Note**:
//
//  - You need to have the SDK installed via `npm i @aetenity/aepp-sdk -g` to run that example code.

// ## 2. Define constants
// The following constants are used in the subsequent code snippets.
const ACCOUNT_KEYPAIR = {
  publicKey: 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
  secretKey: '9ebd7beda0c79af72a42ece3821a56eff16359b6df376cf049aee995565f022f840c974b97164776454ba119d84edc4d6058a8dec92b6edc578ab2d30b4c4200',
};
const NODE_URL = 'https://testnet.aeternity.io';
const [amount = 1, recipient = ACCOUNT_KEYPAIR.publicKey] = process.argv.slice(2);

// Note:
//
//  - The secret key of the account is pre-funded and only used for demonstration purpose
//      - You should replace it with your own keypair
//        (see [Create a Keypair](../../quick-start.md#2-create-a-keypair))
//  - In case the account runs out of funds you can always request AE using the [Faucet](https://faucet.aepps.com/)
//  - By default the script will transfer `1 aetto` and use the demo account itself as recipient
//      - Optionally you can provide the amount and a different recipient by providing the
//        arguments when executing the script,
//        e.g. `node transfer-ae.js 3 ak_6D2uyunJaERXfgbsc94G8vrp79nZrbtorL7VCRXk3sWiFK5jb`

// ## 3. Create object instances
const account = new MemoryAccount(ACCOUNT_KEYPAIR.secretKey);
const node = new Node(NODE_URL);
const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [account],
});

// ## 4. Get AE balance of recipient (before transfer)
// Before the transfer of AE you can check the AE balance of the recipient.
const balanceBefore = await aeSdk.getBalance(recipient);
console.log(`Balance of ${recipient} (before): ${balanceBefore} aettos`);

// ## 5. Transfer AE
// Calling the `spend` function will create, sign and broadcast a `SpendTx` to the network.
const tx = await aeSdk.spend(amount, recipient);
console.log('Transaction mined', tx);
// Alternatively, you can use [transferFunds](https://docs.aeternity.com/aepp-sdk-js/latest/api/functions/transferFunds.html)
// method to transfer a fraction of your AE to another account.

// ## 6. Get AE balance of recipient (after transfer)
const balanceAfter = await aeSdk.getBalance(recipient);
console.log(`Balance of ${recipient} (after): ${balanceAfter} aettos`);

// Note:
//
//  - If the recipient is the same account as the sender (default of the script if no arguments
//    provided) the balance will be lower after transfer because a transaction `fee` has been
//    paid to the miners.
