# Oracles

## Introduction

This guide shows you how to perform all the operations that you need within the lifecycle of [oracles](https://aeternity.com/protocol/oracles) using the SDK.

## 1. Oracle: register
You register an oracle that responds with the temperature of the city that is included in the query.

To register an oracle you need to provide a `queryFormat` and a `responseFormat` to the `registerOracle` function of the SDK. In addition to the common transaction options you can provide the oracle specific options `queryFee` and `oracleTtl`, see [transaction options](../transaction-options.md#oracleregistertx).

```js
// init the SDK using the Universal Stamp
const aeSdk = await Universal({ ... })

// set TTL with a delta of 1000 blocks
const oracleTtl = {type: 'delta', value: 1000}
// OR set a specific block height to expire
const oracleTtl = { type: 'block', value: 555555 }

// queryFee is optional and defaults to 30000
// oracleTtl is optional and defaults to { type: 'delta', value: 500 }
const options = {queryFee: 1337, oracleTtl }

// the first argument is the queryFormat and the second is the responseFormat
const oracle = await aeSdk.registerOracle("{'city': string}", "{'temperature': int}", options)
```

Note:

- By default the oracle will exist for the next 500 KeyBlocks.
- If you intend to keep your oracle running longer you should increase the `oracleTtl` and/or set up a service that automatically extends the TTL before it expires.
- The `oracleId` will be similar to the address of the account that registered the Oracle.
   - The only difference is the prefix that will be `ok_` instead of `ak_`
   - This means that each account can only host 1 oracle. It's not possible to manage multiple oracles using the same account.

## 2. Some party: query an oracle and poll for response

### Query
After the oracle has been registered and as long as it isn't expired, everybody that knows the `oracleId` can query it.

```js
const oracleId = 'ok_...';

// queryFee should cover the requested fee of the oracle and defaults to 30000
// queryTtl is optional and defaults to {type: 'delta', value: 10}
// responseTtl is optional and defaults to {type: 'delta', value: 10}
const options = {queryFee: 1337, queryTtl: {type: 'delta', value: 20}, responseTtl: {type: 'delta', value: 50}}

// using the oracle object
const oracle = await aeSdk.getOracleObject(oracleId) // in case you need to instantiate the oracle object first
const query = await oracle.postQuery("{'city': 'Berlin'}", options) // using the oracle instance

// OR using the aeSdk (instance of Universal stamp) directly by providing the oracleId
const query = await aeSdk.postQueryToOracle(oracleId, "{'city': 'Berlin'}", options)
```

Note:

- Again, take a look into the [transaction options](../transaction-options.md#oraclequerytx) to see what (other) options you can provide.

### Poll for response
Now you have access to the query object and can poll for the response to that specific query:

```js
const oracleId = 'ok_...';
const queryId = 'oq_...';

// using the query instance
const query = await aeSdk.getQueryObject(oracleId, queryId) // in case you need to get the query instance first
const response = await query.pollForResponse({ attempts: 10, interval: 6000 })

// OR using the aeSdk (instance of Universal stamp) directly by providing the oracleId
const response = await aeSdk.pollForQueryResponse(oracleId, queryId, { attempts: 10, interval: 6000 })

// decode the oracle response
// the decode function returns a buffer that needs to be converted to a string
const decodedResponse = String(response.decode());
console.log(decodedResponse)
```

## 3. Oracle: poll for queries and respond

### Poll for queries
Typically the oracle itself polls for its own queries and responds as soon as possible:

```js
const stopPolling = await oracle.pollQueries((queries) => {
   console.log(queries) // log all new queries
}, { interval: 1000 }) // polling interval in milliseconds

stopPolling() // stop polling
```

Note:

- Probably the oracle would respond here directly (see below) instead of just logging the queries.

### Respond to query
If the oracle recognizes that it has been queried it can respond to the query as long as the query's TTL
has not been expired.

```js
const oracleId = 'ok_...';
const queryId = 'oq_...';
const options = { onAccount: 'ak_...' } // only the account of the oracle can respond to the query

// using the query instance
const query = await aeSdk.getQueryObject(oracleId, queryId)
await query.respond('{ "temperature": 27.5 }', options)

// OR using the aeSdk (instance of Universal stamp) directly by providing the oracleId and the queryId
await aeSdk.respondToQuery(oracleId, queryId, '{ "temperature": 27.5 }', options)
```

Note:

- Of course the oracle itself would either use an API to get the current temperature for a certain city or ideally directly communicate with measuring devices located in that specific city.
- If the Universal Stamp is initialized with the oracle's account there is no need to pass the `onAccount` option as this is done implicitely.

## 4. Oracle: extend
As mentioned above an Oracle has a certain TTL that can be specified when registering it. You might want to extend the TTL of the oracle before it expires. You can do that as follows:

```js
const oracleId = 'ok_...';

// extend TTL by additional 500 blocks (based on current expiration height of the oracle)
const oracleTtl = { type: 'delta', value: 500 }

// using the oracle instance
const oracle = await aeSdk.getOracleObject(oracleId)
const extendedOracle = await oracle.extendOracle(oracleTtl)

// OR using the aeSdk (instance of Universal stamp) directly by providing the oracleId
const extendedOracle = await aeSdk.extendOracleTtl(oracleId, oracleTtl)
```

## Example applications

- [ae-oracle-pricefeed](https://github.com/aeternity/ae-oracle-pricefeed)
      - NodeJS example that registers an oracle, extends it if required and responds to queries automatically.