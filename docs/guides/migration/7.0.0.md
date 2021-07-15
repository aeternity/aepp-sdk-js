# Migration to SDK 7.0.0
This guide describes the process of migrating to SDK version 7.0.0

## Step 1
SDK will not accept `url`, `internalUrl` init arguments anymore:
#### Before
```js
Universal({
    url,
    internalUrl
})
```
#### After
```js
const nodeInstance = await Node({ url, internalUrl })
Universal({
    nodes: [{ name: 'testnet', instance: nodeInstance }]
})
```

## Step 2
Remove deprecated function `setKeypair`   
`SDK` will not accept `keypair` init argument anymore:
#### Before
```js
Universal({ keypair })
```
#### After
```js
Universal({
  accounts: [MemoryAccount({ keypair })]
})
```

## Step 3
Change all of `AENS` method's first argument from `nameId` to `name`
### Before
```js
const client = Universal({ ... })

await client.aensUpdate('cm_ad1wdsa...', ...)
await client.aensTransfer('cm_ad1wdsa...', ...)
await client.aensRevoke('cm_ad1wdsa...', ...)
```
### After
```js
const client = Universal({ ... })

await client.aensUpdate('testname.chain', ...)
await client.aensTransfer('testname.chain', ...)
await client.aensRevoke('testname.chain', ...)
```

## Other Breaking Changes
- Add new compiler `methods` to RPC `communication` (base-app update required)
- Drop compiler version to `version >= 4.0.0 && version < 5.0.0`
- Change node compatibility range to `node >= 5.0.0 && node < 6.0.0`
- Always `verify` transactions before sending them to the node (can be disabled using the option `verify: false`)
