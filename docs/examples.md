# Examples

## Browser <script> tag
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  <script src="aepp-sdk.browser.js"></script>
  <script type="text/javascript">
    Ae.default.create('https://sdk-testnet.aepps.com').then(client => {
      client.height().then(height => {
        console.log('Current Block', height)
      })
    })
  </script>
</body>
</html>
```

## nodejs (without compiling)

Use either yarn or npm to install the sdk.
Use a prebuilt package from npmjs
```
yarn add @aeternity/aepp-sdk
```
Or use a branch directly from github if you want to try unreleased features
```
yarn add aeternity/aepp-sdk-js#develop
```
create index.js
```js
const Ae = require('@aeternity/aepp-sdk')

Ae.default.create('https://sdk-testnet.aepps.com').then(client => {
  client.height().then(height => {
    console.log('Current Block', height)
  })
})

// same with async
const main = async () => {
  const client = await Ae.default.create('https://sdk-testnet.aepps.com')
  const height = await client.height()
  console.log('Current Block', height)
}
main()
```

run:
```
node index.js
```

## vue.js with webpack
set up a new vue project with webpack
```
vue init webpack my-project
cd my-project
yarn add @aeternity/aepp-sdk
```
edit src/components/HelloWorld.vue
```js
<script>
import Ae from '@aeternity/aepp-sdk'
const ae = Ae.create('https://sdk-testnet.aepps.com')
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  async mounted () {
    const client = await ae
    const height = await client.height()
    this.msg = 'Current Block: ' + height
  }
}
</script>
```
start the application
```
yarn dev
```

## Transaction Signing

Signing transactions with private keys is a fundamental feature of the
blockchain protocol. Epoch provides useful convenience methods for constructing
transactions of different kinds. For more information on these endpoints the
[Swagger Explorer](https://aeternity.github.io/epoch-api-docs/?config=https://raw.githubusercontent.com/aeternity/epoch/master/apps/aehttp/priv/swagger.json)
is a good starting point. The relevant transactions are grouped under `/tx/*`.

The following snippet demonstrates the most basic usage for offchain signing in
the SDK. First call a convenience method to receive a serialized, packed
(/w msgpack) and base encrypted version of the transaction which is used in the
second step to create a signature on the transaction with the private key.

```javascript
const { AeternityClient } = require('aepp-sdk')

const provider = new AeternityClient.providers.HttpProvider('localhost', 3003, {secured: false})
await provider.ready
const client = AeternityClient(provider)

const privateKey = '<lets assume you extracted your private key which is store here as a hex>'
...

// Convenience method to receive a valid spending transaction hash from the server
client.base.getSpendTx(recipient, amount).then(
    (data) => {
        let unsignedTx = data.tx
        client.tx.sendSigned(tx, privateKey)
    }
)
```

### Demo

If you are interested in more details how the transactions are encrypted, please
use this
[CLI example](https://github.com/aeternity/aepp-sdk-js/blob/develop/examples/signing.js).

The example demonstrates how to send token with an offchain signed transaction
and outputs a detailed description of the decryption process. Before you can run
the example you either have to get access to the `keys` pair in your Epoch
distribution (option `--keys`) or you have already a hex version of your private
key which you can use (option `--private`).

**Option 1, --keys (you have to know your passwort to decrypt the keys, defaults to: 'secret')**
```
examples/signing.js spend-signed <recipient_pub_key> <amount> --keys <your Epoch keys>
```

**Option 2, --private**

```
examples/signing.js spend-signed <recipient_pub_key> <amount> --keys <your Epoch keys>
```
The [documentation](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/Signing.md)
also walks you through that demo.

## AENS

The example below covers Aeternity's built-in Naming System functionality. For
more information please check
[AENS](https://github.com/aeternity/protocol/blob/master/AENS.md)

```javascript

// See above for client instantiation

const aensLifecycle = async (domain, salt) => {

  let domainData = client.aens.query(domain)
  if (domainData) {
    let nameHash = domainData['name_hash']
    console.log(`Name ${domain} is not available anymore! hash: ${nameHash}`)
  } else {
    // get the commitment hash
    let commitment = await client.aens.getCommitmentHash(domain, salt)

    // preclaim the name
    let preclaimHash = await client.aens.preClaim(commitment, 1)
    console.log(`Preclaim hash: ${preclaimHash}`)

    // wait for 1 block
    await client.base.waitNBlocks(1)

    // Claim the domain
    let nameHash = await client.aens.claim(domain, salt, 1)
    console.log(`Domain claimed with hash ${nameHash}`)

    // Let the name point to an account (or oracle)
    let updatedNameHash = await client.aens.update('ak$3Xp...rLYHyuA2', nameHash)
    console.log(`${updatedNameHash} is just the same name hash`)

    let updatedDomainData = client.aens.query('example.aet')
    console.log(`Domain now points to ${JSON.parse(updatedDomainData['pointer'])['account_key']}`)

    // Revoke the domain
    await client.aens.revoke(nameHash, 1)
    return nameHash
  }
}

// salt should be random integer
let randomInt = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER))
aensLifecycle('aepps.aet', 12345).then((nameHash) => console.log("Life and death of 'aepps.aet'"))
```

## Oracles

An oracle serves as a provider of real-world data for smart contracts on the
block chain. In Æternity, oracles are first-class citizens of the block chain.

Serving an oracle:
```javascript

const axios = require('axios')

// We are using a websocket provider here
let provider = new AeternityClient.providers.WebSocketProvider(options.host, options.port)
let client = new AeternityClient(provider)

// Add a connection listener listening on 'open' events to make sure, that the oracle is not registered
client.addConnectionListener(new ConnectionListener({
onOpen: () => {
  // Websocket connection is open
  client.oracles.register ('queryFormat', 'responseFormat', 4, 500, 5).then (
    (oracleId) => {
      // Landing here means that the oracle with ID ${oracleId} is online

      // ... now set a function that serves as the immediate responder to a query
      client.oracles.setResolver ((queryData) => {
        let statementId = queryData['query']
        axios.get (`https://vote.aepps.com/statements/${statementId}/json`)
          .then ((response) => {
            // Respond to the query
            client.oracles.respond (queryData['query_id'], 4, JSON.stringify (response.data))
          })
          .catch (
            (error) => {
              console.error (error)
            }
          )
      })
    }
  )
}})
```

Querying an oracle:
```
// Let's assume the client has been initialised as above...

client.addConnectionListener(new ConnectionListener({
onOpen: () => {
  client.oracles.query (oracle, 4, 10, 10, 7, query).then (
    (response) => {
      console.log (`New response:\n ${JSON.stringify (response)}`)
    }
  )
}})
```

It should be pointed out, that in practice the client side of an oracle lives
inside a smart contract and not in Javascript code. This example is mostly for
demonstration and testing purposes.

### Demo

Start the example Oracle provider (Providing Æpp Vote Statements)

```
examples/oracles.js serve
```

Ask questions to the oracle.
```
examples/oracles.js ask <oracle_id>
```
