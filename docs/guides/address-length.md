# The range of possible address length

While base64-encoded strings have a constant length depending on the length of data to encode. In
base58 it depends on the exact data to encode, e.g. it is shorter if encoded data have more
leading zeroes.

Building an aepp you may need to know the range of possible address lengths to validate an
user-provided addresses (though better to use [isAddressValid]) or for designs of address-related
components. Doing manual tests you may conclude that account address length is between 52 and 53
chars, but it is not correct.

```js
import { MemoryAccount } from '@aeternity/aepp-sdk';

const result = new Array(10000).fill()
  .map(() => MemoryAccount.generate().address.length)
  .reduce((p, n) => ({ ...p, [n]: (p[n] ?? 0) + 1 }), {});

console.log(result);
```

Running the above code you would get something like `{ '51': 55, '52': 5021, '53': 4924 }`
depending on generated accounts. So, while the most of addresses have length between 52 and 53
chars, there is a ~0.55% chance to get an address of 51 chars.

Theoretically there can be even shorter addresses if they lucky to be prefixed with a long
sequence of `0`.

```js
import {
  MemoryAccount, Encoding, encode, decode,
} from '@aeternity/aepp-sdk';

const publicKey = decode(MemoryAccount.generate().address);

for (let i = -1; i < publicKey.length; i += 1) {
  if (i >= 0) publicKey[i] = 0;
  const address = encode(publicKey, Encoding.AccountAddress);
  console.log(address.length, address);
}
```

Running the above code you would get output like

```
52 ak_XsSLpN161dHo77k82CZHDnUCDpVG1JSujZjbGYhNKTgMy5exZ
52 ak_13P6GKgb4VcxJHrb5Vnhb66RNBGgdnFLVJS8RaLcrAeseZmuc
52 ak_115z6Ns8nevqahWHQfYU3QNJbK7PsX2rWxoPQRcpvWzB4U77s
51 ak_111dqrd5iRqVHQe2T2JdZe79bqNBVCkWPqSc1JAXMW6F2vvT
50 ak_1111PM8Acd6qZCjioCqPt6PcTuWVxxS22gt2ytCdH82FY4C
51 ak_111113q5w8zgNNjAgLbxrMmA8qBNCv8aVHBM7eLm7JbfcgVe
50 ak_111111UGVF8HYKFC7hLzwffE8JR5vQKQ9z4BiYJYCVcEGna
49 ak_1111111wnTfJ9TWagQmzk42ADoUqVg1VvNMG7t8Fo8SQGf
50 ak_11111111389cwfh57Mw1d4uYXps2orpWxc9Zoov7PdW6G7S
49 ak_111111111G6iURaQ8ycLUNERoocnfJPQ8J7bopyndikHFM
49 ak_11111111116b9WMyCB85kS4YkDfP9D3LhqUu5eG7AEfrLg
48 ak_11111111111urvTGsQm76A4yTbApC8DJ1rLggAFKXiZXp
48 ak_1111111111119eSHeN26TTHqgKpcEVTmbCHEbQgAHJkjd
48 ak_11111111111115QmcWAusFcLUq2MfYLXdxnFEhPkRrQu5
47 ak_11111111111111c7Y1hucPEYuPH6ZY5sFdKo6dhb86gk
47 ak_1111111111111116qaT3Ac44qzDFevr9Czj1S9p9Y46r
47 ak_11111111111111114KqRXnNJJwVDnphudyDt4XDmjLn7
46 ak_11111111111111111XGs41KwLTa74AMCwx3gYYAHv81
46 ak_1111111111111111114sffTSqJvTbsAjsQykvVsDcV8
45 ak_1111111111111111111wVeBwZE5g63oPLdnrQC7TuP
45 ak_11111111111111111111Y4FSQ8pV3J8f96h3SS68Df
45 ak_1111111111111111111114ZmkEyJVpPoE6bFrxSt3n
44 ak_1111111111111111111111hEHXkLzkWadzEyFn6pw
44 ak_11111111111111111111111A6y5vKi2SUtEiqyw1H
44 ak_1111111111111111111111112PszJecmUrBA1wHbx
43 ak_1111111111111111111111111yqJmD1ujq7rtGX6
43 ak_111111111111111111111111113hoVWLS2aptDtG
42 ak_111111111111111111111111111PhgEh1GA292t
42 ak_1111111111111111111111111111Z6ci7mUpU7i
42 ak_111111111111111111111111111119gETXQQAsT
42 ak_11111111111111111111111111111136u6WXDf6
41 ak_1111111111111111111111111111111PqPZYur
41 ak_11111111111111111111111111111111273Yts
```

Therefore the minimum address length is 41 chars. All these addresses valid, for example
`ak_11111111111111111111111111111111273Yts` [used] to collect AENS name fees.

[isAddressValid]: https://docs.aeternity.com/aepp-sdk-js/v13.0.1/api/functions/isAddressValid.html
[used]: https://mainnet.aeternity.io/v3/accounts/ak_11111111111111111111111111111111273Yts
