# Making a sequence of requests in efficient way

## Introduction
In some cases, aepp developer may need to send a set of transactions at once. SDK has some optimizations for this but it also requires additional effort by developer. Here we will consider specific cases with suggestions on how to proceed with them.

## Multiple spend transactions
Obviously, multiple spends may be done like
```js
for (const { address, amount } of spends) {
  await sdk.spend(amount, address)
}
```
But this isn't the fastest approach, because on each iteration SDK would:
- request the sender data (its type and nonce)
- verify the transaction (including additional requests)
- wait until the transaction is mined

It can be avoided by making spends as:
```js
const base = (await sdk.api.getAccountNextNonce(await sdk.address())).nextNonce
await Promise.all(spends.map(({ amount, address }, idx) =>
   sdk.spend(amount, address, { nonce: base + idx, verify: false, waitMined: false }))
)
```
This way, SDK would make a single request to get info about the sender account and a transaction post request per each item in the `spends` array.

## Multiple contract static calls
Basically, the dry-run endpoint of the node is used to run them. Doing requests one by one, like
```js
const results = []
for (const d of data) {
  results.push(await contract.methods.foo(d))
}
```
will make SDK create a new dry-run request for each static call. It may be not efficient because dry-run supports executing multiple transactions at a single request. It can be done by making all calls at once:
```js
const base = (await sdk.api.getAccountNextNonce(await sdk.address())).nextNonce
const results = await Promise.all(
  data.map((d, idx) => contract.methods.foo(d, { nonce: base + idx }))
)
```
SDK will detect it and put all of them into a single dry-run request. Also, good to manage nonces on the aepp side to avoid extra requests to the node.

This approach has a limitation: by default, dry-run is limited by 6000000 gas. This is enough to execute only 32 plain contract calls. it can be avoided by:
- increasing the default gas limit of restricted dry-run endpoint in node configuration
- decreasing the gas limit of each static call
- using a debug dry-run instead of restricted one
