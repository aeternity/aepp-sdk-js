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
const R = require('ramda')
const path = require('path')
const fs = require('fs')
const prompt = require('prompt')

require = require('esm')(module/*, options*/) //use to handle es6 import/export

const {default: Cli} = require('../es/ae/cli')
const Crypto = require('../es/utils/crypto')

// HAST TYPES
const HASH_TYPES = {
  transaction: 'th',
  block: 'kh',
  signature: 'sg',
  account: 'ak',
  stateHash: 'bs'
}

// The `prompt` library provides concealed input of passwords.
const PROMPT_SCHEMA = {
  properties: {
    password: {
      type: 'string',
      description: 'Enter your password',
      hidden: true,
      required: false,
      replace: '*',
      conform: function () {
        return true
      }
    }
  }
}

// FILE I/O
function writeFile (name, data) {
  try {
    fs.writeFileSync(
      name,
      data
    )
    return true
  } catch (e) {
    printError('WRITE FILE ERROR: ' + e)
    process.exit(1)
  }
}

function readFile (path, encoding = null) {
  try {
    return fs.readFileSync(
      path,
      encoding
    )
  } catch (e) {
    switch (e.code) {
      case 'ENOENT':
        printError('READ FILE ERROR: ' + 'File not found')
        break
      default:
        printError('READ FILE ERROR: ' + e)
        break
    }
    process.exit(1)
  }
}

function readJSONFile (filePath) {
  try {
    return JSON.parse(readFile(filePath))
  } catch (e) {
    printError('READ FILE ERROR: ' + e.message)
    process.exit(1)
  }
}

// CONSOLE PRINT HELPERS
function print (msg, obj = '') {
  console.log(msg, obj)
}

function printError (msg) {
  console.log(msg)
}

function printConfig ({host}) {
  print('WALLET_PUB___________' + process.env['WALLET_PUB'])
  print('EPOCH_URL___________' + host)
}

function printBlock (block) {
  print(`Block hash____________________ ${R.prop('hash', block)}`)
  print(`Block height__________________ ${R.prop('height', block)}`)
  print(`State hash____________________ ${R.prop('stateHash', block)}`)
  print(`Miner_________________________ ${R.defaultTo('N/A', R.prop('miner', block))}`)
  print(`Time__________________________ ${new Date(R.prop('time', block))}`)
  print(`Previous block hash___________ ${R.prop('prevHash', block)}`)
  print(`Transactions__________________ ${R.defaultTo(0, R.path(['transactions', 'length'], block))}`)
  if (R.defaultTo(0, R.path(['transactions', 'length'], block)))
    printBlockTransactions(block.transactions)
}

function printName (name) {
  print(`Status___________ ${R.defaultTo('N/A', R.prop('status', name))}`)
  print(`Name hash________ ${R.defaultTo('N/A', R.prop('nameHash', name))}`)
  print(`Pointers_________`, R.defaultTo('N/A', JSON.parse(R.defaultTo('\"[]\"', name.pointers))))
  print(`TTL______________ ${R.defaultTo(0, R.prop('nameTtl', name))}`)
}

function printBlockTransactions (ts) {
  ts.forEach(
    tx => {
      print(`-->
         Tx hash____________________ ${tx.hash}
         Signatures_________________ ${tx.signatures}
         Sender account_____________ ${R.defaultTo('N/A', R.path(['tx', 'sender'], tx))}
         Recipient account__________ ${R.defaultTo('N/A', R.path(['tx', 'recipient'], tx))}
         Amount_____________________ ${R.defaultTo('N/A', R.path(['tx', 'amount'], tx))}`)
    })
}

function printTransaction (tx) {
  print(`Block hash____________________ ${tx.blockHash}`)
  print(`Block height__________________ ${tx.blockHeight}`)
  print(`Signatures____________________ ${tx.signatures}`)
  print(`Sender account________________ ${R.defaultTo('N/A', R.path(['tx', 'sender'], tx))}`)
  print(`Recipient account_____________ ${R.defaultTo('N/A', R.path(['tx', 'recipient'], tx))}`)
  print(`Amount________________________ ${R.defaultTo('N/A', R.path(['tx', 'amount'], tx))}`)
  print(`TTL___________________________ ${R.defaultTo('N/A', R.path(['tx', 'ttl'], tx))}`)
}

function printContractDescr (descriptor) {
  print('Source________________________ ' + descriptor.source)
  print('Bytecode______________________ ' + descriptor.bytecode)
  print('Address_______________________ ' + descriptor.address)
  print('Transaction___________________ ' + descriptor.transaction)
  print('Owner_________________________ ' + descriptor.owner)
  print('Created_At____________________ ' + descriptor.createdAt)
}

function logContractDescriptor (desc, title = '') {
  print(`${title}`)
  print(`Contract address________________ ${desc.address}`)
  print(`Transaction hash________________ ${desc.transaction}`)
  print(`Deploy descriptor_______________ ${desc.descPath}`)
}

//

// ERROR HANDLERS
function logApiError (error) { printError(`API ERROR: ${error}`) }

async function handleApiError (fn) {
  try {
    return await fn()
  } catch (e) {
    const response = e.response
    logApiError(response && response.data ? response.data.reason : e)
    process.exit(1)
  }
}

function unknownCommandHandler (program) {
  return (execCommands = []) => {
    const cmd = program.args[0]

    if (isExecCommand(cmd, execCommands)) return

    print('Invalid command: %s\nSee --help for a list of available commands.', cmd)
    program.help()
  }
}

//

// WALLET HELPERS
async function generateSecureWallet (name, {output, password}) {
  password = password || await promptPasswordAsync()
  const {pub, priv} = Crypto.generateSaveWallet(password)
  const data = [
    [path.join(output, name), priv],
    [path.join(output, `${name}.pub`), pub]
  ]

  data.forEach(([walletPath, data]) => {
    writeFile(walletPath, data)
    print(`Wrote ${path.resolve(process.cwd(), walletPath)}`)
  })
}

async function generateSecureWalletFromPrivKey (name, priv, {output, password}) {
  password = password || await promptPasswordAsync()

  const hexStr = Crypto.hexStringToByte(priv.trim())
  const keys = Crypto.generateKeyPairFromSecret(hexStr)

  const encryptedKeyPair = {
    pub: Crypto.encryptPublicKey(password, keys.publicKey),
    priv: Crypto.encryptPrivateKey(password, keys.secretKey)
  }

  const data = [
    [path.join(output, name), encryptedKeyPair.priv],
    [path.join(output, `${name}.pub`), encryptedKeyPair.pub]
  ]

  data.forEach(([path, data]) => {
    writeFile(path, data)
  })

  print(`
    Wallet saved
    Wallet address________________ ${Crypto.aeEncodeKey(keys.publicKey)}
    Wallet path___________________ ${path.resolve(process.cwd(), name)}
  `)
}

async function getWalletByPathAndDecrypt () {
  let {pass, path: walletPath} = JSON.parse(process.env['WALLET_DATA'])

  const privBinaryKey = readFile(path.resolve(process.cwd(), walletPath))
  const pubBinaryKey = readFile(path.resolve(process.cwd(), `${walletPath}.pub`))

  if (!pass || typeof pass !== 'string' || !pass.length) pass = await promptPasswordAsync()

  const decryptedPriv = Crypto.decryptPrivateKey(pass, privBinaryKey)
  const decryptedPub = Crypto.decryptPubKey(pass, pubBinaryKey)

  return {
    priv: decryptedPriv.toString('hex'),
    pub: `ak_${Crypto.encodeBase58Check(decryptedPub)}`
  }
}

async function promptPasswordAsync () {
  return new Promise(
    (resolve, reject) => {
      prompt.start()
      prompt.get(
        PROMPT_SCHEMA,
        (err, res) => {
          if (err) reject(err)
          resolve(res.password)
        }
      )
    }
  )
}

//

// UTILS
function getCmdFromArguments (args) {
  return R.merge(
    args[args.length - 1],
    args[args.length - 1].parent
  )
}

async function initClient (url, keypair) {
  return await Cli({url, process, keypair})
}

function initExecCommands (program) {
  return (cmds) => cmds.forEach(({name, desc}) => program.command(name, desc))
}

function isExecCommand (cmd, commands) {
  return commands.find(({name}) => cmd === name)
}

function checkPref (hash, hashType) {
  if (hash.length < 3 || hash.indexOf('_') === -1)
    throw new Error(`Invalid input, likely you forgot to escape the $ sign (use \\$)`)

  if (hash.slice(0, 3) !== hashType + '_') {
    let msg
    switch (hashType) {
      case HASH_TYPES.transaction:
        msg = 'Invalid transaction hash, it should be like: th_....'
        break
      case HASH_TYPES.block:
        msg = 'Invalid block hash, it should be like: bh_....'
        break
      case HASH_TYPES.account:
        msg = 'Invalid account address, it should be like: ak_....'
        break
    }
    throw new Error(msg)
  }

}

module.exports = {
  printBlock,
  initClient,
  printConfig,
  printTransaction,
  getWalletByPathAndDecrypt,
  handleApiError,
  generateSecureWallet,
  initExecCommands,
  unknownCommandHandler,
  generateSecureWalletFromPrivKey,
  checkPref,
  print,
  printError,
  logContractDescriptor,
  printContractDescr,
  getCmdFromArguments,
  readFile,
  writeFile,
  printName,
  readJSONFile,
  HASH_TYPES,
  HOST: 'https://sdk-edgenet.aepps.com'
}
