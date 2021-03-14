## oracle
 
<a id="module_@aeternity/aepp-sdk/es/oracle"></a>

### oracle
**Module Path:** @aeternity/aepp-sdk/es/oracle 

Oracle Base module

**Example**  
```js
import ContractBase from '@aeternity/aepp-sdk/es/oracle'
```


<a id="exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase"></a>

#### OracleBase

**Type Sig:** OracleBase([options]) ⇒ `Object` 

Basic Oracle Stamp

This stamp include api call's related to oracle functionality.
Attempting to create instances from the Stamp without overwriting all
abstract methods using composition will result in an exception.

**Kind**: Exported function  
**Returns**: `Object` - Oracle instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |

<a id="module_@aeternity/aepp-sdk/es/oracle--OracleBase+getOracle"></a>

##### getOracle
**Type Sig:** oracleBase.getOracle(oracleId) ⇒ `Object`
Get oracle by oracle public key

**Kind**: instance abstract method of [`OracleBase`](#exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase)  
**Returns**: `Object` - - Oracle object  
**Category**: async  
**rtype**: `(oracleId: String) => oracle: Promise[Object]`

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |

<a id="module_@aeternity/aepp-sdk/es/oracle--OracleBase+getOracleQueries"></a>

##### getOracleQueries
**Type Sig:** oracleBase.getOracleQueries(oracleId-) ⇒ `Object`
Get oracle queries

**Kind**: instance abstract method of [`OracleBase`](#exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase)  
**Returns**: `Object` - - Oracle queries  
**Category**: async  
**rtype**: `(oracleId: String) => oracleQueries: Promise[Object]`

| Param | Type | Description |
| --- | --- | --- |
| oracleId- | `String` | Oracle public key |

<a id="module_@aeternity/aepp-sdk/es/oracle--OracleBase+getOracleQuery"></a>

##### getOracleQuery
**Type Sig:** oracleBase.getOracleQuery(oracleId, queryId) ⇒ `Object`
Get oracle query

**Kind**: instance abstract method of [`OracleBase`](#exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase)  
**Returns**: `Object` - - Oracle query object  
**Category**: async  
**rtype**: `(oracleId: String, queryId: String) => oracleQuery: Promise[Object]`

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |
| queryId | `String` | Query id |

,
<a id="module_@aeternity/aepp-sdk/es/oracle/node"></a>

### oracle/node
**Module Path:** @aeternity/aepp-sdk/es/oracle/node 

OracleNodeAPI module

This is the complement to [@aeternity/aepp-sdk/es/oracle](#module_@aeternity/aepp-sdk/es/oracle).

**Example**  
```js
import OracleNodeAPI from '@aeternity/aepp-sdk/es/oracle/node'
```
,
