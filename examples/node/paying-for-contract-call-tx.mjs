#!/usr/bin/env node
// # InnerTx: ContractCallTx
//
// ## Introduction
// The whole script is [located in the repository](https://github.com/aeternity/aepp-sdk-js/blob/master/examples/node/paying-for-contract-call-tx.mjs)
// and this page explains in detail how to:
//
//  - Create and sign a `ContractCallTx` with the `innerTx` option for an account that has no
//    balance.
//  - Wrap the signed `ContractCallTx` in a `PayingForTx` using an account with balance to pay the
//    fees of the inner transaction.
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
//  - Governance æpps that want people to vote on important proposals without having them to pay
//    anything.
//  - Custodians that want to offer an additional services to cover the transaction fees of their
//    clients.
//  - ... many more!

// ## 1. Specify imports
// You need to import `AeSdk`, `Node` and `MemoryAccount` classes from the SDK.
// Additionally you import the `generateKeyPair` utility function to generate a new keypair.
import {
  AeSdk, Contract, CompilerHttp, Node, MemoryAccount, Tag,
} from '@aeternity/aepp-sdk';

// **Note**:
//
//  - You need to have the SDK installed via `npm i @aetenity/aepp-sdk -g` to run that example code.

// ## 2. Define constants
// The following constants are used in the subsequent code snippets.
const PAYER_ACCOUNT_SECRET_KEY = '9ebd7beda0c79af72a42ece3821a56eff16359b6df376cf049aee995565f022f840c974b97164776454ba119d84edc4d6058a8dec92b6edc578ab2d30b4c4200';
const NODE_URL = 'https://testnet.aeternity.io';
const COMPILER_URL = 'https://v7.compiler.aepps.com';
const CONTRACT_ADDRESS = 'ct_iy86kak8GGt4U5VjDFNQf1a9qjbyxKpmGVNe3UuKwnmcM6LW8';
const CONTRACT_SOURCE_CODE = `
@compiler >= 6

contract PayingForTxExample =

    record state = { last_caller: option(address) }

    entrypoint init() =
        { last_caller = None }

    stateful entrypoint set_last_caller() =
        put(state{last_caller = Some(Call.caller)})

    entrypoint get_last_caller() : option(address) =
        state.last_caller
`;

// Note:
//
//  - The secret key of the account is pre-funded and only used for demonstration purpose
//      - You can replace it with your own keypair (see
//        [Create a Keypair](../../quick-start.md#2-create-a-keypair))
//      - In case the account runs out of funds you can always request AE using the [Faucet](https://faucet.aepps.com/)
//  - The contract is already deployed at the defined address.
//  - The `NEW_USER_KEYPAIR` is used to call the contract. The `PayingForTx` allows the new user to
//    perform a contract call without having any funds.

// ## 3. Create object instances
const payerAccount = new MemoryAccount(PAYER_ACCOUNT_SECRET_KEY);
const newUserAccount = MemoryAccount.generate();
const node = new Node(NODE_URL);
const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: node }],
  accounts: [payerAccount, newUserAccount],
  onCompiler: new CompilerHttp(COMPILER_URL),
});

// ## 4. Create and sign `ContractCallTx` on behalf of new user
// Currently there is no high-level API available that allows you to create and sign the
// `ContractCallTx` by invoking the generated contract method on the contract instance that you
// typically use for contract calls.
//
// Following 4 steps need to be done:
//
//  1. Initialize a contract instance by the source code and the contract address.
//  1. Create calldata by calling the `encode` function providing the contract name, the name of
//     the `entrypoint` to call as well as the required params.
//      - The `entrypoint` with the name `set_latest_caller` doesn't require any params so you
//        can provide an empty array
//  1. Create the `ContractCreateTx` by providing all required params.
//      - You could omit `amount`, `gasLimit` and `gasPrice` if you choose to stick to the default
//        values (see
//        [transaction options](../../../transaction-options#contractcreatetx-contractcalltx))
//  1. Sign the transaction by providing `innerTx: true` as transaction option.
//      - The transaction will be signed in a special way that is required for inner transactions.
//
const contract = await Contract.initialize({
  ...aeSdk.getContext(), sourceCode: CONTRACT_SOURCE_CODE, address: CONTRACT_ADDRESS,
});
const calldata = contract._calldata.encode('PayingForTxExample', 'set_last_caller', []);
const contractCallTx = await aeSdk.buildTx({
  tag: Tag.ContractCallTx,
  callerId: newUserAccount.address,
  contractId: CONTRACT_ADDRESS,
  amount: 0,
  gasLimit: 1000000,
  gasPrice: 1500000000,
  callData: calldata,
});
const signedContractCallTx = await aeSdk.signTransaction(
  contractCallTx,
  { onAccount: newUserAccount, innerTx: true },
);

// ## 5. Create, sign & broadcast the `PayingForTx` as payer
const payForTx = await aeSdk.payForTransaction(signedContractCallTx, { onAccount: payerAccount });
console.log(payForTx);

// ## 6. Check that last caller is the new user
// Contract instance allows interacting with the contract in a convenient way.
const dryRunTx = await contract.get_last_caller();
console.log(`New user: ${newUserAccount.address}`);
console.log('Last caller:', dryRunTx.decodedResult);

// Note:
//
//  - Last caller should now be the address of the new user.
//  - For regular (non-stateful) entrypoints the SDK automatically performs a dry-run which
//    allows to perform read-only calls for free, see
//    [Contract guide](../../guides/contracts.md#b-regular-entrypoints).
