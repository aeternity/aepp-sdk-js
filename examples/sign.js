#!/usr/bin/env node

const program = require('commander')
const aepp = require('@aeternity/aepp-sdk')
const fs = require('fs')

function signTx(tx, privKey) {
  let binaryKey

  if (program.file)
    binaryKey = fs.readFileSync(program.file)
  else
    binaryKey = Buffer.from(privKey, 'hex')

  if (program.password)
    binaryKey = aepp.Crypto.decryptKey(program.password, binaryKey)

  // Split the base58Check part of the transaction
  const base58CheckTx = tx.split('$')[1]
  // ... and sign the binary create_contract transaction
  const binaryTx = aepp.Crypto.decodeBase58Check(base58CheckTx)

  const signature = aepp.Crypto.sign(binaryTx, binaryKey)

  // the signed tx deserializer expects a 4-tuple:
  // <tag, version, signatures_array, binary_tx>

  const unpackedSignedTx = [
    Buffer.from([11]),
    Buffer.from([1]),
    [Buffer.from(signature)],
    binaryTx
  ]

  console.log(aepp.Crypto.encodeTx(unpackedSignedTx))
}

program
  .usage('<tx> [privkey]')
  .option('-p, --password [password]', 'password of the private key')
  .option('-f, --file [file]', 'private key file')
  .action(signTx)

program.parse(process.argv)
