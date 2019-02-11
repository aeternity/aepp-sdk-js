





  

```js
#!/usr/bin/env node

```







# æternity Crypto Helper Script

This script shows how to use the SDK to generate and decrypt æternity
compliant key pairs, as well as encode and decode transactions.


  

```js
/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

'use strict'


```







We'll only load the `Crypto` module from the SDK to work with keys and
transactions.


  

```js
const { Crypto, TxBuilder } = require('@aeternity/aepp-sdk')
const program = require('commander')
const fs = require('fs')
const prompt = require('prompt')
const path = require('path')


```







The `prompt` library provides concealed input of passwords.


  

```js
const promptSchema = {
  properties: {
    password: {
      type: 'string',
      description: 'Enter your password',
      hidden: true,
      required: true,
      replace: '*',
      conform: function (value) {
        return true
      }
    }
  }
}


```







## Key Extraction (from Node nodes)


  

```js
function extractReadableKeys (dir, options) {
  const pwd = options.input
  prompt.start()
  prompt.get(promptSchema, (err, { password }) => {
    const key = fs.readFileSync(path.join(pwd, dir, 'sign_key'))
    const pubKey = fs.readFileSync(path.join(pwd, dir, 'sign_key.pub'))

    const decrypted = Crypto.decryptPrivateKey(password, key)

    const privateHex = Buffer.from(decrypted).toString('hex')
    const decryptedPub = Crypto.decryptPubKey(password, pubKey)

    console.log(`Private key (hex): ${privateHex}`)
    console.log(`Public key (base check): ak_${Crypto.encodeBase58Check(decryptedPub)}`)
    console.log(`Public key (hex): ${decryptedPub.toString('hex')}`)
  })
}


```







## Key Pair Generation


  

```js
function generateKeyPair (name, { output }) {
  const { publicKey, secretKey } = Crypto.generateKeyPair()

  const data = [
    [path.join(output, name), secretKey],
    [path.join(output, `${name}.pub`), publicKey]
  ]

  data.forEach(([path, data]) => {
    fs.writeFileSync(path, data)
    console.log(`Wrote ${path}`)
  })
}


```







## Transaction Signing

This function shows how to use a compliant private key to sign an æternity
transaction and turn it into an RLP-encoded tuple ready for mining


  

```js
function signTx (tx, privKey) {
  if (!tx.match(/^tx\_.+/)) {
    throw Error('Not a valid transaction')
  }

  const binaryKey = (() => {
    if (program.file) {
      return fs.readFileSync(program.file)
    } else if (privKey) {
      return Buffer.from(privKey, 'hex')
    } else {
      throw Error('Must provide either [privkey] or [file]')
    }
  })()

  const decryptedKey = program.password ? Crypto.decryptKey(program.password, binaryKey) : binaryKey


```







Split the base58Check part of the transaction


  

```js
  const base58CheckTx = tx.split('_')[1]

```







... and sign the binary create_contract transaction


  

```js
  const binaryTx = Crypto.decodeBase58Check(base58CheckTx)

  const signature = Crypto.sign(binaryTx, decryptedKey)


```







the signed tx deserializer expects a 4-tuple:
<tag, version, signatures_array, binary_tx>


  

```js
  const unpackedSignedTx = [
    Buffer.from([11]),
    Buffer.from([1]),
    [Buffer.from(signature)],
    binaryTx
  ]

  console.log(Crypto.encodeTx(unpackedSignedTx))
}


```







## Transaction Deserialization

This helper function deserialized the transaction `tx` and prints the result.


  

```js
function unpackTx (tx) {
  const deserializedTx = TxBuilder.unpackTx(tx)
  console.log(JSON.stringify(deserializedTx, undefined, 2))
}


```







## Command Line Interface

The `commander` library provides maximum command line parsing convenience.


  

```js
program.version('0.1.0')

program
  .command('decrypt <directory>')
  .description('Decrypts public and private key to readable formats for testing purposes')
  .option('-i, --input [directory]', 'Directory where to look for keys', '.')
  .action(extractReadableKeys)

program
  .command('genkey <keyname>')
  .description('Generate keypair')
  .option('-o, --output [directory]', 'Output directory for the keys', '.')
  .action(generateKeyPair)

program
  .command('sign <tx> [privkey]')
  .option('-p, --password [password]', 'password of the private key')
  .option('-f, --file [file]', 'private key file')
  .action(signTx)

program
  .command('unpack <tx>')
  .action(unpackTx)

program.parse(process.argv)
if (program.args.length === 0) program.help()


```




