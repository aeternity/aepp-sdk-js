<a id="module_@aeternity/aepp-sdk/es/ae/oracle"></a>

## @aeternity/aepp-sdk/es/ae/oracle
Oracle module - routines to interact with the æternity oracle system

The high-level description of the oracle system is
https://github.com/aeternity/protocol/blob/master/ORACLE.md in the protocol
repository.

**Export**: Oracle  
**Example**  
```js
import Oracle from '@aeternity/aepp-sdk/es/ae/oracle'
```

* [@aeternity/aepp-sdk/es/ae/oracle](#module_@aeternity/aepp-sdk/es/ae/oracle)
    * [Oracle([options])](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--Oracle) ⇒ `Object` ⏏
    * _instance_
        * _async_
            * [.getOracleObject(oracleId)](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--getOracleObject) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.exports.pollForQueries(oracleId, onQuery, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--exports.pollForQueries) ⇒ `function` ⏏
            * [.getQueryObject(oracleId, queryId)](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--getQueryObject) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.exports.pollForQueryResponse(oracleId, queryId, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--exports.pollForQueryResponse) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.registerOracle(queryFormat, responseFormat, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--registerOracle) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.postQueryToOracle(oracleId, query, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--postQueryToOracle) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.extendOracleTtl(oracleId, oracleTtl, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--extendOracleTtl) ⇒ `Promise.&lt;Object&gt;` ⏏
            * [.respondToQuery(oracleId, queryId, response, [options])](#exp_module_@aeternity/aepp-sdk/es/ae/oracle--respondToQuery) ⇒ `Promise.&lt;Object&gt;` ⏏

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--Oracle"></a>

### Oracle([options]) ⇒ `Object` ⏏
Oracle Stamp

Oracle provides oracle-system related methods atop
[Ae](#exp_module_@aeternity/aepp-sdk/es/ae--Ae) clients.

**Kind**: Exported function  
**Returns**: `Object` - Oracle instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--getOracleObject"></a>

### .getOracleObject(oracleId) ⇒ `Promise.&lt;Object&gt;` ⏏
Constructor for Oracle Object (helper object for using Oracle)

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Oracle object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |

### .pollForQueries(oracleId, onQuery, [options]) ⇒ `function` ⏏
Poll for oracle queries

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `function` - stopPolling - Stop polling function  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |
| onQuery | `function` | OnQuery callback |
| [options] | `Object` | Options object |
| [options.interval] | `Object` | Poll interval(default: 5000) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--getQueryObject"></a>

### .getQueryObject(oracleId, queryId) ⇒ `Promise.&lt;Object&gt;` ⏏
Constructor for OracleQuery Object (helper object for using OracleQuery)

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - OracleQuery object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |
| queryId | `String` | Oracle Query id |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--exports.pollForQueryResponse"></a>

### .exports.pollForQueryResponse(oracleId, queryId, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Poll for oracle query response

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - OracleQuery object  
**Category**: async  

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |
| queryId | `String` | Oracle Query id |
| [options] | `Object` | Options object |
| [options.attempts] | `Object` | Poll attempt's(default: 20) |
| [options.interval] | `Object` | Poll interval(default: 5000) |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--registerOracle"></a>

### .registerOracle(queryFormat, responseFormat, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Register oracle

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Oracle object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| queryFormat | `String` |  | Format of query |
| responseFormat | `String` |  | Format of query response |
| [options] | `Object` | <code>{}</code> | Options |
| [options.queryFee] | `String` \| `Number` |  | queryFee Oracle query Fee |
| [options.oracleTtl] | `Object` |  | oracleTtl OracleTtl object {type: 'delta|block', value: 'number'} |
| [options.abiVersion] | `Number` |  | abiVersion Always 0 (do not use virtual machine) |
| [options.fee] | `Number` |  | fee Transaction fee |
| [options.ttl] | `Number` |  | Transaction time to leave |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--postQueryToOracle"></a>

### .postQueryToOracle(oracleId, query, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Post query to oracle

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Query object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| oracleId | `String` |  | Oracle public key |
| query | `String` |  | Oracle query object |
| [options] | `Object` | <code>{}</code> |  |
| [options.queryTtl] | `String` \| `Number` |  | queryTtl Oracle query time to leave |
| [options.responseTtl] | `String` \| `Number` |  | queryFee Oracle query response time to leave |
| [options.queryFee] | `String` \| `Number` |  | queryFee Oracle query fee |
| [options.fee] | `Number` |  | fee Transaction fee |
| [options.ttl] | `Number` |  | Transaction time to leave |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--extendOracleTtl"></a>

### .extendOracleTtl(oracleId, oracleTtl, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Extend oracle ttl

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Oracle object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| oracleId | `String` |  | Oracle public key |
| oracleTtl | `String` |  | Oracle time to leave for extend |
| [options] | `Object` | <code>{}</code> |  |
| [options.fee] | `Number` |  | fee Transaction fee |
| [options.ttl] | `Number` |  | Transaction time to leave |

<a id="exp_module_@aeternity/aepp-sdk/es/ae/oracle--respondToQuery"></a>

### .respondToQuery(oracleId, queryId, response, [options]) ⇒ `Promise.&lt;Object&gt;` ⏏
Extend oracle ttl

**Kind**: instance method of [`@aeternity/aepp-sdk/es/ae/oracle`](#module_@aeternity/aepp-sdk/es/ae/oracle)  
**Returns**: `Promise.&lt;Object&gt;` - Oracle object  
**Category**: async  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| oracleId | `String` |  | Oracle public key |
| queryId | `String` |  | Oracle query id |
| response | `String` |  | Oracle query response |
| [options] | `Object` | <code>{}</code> |  |
| [options.responseTtl] | `Number` |  | responseTtl Query response time to leave |
| [options.fee] | `Number` |  | Transaction fee |
| [options.ttl] | `Number` |  | Transaction time to leave |

