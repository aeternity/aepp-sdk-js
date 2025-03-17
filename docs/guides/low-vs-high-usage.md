# Low vs High level API

## Interactions

`AeSdk` is a general, high-level interface that wraps multiple low-level interfaces. A general interface is preferred for its simplicity and resilience to breaking changes.

But there is also low-level interfaces. It's excellent for additional control, and as a teaching tool to understand the underlying operations. Most real-world requirements involves a series of low-level operations, so the SDK provides abstractions for these.

### Node API

The aeternity node exposes [a REST API]. This API is described in the [OpenAPI document]. SDK uses this document to generate a TypeScript client. The result client (implemented in [`Node` class]) a basically a mapping of all node endpoints as functions.

[a REST API]: https://api-docs.aeternity.io/
[OpenAPI document]: https://mainnet.aeternity.io/api?oas3
[`Node` class]: https://sdk.aeternity.io/v14.0.0/api/classes/Node.html

So to get a transaction based on its hash you would invoke `node.getTransactionByHash('th_fWEsg152BNYcrqA9jDh9VVpacYojCUb1yu45zUnqhmQ3dAAC6')`. In this way the SDK is simply a mapping of the raw API calls into JavaScript.

### Transaction builder

Any blockchain state change requires signing a transaction. Transaction should be built according to the [protocol]. SDK implements it in [`buildTx`], [`buildTxAsync`], and [`unpackTx`]. [`buildTxAsync`] requires fewer arguments than [`buildTx`], but it expects the node instance provided in arguments.

[protocol]: https://github.com/aeternity/protocol/blob/c007deeac4a01e401238412801ac7084ac72d60e/serializations.md#accounts-version-1-basic-accounts
[`buildTx`]: https://sdk.aeternity.io/v14.0.0/api/functions/buildTx.html
[`buildTxAsync`]: https://sdk.aeternity.io/v14.0.0/api/functions/buildTxAsync.html
[`unpackTx`]: https://sdk.aeternity.io/v14.0.0/api/functions/unpackTx.html

## High-level SDK usage (preferable)

Example spend call, using æternity's SDK abstraction:

https://github.com/aeternity/aepp-sdk-js/blob/cb80689a4aa10c3f3f0f57494c825533bbe6d01e/examples/node/_api-high-level.js#L1-L18

## Low-level SDK usage

The same spend execution, but using low-level SDK functions:

https://github.com/aeternity/aepp-sdk-js/blob/cb80689a4aa10c3f3f0f57494c825533bbe6d01e/examples/node/_api-low-level.js#L1-L19
