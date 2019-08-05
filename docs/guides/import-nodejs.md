## Node.js bundle

The Node.js bundle is primarily interesting for scripts which use non-transpiled
code, such as the ones provided in the [`examples/node` directory](../examples/node) of the project.

```js
const { Universal: Ae, MemoryAccount, ChainNode } = require('@aeternity/aepp-sdk')

// const node1 = await ChainNode({ url: 'https://sdk-testnet.aepps.com', internalUrl: 'https://sdk-testnet.aepps.com' })
// const node2 = ...

// const acc1 = MemoryAccount({ keypair: 'YOUR_KEYPAIR_OBJECT' })
// const acc2 = ...

Ae({ 
  // This two params deprecated and will be remove in next major release
  url: 'https://sdk-testnet.aepps.com',
  internalUrl: 'https://sdk-testnet.aepps.com',
  // instead use
  nodes: [
    node1,
    // mode2
  ],
  compilerUrl: 'COMPILER_URL',
  // `keypair` param deprecated and will be removed in next major release
  keypair: 'YOUR_KEYPAIR_OBJECT',
  // instead use
  accounts: [
    acc1,
    // acc2
  ]
}).then(ae => {
  ae.height().then(height => {
    console.log('Current Block', height)
  })
})

// same with async
const main = async () => {
  const node1 = await ChainNode({ url: 'https://sdk-testnet.aepps.com', internalUrl: 'https://sdk-testnet.aepps.com' })
  // const node2 = ...

  const acc1 = MemoryAccount({ keypair: 'YOUR_KEYPAIR_OBJECT' })
  // const acc2 = ...  

  const client = await Ae({
    // This two params deprecated and will be remove in next major release
      url: 'https://sdk-testnet.aepps.com',
      internalUrl: 'https://sdk-testnet.aepps.com',
      // instead use
      nodes: [
        node1,
        // mode2
      ],
      compilerUrl: 'COMPILER_URL',
      // `keypair` param deprecated and will be removed in next major release
      keypair: 'YOUR_KEYPAIR_OBJECT',
      // instead use
      accounts: [
        acc1,
        // acc2
      ],
      address: 'SELECTED_ACCOUNT_PUB'
  })
  const height = await client.height()
  console.log('Current Block', height)
}

// call main
main()
```
