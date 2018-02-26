# epoch-http-js

A wrapper for the Aeternity Epoch net

## Install

```
npm install aepps-sdk
```

## Usage 

### AENS

The example below covers Aeternity's built-in Naming System functionality. For more information please check [AENS](https://github.com/aeternity/protocol/blob/master/AENS.md)

```javascript

const AeternityClient = require('aepps-sdk')

let provider = new AeternityClient.providers.HttpProvider('localhost', 3003, {internalPort: 3103, secured: false)
let client = AeternityClient(provider)
  
const aensLifecycle = async (domain, salt) => {

  // External port => 3003
  // Internal port => 3103


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

### Transaction Signing

Signing transactions with private keys is a fundamental feature of the blockchain protocol. Epoch provides useful convenience methods for constructing transactions of different kinds. For more information on these endpoints the [Swagger Explorer](https://aeternity.github.io/epoch-api-docs/?config=https://raw.githubusercontent.com/aeternity/epoch/master/apps/aehttp/priv/swagger.json) is a good starting point. The relevant transactions are grouped under `/tx/*`.

The following snippet demonstrates the most basic usage for offchain signing in the SDK. First call a convenience method to receive a serialized, packed (/w msgpack) and base encrypted version of the transaction which is used in the second step to create a signature on the transaction with the private key.

```javascript

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

If you are interested in more details how the transactions are encrypted, please use the CLI example [here](https://github.com/aeternity/aepp-sdk-js/blob/develop/examples/signing.js) which provides detailed output on the whole process.

## Tools

### Key decryption

This CLI can be used during development to transform the stored keys on a node
to test offchain signing.

```
npm run decrypt -- <KEYS DIRECTORY>
```

## License

ISC
