## Node.js bundle

The Node.js bundle is primarily interesting for scripts which use non-transpiled
code, such as the ones provided in the [`examples/node` directory](../examples/node) of the project.

```js
const { Universal: Ae, MemoryAccount, Node } = require('@aeternity/aepp-sdk')

const node1 = Node({ url: 'https://sdk-testnet.aepps.com', internalUrl: 'https://sdk-testnet.aepps.com' })
// const node2 = ...

const acc1 = MemoryAccount({ keypair: 'YOUR_KEYPAIR_OBJECT' })
// const acc2 = ...
Promise.all([
  node1
]).then(nodes => {
    Ae({ 
      nodes: [
        { name: 'someNode', instance: nodes[0] },
        // node2
      ],
      compilerUrl: 'COMPILER_URL',
      accounts: [
        acc1,
        // acc2
      ]
    }).then(ae => {
      ae.height().then(height => {
        console.log('Current Block', height)
      })
    })
})


// same with async
const main = async () => {
  const node1 = await Node({ url: 'https://sdk-testnet.aepps.com', internalUrl: 'https://sdk-testnet.aepps.com' })
  // const node2 = ...

  const acc1 = MemoryAccount({ keypair: 'YOUR_KEYPAIR_OBJECT' })
  // const acc2 = ...  

  const client = await Ae({
      nodes: [
        { name: 'someNode', instance: node1 },
        // node2
      ],
      compilerUrl: 'COMPILER_URL',
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
