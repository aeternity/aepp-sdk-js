# PayingForTx (Meta-Transactions)

## Introduction

This guide explains you how to perform a `PayingForTx` (also known as meta-transaction) using the SDK.

It is a very powerful and efficient solution that is crucial for onboarding new users into you ecosystem. By making use of the `PayingForTx` you will be able to cover the fees of your users.

## How it works

Typically somebody that you want to pay the transaction for (e.g. a new user of your decentralized aepp) signs the **inner transaction** (e.g. of type `ContractCallTx`) with a **specific signature** that is used for inner transactions.

You can then collect the signed inner transaction, wrap it into a `PayingForTx` and broadcast it to the network.

## Usage examples

We provided following two NodeJS examples which you can take a look at:

- [InnerTx: ContractCallTx](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/examples/node/paying-for-contract-call-tx/)
- [InnerTx: SpendTx](https://docs.aeternity.com/aepp-sdk-js/v13.2.2/examples/node/paying-for-spend-tx/)

Note:

- A `PayingForTx` can wrap **any kind** of other [transaction type](https://docs.aeternity.com/protocol/consensus/index.html#transactions_1) supported by the protocol as inner transaction.

## UseCases

- Game developers that want to quickly onboard new users.
- Governance aepps that want people to vote on important proposals without having them to pay anything.
- Custodians that want to offer an additional services to cover the transaction fees of their clients.
- ... many more!
