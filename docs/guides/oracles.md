# Oracles

## Introduction

This guide shows you how to perform all the operations that you need within the lifecycle of [oracles](https://docs.aeternity.com/protocol/oracles) using the SDK.

## 1. Oracle: register
Let's register an oracle that responds with the temperature of the city that is included in the query.

Firstly, you need to create an instance of `Oracle` class. This class requires an account that would be used to sign operations on behalf of the oracle. So one account can host only one oracle, and this oracle address would be the same as the corresponding account address except for a different prefix (`ok_` instead of `ak_`). This means that it's not possible to manage multiple oracles using the same account.

```js
import { AeSdk, Oracle } from '@aeternity/aepp-sdk'

// init an instance of the SDK using the AeSdk class
const aeSdk = new AeSdk({ ... })
// it should be an instance of AccountBase with non-zero balance
const oracleAccount = new MemoryAccount(...)

const oracle = new Oracle(oracleAccount, aeSdk.getContext())
```

To register an oracle on-chain you need to provide a `queryFormat` and a `responseFormat` to the `register` function of `Oracle` class. In addition to the common transaction options you can provide the oracle specific options `queryFee` and `oracleTtlValue`, see [transaction options](../transaction-options.md#oracleregistertx).

```js
// set TTL with a delta of 1000 blocks
const oracleTtlOptions = { oracleTtlType: ORACLE_TTL_TYPES.delta, oracleTtlValue: 1000 }
// OR set a specific block height to expire
const oracleTtlOptions = { oracleTtlType: ORACLE_TTL_TYPES.block, oracleTtlValue: 555555 }

// queryFee is optional and defaults to 0
// oracleTtlValue is optional and defaults to 500
// oracleTtlType is optional and defaults to ORACLE_TTL_TYPES.delta
const options = { queryFee: 1337, ...oracleTtlOptions }

// the first argument is the queryFormat and the second is the responseFormat
await oracle.register('{"city": "str"}', '{"temperature": "int"}', options)
```

Note:

- By default the oracle will exist for the next 500 key blocks.
- If you intend to keep your oracle running longer you should increase the `oracleTtlValue` and/or set up a service that automatically extends the TTL before it expires.

## 2. Some party: query an oracle and poll for response

### Query (preferred)
After the oracle has been registered and as long as it isn't expired, everybody that knows the `oracleId` can query it.

```js
import { OracleClient } from '@aeternity/aepp-sdk'

const oracleId = 'ok_...';
const options = {
  queryFee: 1337, // should cover the requested fee of the oracle and defaults to 0
  queryTtlType: ORACLE_TTL_TYPES.delta, // optional and defaults to ORACLE_TTL_TYPES.delta
  queryTtlValue: 20, // optional and defaults to 10
  responseTtlType: ORACLE_TTL_TYPES.delta, // optional and defaults to ORACLE_TTL_TYPES.delta
  responseTtlValue: 50, // optional and defaults to 10
  interval: 6000, // response polling interval
};

// to query an oracle you need to instantiate the OracleClient object first
const oracleClient = new OracleClient(oracleId, aeSdk.getContext())
const response = await oracleClient.query('{"city": "Berlin"}', options)
console.log('Decoded oracle response', response)
```

Note:

- Again, take a look into the [transaction options](../transaction-options.md#oraclequerytx) to see what (other) options you can provide.

Alternatively, you can post query and poll for response using separate methods from below.

### Post query (alternative)
To post a query without waiting for a response do the below.

```js
const { queryId } = await oracleClient.postQuery('{"city": "Berlin"}') // oq_...

console.log('Oracle query ID', queryId)
```

### Poll for response (alternative)
Now you have query ID that can be used to poll for the response:

```js
const response = await oracleClient.pollForResponse(queryId)

console.log('Decoded oracle response', response)
```

## 3. Oracle: poll for queries and respond

### Handle queries (preferred)

Typically, the oracle itself polls for its own queries and responds as soon as possible:

```js
const stopHandling = await oracle.handleQueries((query) => {
  if (query.decodedQuery === '{"city": "Berlin"}') {
    return '{"temperature": 27.5}';
  }
  return '{"error": "Unknown request"}';
}, { interval: 1000 }) // polling interval in milliseconds

stopHandling() // stop polling
```

This way, the oracle would respond with the temperature in a requested city. It needs to be done before the query's TTL expires.

Note:
- Of course, the oracle itself would either use an API to get the current temperature for a certain city or ideally directly communicate with measuring devices located in that specific city.
- As far as Oracle class is bound to a specific account provided while creation, it is not necessary to pass the `onAccount` option.

The above is the simplest way to respond to queries, though you can manually subscribe for new queries and respond to them.

### Poll for queries (alternative)
To subscribe to new queries without responding to them:

```js
const stopPolling = await oracle.pollQueries((query) => {
  console.log(query) // log a new query
}, { interval: 1000 }) // polling interval in milliseconds

stopPolling() // stop polling
```

### Respond to query (alternative)
If the oracle recognizes that it has been queried it can respond to the query.

```js
const oracleId = 'ok_...';
const queryId = 'oq_...';
const options = { onAccount: 'ak_...' } // only the account of the oracle can respond to the query

await oracle.respondToQuery(queryId, '{"temperature": 27.5}', options)
```

## 4. Oracle: extend
As mentioned above an Oracle has a certain TTL that can be specified when registering it. You might want to extend the TTL of the oracle before it expires. You can do that as follows:

```js
// extend TTL by additional 500 blocks (based on current expiration height of the oracle)
const options = { oracleTtlType: ORACLE_TTL_TYPES.delta, oracleTtlValue: 500 }

// using the Oracle instance
await oracle.extend(options)
```

## 5. Get the current state from the node

Both Oracle and OracleClient have methods to get their state from the node.

`Oracle:getNodeState`, `OracleClient:getNodeState` returns the same value as `Node:getOracleByPubkey`, but without arguments (it uses the oracle address provided in the constructor).

`Oracle:getQuery`, `OracleClient:getQuery` corresponds to `Node:getOracleQueryByPubkeyAndQueryId`, adding `decodedQuery`, `decodedResponse` based on the oracle type.

## Example applications

- [ae-oracle-pricefeed](https://github.com/aeternity/ae-oracle-pricefeed)
  NodeJS example that registers an oracle, extends it if required and responds to queries automatically.
- [tipping-oracle-service](https://github.com/superhero-com/tipping-oracle-service)
  application that registers an oracle to check the presence of an AE address at a specific page
