# Offchain transaction signing

This walk through example assumes that you have full access to the account you are using to sign and send the transaction

## Get access to your private key

The distribution contains a standalone CLI tool to decrypt your key pair from the `epoch` folder. You can access it under `bin/keys`. Per default, the key-pair is stored in a folder `keys` under the [epoch](https://github.com/aeternity/epoch) project folder.

```
bin/keys decrypt <KEYS_DIR>
```

Results in:

```
Private key (hex): asbdkjshdf238nefdhwu2asj
Public key (base check): ak$<Base58Check encoded key> 
```

## Signing a transaction

### Instantiate Aeternity client and HTTP provider:

```javascript

const AeternityClient = require('aepp-sdk')

// Import crypto tools 
const Crypto = require('lib/utils/crypto')

let client = new AeternityClient(new AeternityClient.providers.HttpProvider('localhost', 3013, {internalPort: 3113, secured: false}))


```

### Get unsigned transaction from node

*For readibility reasons we are using the async/await pattern here. Please make sure your function has the **async** keyword and to setup the apprioriate NodeJS version if you copy and paste the code.*

```javascript

let {tx} = await client.base.getSpendTx('ak$<Base58Check encoded key>', 10)

```

### Get binary of your private key

```javascript
let binaryKey = Buffer.from(<your private hex key from above>, 'hex')
```

### Deserialize the transaction hash

```javascript

let base58CheckTx = tx.split('$')[1]
let binaryTx = Crypto.decodeBase58Check(base58CheckTx)

```

### Create signature

```javascript
let signature = Crypto.sign(binaryTx, binaryKey)
let sigBuffer = Buffer.from(signature)
```

### Decode and unpack the msgpacked transaction

```javascript
let decodedTx = Crypto.decodeTx(tx)
```

### Assemble the signed transaction 4-tuple

The signed tx deserializer expects a 4-tuple <tx_type, version, tx_dict, sigs> with:
* `tx_type`: Transaction type (`sig_tx`)
* `version`: Version
* `tx_dict`: A list of `<key,value>` pairs of valid transaction parameters
* `sigs`: A list of signatures in byte string format

let unpackedSignedTx = [
 Buffer.from('sig_tx'),
 1,
 decodedTx,
 [sigBuffer]  // Epoch waits for a byte string
]

### Pack the signed transaction 4-tuple

Pack the signed transaction tuple as msgpack format and encode this with `base58check` encoding.

```[javascript]
let signedTx = Crypto.encodeTx(unpackedSignedTx)
```

### Send 

Now you are ready to send the transaction

```javascript
client1.tx.send(signedTx)
```

### Validate

You should at least wait for one block to be sure, that your transaction has been mined
```javascript
await client1.base.waitNBlocks(1)

let transactions = await client1.accounts.getTransactions({txTypes: ['aec_spend_tx']})
console.log('Your recent spending transactions: ' + JSON.stringify(transactions))
```

```
