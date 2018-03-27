---
layout: page
title: SDK.js
navigation: 5
---

# aepp-sdk-js
A wrapper for the æternity Epoch network

#### Disclaimer

This SDK is at an alpha stage where things easily can break. We aim to make our
alpha releases as stable as possible. Neverless it should not be taken as
production-ready. To catch up with the more edgy state of development please
check out the [develop branch](https://github.com/aeternity/aepp-sdk-js/tree/develop).

## Install

### NPM

```
npm install aepps-sdk
```

### Local branch development
This package makes use of ES6 language patterns. To be able to use the full
command line functionality provided in this repository, please make sure, that
you set up your local environment to use **NodeJS v9 or above**.

## Usage

Example [AENS](https://github.com/aeternity/protocol/blob/master/AENS.md) 

### Transaction Signing

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
const AeternityClient = require('aepps-sdk')

let provider = new AeternityClient.providers.HttpProvider('localhost', 3003, {secured: false})
let client = AeternityClient(provider)

const privateKey = '<lets assume you extracted your private key which is store here as a hex>'
...

// Convenience method to receive a valid spending transaction hash from the server
client.base.getSpendTx (recipient, amount).then(
    (data) => {
        let unsignedTx = data.tx
        client.tx.sendSigned(tx, privateKey)
    }
)
```

#### Demo

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

### AENS

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

### Oracles

An oracle serves as a provider of real-world data for smart contracts on the
block chain. In Æternity, oracles are first-class citizens of the block chain.

Serving an oracle:
```javascript

const axios = require('axios')

// We are using a websocket provider here
let provider = new AeternityClient.providers.WebSocketProvider (options.host, options.port)
let client = new AeternityClient (provider)

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


#### Demo

Start the example Oracle provider (Providing Æpp Vote Statements)

```
examples/oracles.js serve
```

Ask questions to the oracle.
```
examples/oracles.js ask <oracle_id>
```

## Tools

### Key decryption

This CLI can be used during development to transform the stored keys on a node
to test offchain signing.

```
npm run decrypt -- <KEYS DIRECTORY>
```

## License
ISC
