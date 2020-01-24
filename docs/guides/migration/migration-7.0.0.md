# Migration to SDK 7.0.0
This guide describe the process of migrating to SDK version 7.0.0

## Step 1
SDK will not accept `url`, `internalUrl` init arguments for anymore:
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
