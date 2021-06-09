<a id="module_@aeternity/aepp-sdk/es/utils/swagger"></a>

### @aeternity/aepp-sdk/es/utils/swagger
Generator of Swagger client module

<a id="exp_module_@aeternity/aepp-sdk/es/utils/swagger--module.exports"></a>

#### module.exports(specUrl, options) ⇒ `Object` ⏏
Generator of Swagger client

**Kind**: Exported function  
**Returns**: `Object` - Swagger client  
**rtype**: `Object`

| Param | Type | Description |
| --- | --- | --- |
| specUrl | `String` | Swagger specification URL on external node host |
| options | `Object` |  |
| [options.spec] | `String` | Override OpenAPI definition |
| [options.internalUrl] | `String` | Node internal URL |
| [options.disableBigNumbers] | `Boolean` |  |
| [options.disableCaseConversion] | `Boolean` |  |

**Example**  
```js
(await genSwaggerClient('https://mainnet.aeternity.io/api')).getAccountByPubkey('ak_jupBUgZNbcC4krDLR3tAkw1iBZoBbkNeShAq4atBtpFWmz36r')
```
