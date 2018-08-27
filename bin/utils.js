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
      conform: function (value) {
        return true
      }
    }
  }
}

const initClient = async (url, keypair) => {
  return await Cli({url, process, keypair})
}

// CONSOLE PRINT HELPERS
const printConfig = ({host}) => {
  console.log('WALLET_PUB___________' + process.env['WALLET_PUB'])
  console.log('EPOCH_URL___________' + host)
}

const printBlock = (block) => console.log(`
Block hash____________________ ${block.hash}
Block height__________________ ${block.height}
State hash____________________ ${block.stateHash}
Miner_________________________ ${block.miner}
Time__________________________ ${new Date(block.time)}
Previous block hash___________ ${block.prevHash}
Transactions__________________ ${block.transactions || 0}
`)
//

// ERROR HANDLERS
const logApiError = (response) => console.log(`API ERROR: ${response}`)

const handleApiError = async (fn) => {
  try {
    await fn()
  } catch (e) {
    logApiError(e)
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
    console.log(`Wrote ${path}`)
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

const getWalletByPathAndDecrypt = async (name, password) => {
  if (!password || typeof password !== 'string' || !password.length) password = await promptPasswordAsync()

  const privBinaryKey = fs.readFileSync(name)
  const pubBinaryKey = fs.readFileSync(`${name}.pub`)

  if (!privBinaryKey) throw new Error('Key not found')

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
    throw new Error(`Invalid input, likely you forgot to escape the $ sign (use \\$)`);

  if (hash.slice(0, 3) !== hashType + '$') {
    let msg;
    switch (hashType) {
      case HASH_TYPES.transaction:
        msg = 'Invalid transaction hash, it should be like: th$....'
        break;
      case HASH_TYPES.block:
        msg = 'Invalid block hash, it should be like: bh$....'
        break;
      case HASH_TYPES.account:
        msg = 'Invalid account address, it should be like: ak$....'
        break;
    }
    throw new Error(msg);
  }

}

module.exports = {
  printBlock,
  initClient,
  printConfig,
  logApiError,
  promptPasswordAsync,
  getWalletByPathAndDecrypt,
  handleApiError,
  generateSecureWallet,
  initExecCommands,
  unknownCommandHandler,
  generateSecureWalletFromPrivKey,
  checkPref,
  HASH_TYPES
}
