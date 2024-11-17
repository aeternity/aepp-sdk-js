# Batch Transactions

## Introduction

In some cases, aepp developer may need to send a set of transactions at once. The SDK provides optimizations for this scenario but it also requires additional effort by the developer. This guide covers specific cases with suggestions on how to proceed with them to produce a sequence of requests in an efficient way.

## Multiple spend transactions

Obviously, multiple spends may be done like:

```js
for (const { address, amount } of spends) {
  await aeSdk.spend(amount, address);
}
```

But this isn't the fastest approach, because on each iteration SDK would:

- request the sender data (its type and nonce)
- verify the transaction (including additional requests)
- wait until the transaction is mined

It can be avoided by making spends as:

```js
const base = (await aeSdk.api.getAccountNextNonce(aeSdk.address)).nextNonce;
await Promise.all(
  spends.map(({ amount, address }, idx) =>
    aeSdk.spend(amount, address, { nonce: base + idx, verify: false, waitMined: false }),
  ),
);
```

This way, SDK would make a single request to get info about the sender account and a transaction post request per each item in the `spends` array.

Additionally, you may want to set `gasPrice` and `fee` to have predictable expenses. By default, SDK sets them based on the current network demand.

## Multiple spends via contract call

If you need to transfer a fixed AE amount from the same account to more than 24 accounts, it is more efficient to do it via a smart contract.

Let's define and deploy a contract

```
include "List.aes"

contract MultipleSpends =
  payable stateful entrypoint spend(addresses : list(address), amount: int) =
    List.foreach(addresses, (address) => Chain.spend(address, amount))
```

after deployment this contract, it can be called as follows

```js
await contract.spend(addresses, amount, { amount: amount * addresses.length });
```

Pros of this approach:

- less fees if more than 24 recipients;
- faster to execute because it needs to mine fewer transactions.

Cons:

- the amount of recipients in one transaction limited by the maximum gas in a block (about 800 recipients);
- harder to implement.

### Fees difference

One spend tx takes approximately 0.0000167ae. The above contract deployment is 0.0000815ae. The base contract call price is 0.000182ae. Adding an address to the list costs about 0.0000058ae. So, it is more efficient to use a contract if you have more than 24 recipients. And more than 17 recipients if you use a pre-deployed contract.

| Recipients | Fee savings for batch spending via contract |
| ---------- | ------------------------------------------- |
| 1 000      | 0.0107ae                                    |
| 100 000    | 1.07ae                                      |
| 10 000 000 | 107ae                                       |

## Multiple contract static calls

Basically, the dry-run endpoint of the node is used to run them. Doing requests one by one, like

```js
const results = [];
for (const d of data) {
  results.push(await contract.foo(d));
}
```

will make SDK create a new dry-run request for each static call. It may be not efficient because dry-run supports executing multiple transactions at a single request. It can be done by making all calls at once:

```js
const base = (await aeSdk.api.getAccountNextNonce(aeSdk.address)).nextNonce;
const results = await Promise.all(
  data.map((d, idx) => contract.foo(d, { nonce: base + idx, combine: true })),
);
```

With `combine` flag SDK would put all of them into a single dry-run request. Also, it is necessary to generate increasing nonces on the aepp side to avoid nonce-already-used errors.

This approach has another limitation: by default, dry-run is limited by 6000000 gas. This is enough to execute only 32 plain contract calls. it can be avoided by:

- increasing the default gas limit of restricted dry-run endpoint in node configuration
- decreasing the gas limit of each static call
- using a debug dry-run endpoint instead of the restricted one
