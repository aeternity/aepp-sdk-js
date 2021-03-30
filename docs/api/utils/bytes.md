<a id="module_@aeternity/aepp-sdk/es/utils/bytes"></a>

### @aeternity/aepp-sdk/es/utils/bytes
Bytes module

**Example**  
```js
import * as Crypto from '@aeternity/aepp-sdk/es/utils/bytes'
```

* [@aeternity/aepp-sdk/es/utils/bytes](#module_@aeternity/aepp-sdk/es/utils/bytes)
    * [.leftPad(length, inputBuffer)](#module_@aeternity/aepp-sdk/es/utils/bytes.leftPad) ⇒
    * [.rightPad(length, inputBuffer)](#module_@aeternity/aepp-sdk/es/utils/bytes.rightPad) ⇒
    * [.bigNumberToByteArray(x)](#module_@aeternity/aepp-sdk/es/utils/bytes.bigNumberToByteArray) ⇒
    * [.str2buf(str, [enc])](#module_@aeternity/aepp-sdk/es/utils/bytes.str2buf) ⇒ `buffer`

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.leftPad"></a>

#### @aeternity/aepp-sdk/es/utils/bytes.leftPad(length, inputBuffer) ⇒
Left pad the input data with 0 bytes

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: the padded data  

| Param | Description |
| --- | --- |
| length | to pad to |
| inputBuffer | data to pad |

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.rightPad"></a>

#### @aeternity/aepp-sdk/es/utils/bytes.rightPad(length, inputBuffer) ⇒
Right pad the input data with 0 bytes

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: the padded data  

| Param | Description |
| --- | --- |
| length | to pad to |
| inputBuffer | data to pad |

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.bigNumberToByteArray"></a>

#### @aeternity/aepp-sdk/es/utils/bytes.bigNumberToByteArray(x) ⇒
Convert bignumber to byte array

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: Buffer  

| Param | Description |
| --- | --- |
| x | bignumber instance |

<a id="module_@aeternity/aepp-sdk/es/utils/bytes.str2buf"></a>

#### @aeternity/aepp-sdk/es/utils/bytes.str2buf(str, [enc]) ⇒ `buffer`
Convert a string to a Buffer.  If encoding is not specified, hex-encoding
will be used if the input is valid hex.  If the input is valid base64 but
not valid hex, base64 will be used.  Otherwise, utf8 will be used.

**Kind**: static method of [`@aeternity/aepp-sdk/es/utils/bytes`](#module_@aeternity/aepp-sdk/es/utils/bytes)  
**Returns**: `buffer` - Buffer (bytearray) containing the input data.  

| Param | Type | Description |
| --- | --- | --- |
| str | `string` | String to be converted. |
| [enc] | `string` | Encoding of the input string (optional). |

