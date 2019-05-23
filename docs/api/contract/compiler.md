<a id="module_@aeternity/aepp-sdk/es/contract/compiler"></a>

## @aeternity/aepp-sdk/es/contract/compiler
ContractCompilerAPI module

This is the complement to [@aeternity/aepp-sdk/es/contract](#module_@aeternity/aepp-sdk/es/contract).

**Example**  
```js
import ContractCompilerAPI from '@aeternity/aepp-sdk/es/contract/compiler'
```
<a id="exp_module_@aeternity/aepp-sdk/es/contract/compiler--ContractCompilerAPI"></a>

### ContractCompilerAPI([options]) ⇒ `Object` ⏏
Contract Compiler Stamp

This stamp include api call's related to contract compiler functionality.

**Kind**: Exported function  
**Returns**: `Object` - Contract compiler instance  
**rtype**: `Stamp`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | `Object` | <code>{}</code> | Initializer object |
| [options.compilerUrl] | `String` |  | compilerUrl - Url for compiler API |

**Example**  
```js
ContractCompilerAPI({ compilerUrl: 'COMPILER_URL' })
```
