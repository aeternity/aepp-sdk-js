#!/usr/bin/env node

/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

require ('@babel/polyfill')

const AeternityClient = require ('../lib/aepp-sdk')
const HttpProvider = require ('../lib/providers/http')


let client1 = new AeternityClient (new HttpProvider ('localhost', 3013, {
  internalPort: 3113,
  secured: false
}))


const program = require ('commander')
const prompt = require ('prompt')
const fs = require ('fs')
const Crypto = require ('../lib/utils/crypto')

let promptSchema = {
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

const signTransactionInternal = async function (recipient, amount, privateKey) {

  let data = await client1.base.getSpendTx (recipient, amount)

  console.log (`\nCreate an unsigned spend transaction: ${JSON.stringify (data)}`)

  let tx = data.tx
  console.log ('\nGet byte buffer from hex private key')
  // Get binary from hex variant of the private key
  let binaryKey = Buffer.from (privateKey, 'hex')

  // Split the base58Check part of the transaction
  let base58CheckTx = tx.split ('$')[1]
  let binaryTx = Crypto.decodeBase58Check (base58CheckTx)
  console.log ('\nSplit the tx hash after the $ and decode that base58check encoded string')


  console.log ('\nUse the ECDSA curve with \'secp256k1\' to sign the binary transaction with the binary private key')
  let signature = Crypto.sign (binaryTx, binaryKey)
  let sigBuffer = Buffer.from (signature)
  console.log ('\nThe signature as a byte buffer ' + JSON.stringify (sigBuffer))

  // the signed tx deserializer expects a 4-tuple:
  // <tx_type, version, tx_dict, signatures_array>
  let decodedTx = Crypto.decodeTx (tx)
  console.log (`\nThe decoded tx looks like this: ${JSON.stringify (decodedTx)}`)

  let unpackedSignedTx = [
    Buffer.from ('sig_tx'),
    1,
    decodedTx,
    [sigBuffer]
  ]

  console.log ('\nPack the signed transaction as a 4-tuple <t, v, tx, sigs> with')
  console.log ('t -> Transaction Type (always "sig_tx")')
  console.log ('v -> Version')
  console.log ('tx -> A list of <key, value> pairs')
  console.log ('sigs -> A list of signatures')

  let signedTx = Crypto.encodeTx (unpackedSignedTx)
  console.log (`\nThe signed base58check encoded and prefixed signed transaction:\n${signedTx}`)

  console.log ('\nSend off the signed transaction')
  await client1.tx.send (signedTx)
  console.log ('\nWait for 1 block')
  await client1.base.waitNBlocks (1)

  let transactions = await client1.accounts.getTransactions ({txTypes: ['aec_spend_tx']})
  console.log ('Your recent spending transactions: ' + JSON.stringify (transactions))

}

const signTransaction = async function (recipient, amount, options) {
  if (!options || (!options.keys && !options.private)) {
    throw 'Either --keys or --private has to be set'
  }

  amount = parseInt(amount)

  let privateHex
  if (!options.private) {
    let dir = options['keys']
    console.log('kets ' + dir)
    prompt.start ()
    prompt.get (promptSchema, async function (err, result) {
      let password = result.password

      console.log (`Decrypt the password secured keys`)

      let key = fs.readFileSync (`${dir}/key`)
      let pubKey = fs.readFileSync (`${dir}/key.pub`)
      let decrypted = Crypto.decryptPrivateKey (password, key)
      privateHex = Buffer.from (decrypted).toString ('hex')
      let decryptedPub = Crypto.decryptPubKey (password, pubKey)

      console.log (`Private key (hex): ${privateHex}`)
      console.log (`Public key (base check): ak\$${Crypto.encodeBase58Check (decryptedPub)}`)

      await signTransactionInternal(recipient, amount, privateHex)
    })
  } else {
    privateHex = options.private
    await signTransactionInternal(recipient, amount, privateHex)

  }
}

program
  .version ('0.1.0')
  .command ('spend-signed <recipient> <amount>')
  .option ('-d, --keys <keys>', 'Keys directory')
  .option ('-k, --private <private>', 'Private key')
  .description ('Sign and send a token transfer transaction with a private key')
  .action (signTransaction)


program.parse (process.argv)
if (program.args.length === 0) program.help ()
