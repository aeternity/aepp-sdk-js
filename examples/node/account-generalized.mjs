#!/usr/bin/env node
// # Create and use Generalized Accounts
//
// ## Introduction
// The whole script is [located in the repository](https://github.com/aeternity/aepp-sdk-js/blob/master/examples/node/account-generalized.mjs)
// and this page explains in detail how to:
//
//  - initialize an instance of the SDK with a random account,
//  - top up generated account using faucet on testnet,
//  - make it a generalized account,
//  - transfer AE using generalized account.

// ## 1. Create SDK instance and generate an account
import {
  AeSdk,
  Node,
  MemoryAccount,
  AccountGeneralized,
  CompilerHttp,
  MIN_GAS_PRICE,
} from '@aeternity/aepp-sdk';

const aeSdk = new AeSdk({
  nodes: [{ name: 'testnet', instance: new Node('https://testnet.aeternity.io') }],
  accounts: [MemoryAccount.generate()],
  onCompiler: new CompilerHttp('https://v8.compiler.aepps.com'),
});
const { address } = aeSdk;

// ## 2. Top up generated account using faucet on testnet
const { status } = await fetch(`https://faucet.aepps.com/account/${address}`, { method: 'POST' });
console.assert(status === 200, 'Invalid faucet response code', status);

// ## 3. Create a Generalized Account
console.log('Account info before making generalized', await aeSdk.getAccount(address));
const sourceCode = `contract BlindAuth =
  stateful entrypoint authorize(shouldAuthorize: bool, _: int) : bool =
    switch(Auth.tx_hash)
      None    => abort("Not in Auth context")
      Some(_) => shouldAuthorize
`;
// Authorize entrypoint doesn't implement any specific logic, it just returns the argument.
// It means that anybody can make a transaction on behalf of this account. You can implement an
// arbitrary validation logic in authorize entrypoint based on the contract state, transaction to
// approve, and call arguments. Also, you can involve custom signing algorithms.

const { gaContractId } = await aeSdk.createGeneralizedAccount('authorize', [], { sourceCode });
console.log('Attached contract address', gaContractId);
// You can pass `bytecode` and `aci` options instead of `sourceCode` to don't depend on compiler.

console.log(await aeSdk.getAccount(address));
// Note that account kind changed from `basic` to `generalized`, added `contractId`,
// `authFun` fields.

// ## 4. Switch SDK instance to AccountGeneralized
// After making the account generalized, the node would stop accepting transactions signed using
// the private key of that account. So, we need to replace the instance of MemoryAccount with
// AccountGeneralized.
aeSdk.removeAccount(address);
aeSdk.addAccount(new AccountGeneralized(address), { select: true });

// ## 5. Transfer AE
// Calling the `spend` function will create, sign and broadcast a `SpendTx` to the network using
// AccountGeneralized. It requires `authData` option.
console.log('balance before', await aeSdk.getBalance(address));
const authData = { sourceCode, args: [true, 42] };
const recipient = 'ak_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E';
await aeSdk.spend(1e18, recipient, { authData });
console.log('balance after', await aeSdk.getBalance(address));

// Note arguments of authorize entrypoint have to be unique, otherwise the transaction
// would be rejected by the node with "Invalid tx" message. Therefore, in this example a
// transaction with the same authorize arguments can't be submitted more than once. As a workaround
// "authorize" entrypoint accepts a number that acts as a nonce.
//
// You may need to put a signed hash of a transaction to `authData`, for this purpose you need to
// pass a callback in `authData`. Use `buildAuthTxHash` method to get a hash equal to
// `Auth.tx_hash` in an authorize entrypoint.

await aeSdk.spend(2e18, recipient, {
  async authData(transaction) {
    const fee = 10n ** 14n;
    const gasPrice = MIN_GAS_PRICE;
    const authTxHash = await aeSdk.buildAuthTxHash(transaction, { fee, gasPrice });
    console.log('Auth.tx_hash', authTxHash.toString('hex'));
    authData.args[1] += 1;
    Object.assign(authData, { fee, gasPrice });
    return authData;
  },
});
console.log('balance after 2nd spend', await aeSdk.getBalance(address));
