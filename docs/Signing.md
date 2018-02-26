# Offchain transaction signing

This walk through example assumes that you have full access to the account you are using to sign and send the transaction

## Get access to your private key

The distribution contains a standalone CLI tool to decrypt your key pair from the `epoch` folder. You can access it under `bin/keys`. Per default, the key-pair is stored in a folder `keys` under the (epoch)[https://github.com/aeternity/epoch] project folder.

```
bin/keys decrypt <KEYS_DIR>
```

Results in:

```
Private key (hex): asbdkjshdf238nefdhwu2asj
Public key (base check): ak$<Base58Check encoded key> 
```

### Instantiate Aeternity client and HTTP provider:

```[javascript]

const AeternityClient = require('aepp-sdk')
const Crypto = require('lib/utils/crypto')

const RECIEPIENT = 'ak$<some valid receipient pubkey>'

let client = new AeternityClient(new AeternityClient.providers.HttpProvider('localhost', 3013, {internalPort: 3113, secured: false}))

client.base.getSpendTx(RECEIPIENT, 10).then(
   {tx} => {
     // Get binary from hex variant of the private key
     let binaryKey = Buffer.from(privateHex, 'hex')

     // Split the base58Check part of the transaction
     let base58CheckTx = tx.split('$')[1]
     let binaryTx = Crypto.decodeBase58Check(base58CheckTx)
     console.log('\nSplit the tx hash after the $ and decode that base58check encoded string')

     console.log('\nUse the ECDSA curve with \'secp256k1\' to sign the binary transaction with the binary private key')
     
     let signature = Crypto.sign(binaryTx, binaryKey)
     let sigBuffer = Buffer.from(signature)
     console.log('\nThe signature as a byte buffer ' + JSON.stringify(sigBuffer))


     // the signed tx deserializer expects a 4-tuple:
     // <tx_type, version, tx_dict, signatures_array>
     let decodedTx = Crypto.decodeTx(tx)
     console.log(`\nThe decoded tx looks like this: ${JSON.stringify(decodedTx)}`)

     let unpackedSignedTx = [
       Buffer.from('sig_tx'),
       1,
       decodedTx,
       [sigBuffer]
     ]

     console.log('\nPack the signed transaction as a 4-tuple <t, v, tx, sigs> with')
     console.log('t -> Transaction Type (always "sig_tx")')
     console.log('v -> Version')
     console.log('tx -> A list of <key, value> pairs')
     console.log('sigs -> A list of signatures')

     let signedTx = Crypto.encodeTx(unpackedSignedTx)
     console.log(`\nThe signed base58check encoded and prefixed signed transaction:\n${signedTx}`)

     console.log('\nSend off the signed transaction')
     await client1.tx.send(signedTx)
     console.log('\nWait for 1 block')
     await client1.base.waitNBlocks(1)

     let transactions = await client1.accounts.getTransactions({txTypes: ['aec_spend_tx']})
     console.log('Your recent spending transactions: ' + JSON.stringify(transactions))

   }
)

```


