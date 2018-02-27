# aepp-sdk-js

A wrapper for the Aeternity Epoch net

This SDK is at an Alpha stage where things easily can break. We aim to make our Alpha releases as save as possible. Neverless it should not be take as production-ready yet. To catch up with the more edgy state of development please check out the [develop branch](https://github.com/aeternity/aepp-sdk-js/tree/develop)

## Install

```
npm install aepps-epoch-js
```

## Usage 

Example [AENS](https://github.com/aeternity/protocol/blob/master/AENS.md) Example
```javascript

const EpochHttpClient = require('aepps-epoch-js')

const aensLifecycle = async (domain, salt) => {

  // External port => 3003
  // Internal port => 3103
  let client = EpochHttpClient('localhost', 3003, 3103)

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

## License

ISC
