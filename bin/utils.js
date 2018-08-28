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

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const path = require('path')
const fs = require('fs')
const prompt = require('prompt')

const {default: Cli} = require('../es/ae/cli')
const Crypto = require('../es/utils/crypto')

// HAST TYPES
const HASH_TYPES = {
  transaction: 'th',
  block: 'bh',
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
      required: true,
      replace: '*',
      conform: function () {
        return true
      }
    }
  }
}

const getCmdFromArguments = (args) => Object.assign({}, args[args.length - 1], args[args.length - 1].parent)

const initClient = async (url, keypair) => {
  return await Cli({url, process, keypair})
}

// FILE I/O
const writeFile = (name, data) => {
  try {
    fs.writeFileSync(
      name,
      JSON.stringify(data),
    )
    return true
  } catch (e) {
    printError('WRITE FILE ERROR: ' + e)
    process.exit(1)
  }
}

const readFile = (path, encoding = '') => {
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

// CONSOLE PRINT HELPERS
const print = (msg) => console.log(msg)

const printError = (msg) => console.log(msg)

const printConfig = ({host}) => {
  console.log('WALLET_PUB___________' + process.env['WALLET_PUB'])
  console.log('EPOCH_URL___________' + host)
}

const printBlock = (block) => {
  console
    .log(`Block hash____________________ ${block.hash}
Block height__________________ ${block.height}
State hash____________________ ${block.stateHash}
Miner_________________________ ${block.miner || 'N/A'} 
Time__________________________ ${new Date(block.time)}
Previous block hash___________ ${block.prevHash}
Transactions__________________ ${block.transactions ? block.transactions.length : 0}`)
  if (block.transactions && block.transactions.length)
    printBlockTransactions(block.transactions)
}

const printBlockTransactions = (ts) => ts.forEach(tx => console
  .log(`-->
   Tx hash____________________ ${tx.hash}
   Signatures_________________ ${tx.signatures}
   Sender account_____________ ${tx.tx && tx.tx.sender ? tx.tx.sender : 'N/A'}
   Recipient account__________ ${tx.tx && tx.tx.recipient ? tx.tx.recipient : 'N/A'}
   Amount_____________________ ${tx.tx && tx.tx.amount ? tx.tx.amount : 'N/A'}`))

const printTransaction = (tx) => console
  .log(`Block hash____________________ ${tx.blockHash}
Block height__________________ ${tx.blockHeight}
Signatures____________________ ${tx.signatures}
Sender account________________ ${tx.tx && tx.tx.sender ? tx.tx.sender : 'N/A'}
Recipient account_____________ ${tx.tx && tx.tx.recipient ? tx.tx.recipient : 'N/A'}
Amount________________________ ${tx.tx && tx.tx.amount ? tx.tx.amount : 'N/A'}
TTL___________________________ ${tx.tx && tx.tx.ttl ? tx.tx.ttl : 'N/A'}
`)

const logContractDescriptor = (desc, title = '') => print(`${title}
Contract address________________ ${desc.address}
Transaction hash________________ ${desc.transaction}
Deploy descriptor_______________ ${desc.descPath}`)
//

// ERROR HANDLERS
const logApiError = (error) => printError(`API ERROR: ${error}`)

const handleApiError = async (fn) => {
  try {
    return await fn()
  } catch (e) {
    const response = e.response
    logApiError(response && response.data ? response.data.reason : e)
  }
}

const unknownCommandHandler = (program) => (execCommands = []) => {
  const cmd = program.args[0]

  if (isExecCommand(cmd, execCommands)) return

  console.log('Invalid command: %s\nSee --help for a list of available commands.', cmd)
  program.help()
}
//

// WALLET HELPERS
const generateSecureWallet = async (name, {output, password}) => {
  password = password || await promptPasswordAsync()
  const {pub, priv} = Crypto.generateSaveWallet(password)

  const data = [
    [path.join(output, name), priv],
    [path.join(output, `${name}.pub`), pub]
  ]

  data.forEach(([path, data]) => {
    fs.writeFileSync(path, data)
    print(`Wrote ${path}`)
  })
}

const generateSecureWalletFromPrivKey = async (name, priv, {output, password}) => {
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
    fs.writeFileSync(path, data)
  })

  console.log(`
    Wallet saved
    Wallet address________________ ${Crypto.aeEncodeKey(keys.publicKey)}
    Wallet path___________________ ${__dirname + '/' + name}
  `)
}

const getWalletByPathAndDecrypt = async (path, password) => {
  const privBinaryKey = fs.readFileSync(path)
  const pubBinaryKey = fs.readFileSync(`${path}.pub`)

  if (!password || typeof password !== 'string' || !password.length) password = await promptPasswordAsync()

  const decryptedPriv = Crypto.decryptPrivateKey(password, privBinaryKey)
  const decryptedPub = Crypto.decryptPubKey(password, pubBinaryKey)

  return {
    priv: decryptedPriv.toString('hex'),
    pub: `ak$${Crypto.encodeBase58Check(decryptedPub)}`
  }
}

const promptPasswordAsync = async () => {
  return new Promise(
    (resolve, reject) => {
      prompt.start()
      prompt.get(
        PROMPT_SCHEMA,
        (err, res) => {
          if (err) reject(err)
          if (!res || !res.password) {
            reject({message: 'Password required'})
          }
          resolve(res.password)
        }
      )
    }
  )
}
//

// UTILS
const initExecCommands = (program) => (cmds) => cmds.forEach(({name, desc}) => program.command(name, desc))

const isExecCommand = (cmd, commands) => commands.find(({name}) => cmd === name)

const checkPref = (hash, hashType) => {
  if (hash.length < 3 || hash.indexOf('$') === -1)
    throw new Error(`Invalid input, likely you forgot to escape the $ sign (use \\$)`)

  if (hash.slice(0, 3) !== hashType + '$') {
    let msg
    switch (hashType) {
      case HASH_TYPES.transaction:
        msg = 'Invalid transaction hash, it should be like: th$....'
        break
      case HASH_TYPES.block:
        msg = 'Invalid block hash, it should be like: bh$....'
        break
      case HASH_TYPES.account:
        msg = 'Invalid account address, it should be like: ak$....'
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
  logApiError,
  promptPasswordAsync,
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
  getCmdFromArguments,
  readFile,
  writeFile,
  HASH_TYPES
}
