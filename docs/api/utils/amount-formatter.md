<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter"></a>

## @aeternity/aepp-sdk/es/utils/amount-formatter
Amount Formatter

**Example**  
```js
import { format, toAettos, AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk/es/utils/amount-formatter'
```

* [@aeternity/aepp-sdk/es/utils/amount-formatter](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)
    * [.AE_AMOUNT_FORMATS](#module_@aeternity/aepp-sdk/es/utils/amount-formatter.AE_AMOUNT_FORMATS)
    * [.DENOMINATION_MAGNITUDE](#module_@aeternity/aepp-sdk/es/utils/amount-formatter.DENOMINATION_MAGNITUDE)
    * [.toAe](#module_@aeternity/aepp-sdk/es/utils/amount-formatter.toAe) ⇒ `String`
    * [.toAettos](#module_@aeternity/aepp-sdk/es/utils/amount-formatter.toAettos) ⇒ `String`
    * [.formatAmount](#module_@aeternity/aepp-sdk/es/utils/amount-formatter.formatAmount) ⇒ `String`

<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.AE_AMOUNT_FORMATS"></a>

### @aeternity/aepp-sdk/es/utils/amount-formatter.AE\_AMOUNT\_FORMATS
AE amount formats

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  
<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.DENOMINATION_MAGNITUDE"></a>

### @aeternity/aepp-sdk/es/utils/amount-formatter.DENOMINATION\_MAGNITUDE
DENOMINATION_MAGNITUDE

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  
<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.toAe"></a>

### @aeternity/aepp-sdk/es/utils/amount-formatter.toAe ⇒ `String`
Convert amount to AE

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | `String` \| `Number` \| `BigNumber` |  | amount to convert |
| [options] | `Object` | <code>{}</code> | options |
| [options.denomination] | `String` | <code>&#x27;aettos&#x27;</code> | denomination of amount, can be ['ae', 'aettos'] |

<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.toAettos"></a>

### @aeternity/aepp-sdk/es/utils/amount-formatter.toAettos ⇒ `String`
Convert amount to aettos

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | `String` \| `Number` \| `BigNumber` |  | amount to convert |
| [options] | `Object` | <code>{}</code> | options |
| [options.denomination] | `String` | <code>&#x27;ae&#x27;</code> | denomination of amount, can be ['ae', 'aettos'] |

<a id="module_@aeternity/aepp-sdk/es/utils/amount-formatter.formatAmount"></a>

### @aeternity/aepp-sdk/es/utils/amount-formatter.formatAmount ⇒ `String`
Convert amount from one to other denomination

**Kind**: static constant of [`@aeternity/aepp-sdk/es/utils/amount-formatter`](#module_@aeternity/aepp-sdk/es/utils/amount-formatter)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | `String` \| `Number` \| `BigNumber` |  | amount to convert |
| [options] | `Object` | <code>{}</code> | options |
| [options.denomination] | `String` | <code>&#x27;aettos&#x27;</code> | denomination of amount, can be ['ae', 'aettos'] |
| [options.targetDenomination] | `String` | <code>&#x27;aettos&#x27;</code> | target denomination, can be ['ae', 'aettos'] |

