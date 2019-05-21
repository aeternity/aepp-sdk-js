<a id="module_@aeternity/aepp-sdk/es/utils/bytes"></a>

## @aeternity/aepp-sdk/es/utils/bytes
Bytes module

**Example**  
```js
import * as Crypto from '@aeternity/aepp-sdk/es/utils/bytes'
```

* [@aeternity/aepp-sdk/es/utils/bytes](#module_@aeternity/aepp-sdk/es/utils/bytes)
    * [.leftPad(length, inputBuffer)](#module_@aeternity/aepp-sdk/es/utils/bytes.leftPad) ⇒
    * [.rightPad(length, inputBuffer)](#module_@aeternity/aepp-sdk/es/utils/bytes.rightPad) ⇒
    * [.bigNumberToByteArray(x)](#module_@aeternity/aepp-sdk/es/utils/bytes.bigNumberToByteArray) ⇒

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.leftPad"></a>

### @aeternity/aepp-sdk/es/utils/bytes.leftPad(length, inputBuffer) ⇒
Left pad the input data with 0 bytes

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: the padded data  

| Param | Description |
| --- | --- |
| length | to pad to |
| inputBuffer | data to pad |

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.rightPad"></a>

### @aeternity/aepp-sdk/es/utils/bytes.rightPad(length, inputBuffer) ⇒
Right pad the input data with 0 bytes

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: the padded data  

| Param | Description |
| --- | --- |
| length | to pad to |
| inputBuffer | data to pad |

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.bigNumberToByteArray"></a>

### @aeternity/aepp-sdk/es/utils/bytes.bigNumberToByteArray(x) ⇒
Convert bignumber to byte array

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: Buffer  

| Param | Description |
| --- | --- |
| x | bignumber instance |

