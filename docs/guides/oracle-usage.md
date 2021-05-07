# Oracle Usage

This guide describes the basic operations on [Oracle](https://github.com/aeternity/protocol/blob/master/oracles/oracles.md) using [Aeternity JS SDK](https://github.com/aeternity/aepp-sdk-js)

## Main Flow

  - `Register` an `oracle` (prepare and broadcast `oracle-register`)
      ```js
      const sdkInstance = await Universal({ ... }) // Init Universal instance

      // First argument is oracle query format and second oracle query response format
      // queryFee is optional and default to 30000
      // oracleTll is optional and default to { type: 'delta', value: 500 }
      const oracle = await client.registerOracle("{'city': str}", "{'tmp': num}", { queryFee, oracleTtl })
      ```

  - Extend oracle (prepare and broadcast `oracle-extend` transaction)
      ```js
      const ttlToExtend = { type: 'delta', value: 500 }
      const oracle = await sdkInstance.getOracleObject(oracleId)

      // extend oracle ttl to 500 blocks
      const oracleEntended = await oracle.extendOracle(ttlToExtend)
      // or
      const oracleEntended = await sdkInstance.extendOracleTtl(oracleId, ttlToExtend, options)
      ```

  - Post query to oracle (prepare and broadcast `oracle-query` transaction)
    ```js
    // queryFee is optional and default to 30000
    // queryTtl is optional and default to { type: 'delta', value: 10 }
    // responseTtl is optional and default to { type: 'delta', value: 10 }
    const options = { fee, ttl, nonce, queryFee, queryTtl, responseTtl }
    // Get oracle object
    const oracle = await sdkInstance.getOracleObject(oracleId)

    const query = await oracle.postQuery("{'city': 'Berlin'}", options)
    // or
    const query = await sdkInstance.postQueryToOracle(oracleId, "{'city': 'Berlin'}", options)
    ```

  - Poll for queries
     ```js
    const stopPolling = await oracle.pollQueries(
      (queries) => {
         console.log(queries) // log all new queries
      },
     { interval: 1000 } // poll every second
    )
     ```
  - Poll for query response
       ```js
      const query = await sdkInstance.getQueryObject(oracleId, queryId)

      // Poll for query reponse
      const response = await query.pollForResponse({ attempts: 2, interval: 1000 })
      // or
      const response = await sdkInstance.pollForQueryResponse(oracleId, queryId, { attempts: 2, interval: 1000 })
      // decode query response
      console.log(query.decode())
       ```
  - Respond to query (prepare and broadcast `oracle-responde` transaction)
     ```js
     const options = { ttl, fee, nonce, onAccount }
     const query = await sdkInstance.getQueryObject(oracleId, queryId)

     await query.respond({ tmp: 10 }, options)
     // or
     await sdkInstance.respondToQuery(oracleId, queryId, { tmp: 10 }, options)
     ```

## Related links
   - [Oracle protocol](https://github.com/aeternity/protocol/blob/master/oracles)
   - [Oracle SDK API Docs](../api/ae/oracle.md)

