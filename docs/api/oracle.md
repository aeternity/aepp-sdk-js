<a id="module_@aeternity/aepp-sdk/es/oracle"></a>

## @aeternity/aepp-sdk/es/oracle
Oracle Base module

**Example**  
```js
import ContractBase from '@aeternity/aepp-sdk/es/oracle'
```

* [@aeternity/aepp-sdk/es/oracle](#module_@aeternity/aepp-sdk/es/oracle)
    * [OracleBase([options])](#exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase) ⇒ `Object` ⏏
        * *[.getOracle(oracleId)](#module_@aeternity/aepp-sdk/es/oracle--OracleBase+getOracle) ⇒ `Object`*
        * *[.getOracleQueries(oracleId-)](#module_@aeternity/aepp-sdk/es/oracle--OracleBase+getOracleQueries) ⇒ `Object`*
        * *[.getOracleQuery(oracleId, queryId)](#module_@aeternity/aepp-sdk/es/oracle--OracleBase+getOracleQuery) ⇒ `Object`*

<a id="exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase"></a>

### OracleBase([options]) ⇒ `Object` ⏏
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

#### *oracleBase.getOracle(oracleId) ⇒ `Object`*
Get oracle by oracle public key

**Kind**: instance abstract method of [`OracleBase`](#exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase)  
**Returns**: `Object` - - Oracle object  
**Category**: async  
**rtype**: `(oracleId: String) => oracle: Promise[Object]`

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |

<a id="module_@aeternity/aepp-sdk/es/oracle--OracleBase+getOracleQueries"></a>

#### *oracleBase.getOracleQueries(oracleId-) ⇒ `Object`*
Get oracle queries

**Kind**: instance abstract method of [`OracleBase`](#exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase)  
**Returns**: `Object` - - Oracle queries  
**Category**: async  
**rtype**: `(oracleId: String) => oracleQueries: Promise[Object]`

| Param | Type | Description |
| --- | --- | --- |
| oracleId- | `String` | Oracle public key |

<a id="module_@aeternity/aepp-sdk/es/oracle--OracleBase+getOracleQuery"></a>

#### *oracleBase.getOracleQuery(oracleId, queryId) ⇒ `Object`*
Get oracle query

**Kind**: instance abstract method of [`OracleBase`](#exp_module_@aeternity/aepp-sdk/es/oracle--OracleBase)  
**Returns**: `Object` - - Oracle query object  
**Category**: async  
**rtype**: `(oracleId: String, queryId: String) => oracleQuery: Promise[Object]`

| Param | Type | Description |
| --- | --- | --- |
| oracleId | `String` | Oracle public key |
| queryId | `String` | Query id |

