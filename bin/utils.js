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

// The `prompt` library provides concealed input of passwords.
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

async function initClient (url, keypair) {
  return await Cli({url, process, keypair})
}

function printConfig ({host}) {
  const epochUrl = host
  console.log('WALLET_PUB___________' + process.env['WALLET_PUB'])
  console.log('EPOCH_URL___________' + epochUrl)
}

function printBlock (block) {
  console.log(`
Block hash____________________ ${block.hash}
Block height__________________ ${block.height}
State hash____________________ ${block.stateHash}
Miner_________________________ ${block.miner}
Time__________________________ ${new Date(block.time)}
Previous block hash___________ ${block.prevHash}
Transactions__________________ ${block.transactions || 0}
`)
}

function logApiError ({response}) {
  console.log(response.data)
}

async function handleApiError (fn) {
  try {
    await fn()
  } catch (e) {
    logApiError(e)
  }
}

async function generateSecureWallet (name, {output, password}) {
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

async function getWalletByPathAndDecrypt(name, {password}) {
  //TODO
  return name
}

async function promptPasswordAsync () {
  return new Promise(
    (resolve, reject) => {
      prompt.start()
      prompt.get(
        promptSchema,
        (err, {password}) => {
          if (err) reject(err)
          resolve(password)
        }
      )
    }
  )
}

module.exports = {
  printBlock,
  initClient,
  printConfig,
  logApiError,
  promptPasswordAsync,
  getWalletByPathAndDecrypt,
  handleApiError,
  generateSecureWallet
}
