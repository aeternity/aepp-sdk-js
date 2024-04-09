# Batch Transactions

## Introduction
In some cases, aepp developer may need to send a set of transactions at once. The SDK provides optimizations for this scenario but it also requires additional effort by the developer. This guide covers specific cases with suggestions on how to proceed with them to produce a sequence of requests in an efficient way.

## Multiple spend transactions
Obviously, multiple spends may be done like:
```js
for (const { address, amount } of spends) {
  await aeSdk.spend(amount, address)
}
```
But this isn't the fastest approach, because on each iteration SDK would:

- request the sender data (its type and nonce)
- verify the transaction (including additional requests)
- wait until the transaction is mined

It can be avoided by making spends as:
```js
const base = (await aeSdk.api.getAccountNextNonce(aeSdk.address)).nextNonce
await Promise.all(spends.map(({ amount, address }, idx) =>
   aeSdk.spend(amount, address, { nonce: base + idx, verify: false, waitMined: false }))
)
```
This way, SDK would make a single request to get info about the sender account and a transaction post request per each item in the `spends` array.

Additionally, you may want to set `gasPrice` and `fee` to have predictable expenses. By default, SDK sets them based on the current network demand.

## Multiple contract static calls
Basically, the dry-run endpoint of the node is used to run them. Doing requests one by one, like
```js
const results = []
for (const d of data) {
  results.push(await contract.foo(d))
}
```
will make SDK create a new dry-run request for each static call. It may be not efficient because dry-run supports executing multiple transactions at a single request. It can be done by making all calls at once:
```js
const base = (await aeSdk.api.getAccountNextNonce(aeSdk.address)).nextNonce
const results = await Promise.all(
  data.map((d, idx) => contract.foo(d, { nonce: base + idx, combine: true }))
)
```
With `combine` flag SDK would put all of them into a single dry-run request. Also, it is necessary to generate increasing nonces on the aepp side to avoid nonce-already-used errors.

This approach has another limitation: by default, dry-run is limited by 6000000 gas. This is enough to execute only 32 plain contract calls. it can be avoided by:

- increasing the default gas limit of restricted dry-run endpoint in node configuration
- decreasing the gas limit of each static call
- using a debug dry-run endpoint instead of the restricted one
