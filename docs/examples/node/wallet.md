


# Simple AE Token Spending Script

This script shows how to use the SDK to send AE to other addresses.


We'll need the main client module `Sdk` in the `Universal` flavor from the SDK.


```js
const { Universal: Sdk, Node, MemoryAccount } = require('../../dist/aepp-sdk')
```

Define some constants


```js
const ACCOUNT_KEYPAIR = {
  publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
  secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'
}
const NODE_URL = 'https://testnet.aeternity.io'
```

Generate the account instance based on the keypair


```js
const account = MemoryAccount({ keypair: ACCOUNT_KEYPAIR })
```

Receive optional amount and address from command line arguments


```js
const [amount = 1, receiverAddress = ACCOUNT_KEYPAIR.publicKey] = process.argv.slice(2);
```

Most methods in the SDK return _Promises_, so the recommended way of
dealing with subsequent actions is running them one by one using `await`.


```js
(async () => {
  const node = await Node({ url: NODE_URL })
```

`Sdk` itself is asynchronous as it determines the node's version and
rest interface automatically. Only once the Promise is fulfilled, we know
we have a working `Sdk` instance. Please take note `Sdk` is not a constructor but
a factory, which means it's *not* invoked with `new`.


```js
  const sdk = await Sdk({
    nodes: [{ name: 'testnet', instance: node }],
    accounts: [account]
  })
```

Invoking the spend method on `Sdk` instance.


```js
  const tx = await sdk.spend(+amount, receiverAddress)
  console.log('Transaction mined', tx)
})()
```

