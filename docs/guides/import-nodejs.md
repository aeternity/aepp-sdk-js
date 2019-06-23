## Node.js bundle

The Node.js bundle is primarily interesting for scripts which use non-transpiled
code, such as the ones provided in the [`examples/node` directory](../examples/node) of the project.

```js
const { Universal: Ae } = require('@aeternity/aepp-sdk')

Ae({ url: 'https://sdk-testnet.aepps.com', internalUrl: 'https://sdk-testnet.aepps.com', compilerUrl: 'COMPILER_URL', keypair: 'YOUR_KEYPAIR_OBJECT' }).then(ae => {
  ae.height().then(height => {
    console.log('Current Block', height)
  })
})

// same with async
const main = async () => {
  const client = await Ae({url: 'https://sdk-testnet.aepps.com', internalUrl: 'https://sdk-testnet.aepps.com', compilerUrl: 'COMPILER_URL', keypair: 'YOUR_KEYPAIR_OBJECT'})
  const height = await client.height()
  console.log('Current Block', height)
}

// call main
main()
```
