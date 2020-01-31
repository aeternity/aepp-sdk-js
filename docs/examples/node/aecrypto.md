





  

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






## Key Pair Generation


  

```js
function generateKeyPair (name, { output }) {
  const { publicKey, secretKey } = Crypto.generateKeyPair()
  return { publicKey, secretKey }
  
}
```







## Transaction Signing

This function shows how to sign an æternity
transaction and turn it into an RLP-encoded tuple ready for mining


  

```js
function signTx (tx, secretKey) {
  if (!tx.match(/^tx_.+/)) {
    throw Error('Not a valid transaction')
  }
  secretKey = Buffer.from(keyPair.secretKey, 'hex')
  const rlpBinaryTx = Crypto.decodeBase64Check(Crypto.assertedType(tx, 'tx'))
  // Prepend `NETWORK_ID` to begin of data binary
  const txWithNetworkId = Buffer.concat([Buffer.from(program.networkId), rlpBinaryTx])
  
  const signatures = [Crypto.sign(txWithNetworkId, secretKey)]
  const { tx } = buildTx({ encodedTx: rlpBinaryTx, signatures }, TX_TYPE.signed)
  console.log('Signed transaction: ' + tx)
}
````






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
  .command('sign <tx> <priv>')
  .option('--networkId [networkId]', 'Network Id')
  .action(signTx)

program
  .command('unpack <tx>')
  .action(unpackTx)

program.parse(process.argv)
if (program.args.length === 0) program.help()


```




