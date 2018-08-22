#!/usr/bin/env node
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
const program = require('commander')
const {initClient} = require('./utils')

let WALLET_KEY_PAIR
const walletPath = process.argv[2]

// Grab WALLET_PATH and try to read and decrypt keypair. IF success -> remove wallet path from argv and take it commander.js
initWallet(walletPath)
  .then(() => {
    process.argv = process.argv.filter((e, i) => i !== 2)

    program.parse(process.argv)
    if (program.args.length === 0) program.help()

  })
  .catch(e => console.log(e.message))

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')
  .usage('<wallet-name> [options] [commands]')

program
  .command('spend <receiver> <amount>')
  .description('Create a transaction to another wallet')
  .action(async (receiver, amount, cmd) => await spend(receiver, amount, cmd.parent))

program
  .command('balance')
  .description('Get wallet balance')
  .action(async (cmd) => await getBalance(cmd.parent))

program
  .command('address')
  .description('Get wallet address')
  .action(async (cmd) => await getAddress(cmd.parent))

program
  .command('create')
  .description('Create a secure wallet')
  .action(async (cmd) => await spend(cmd.parent))

program
  .command('name', 'Name lifecycle api')
  .command('contract', 'Contract lifecycle api')

async function spend (receiver, amount, host) {
  try {
    const client = await initClient(host, WALLET_KEY_PAIR)
    const tx = await client.spend(parseInt(amount), receiver)
    console.log('Transaction mined', tx)
  } catch (e) {
    console.log(e.message)
  }
}

async function getBalance ({host}) {
  try {
    const client = await initClient(host, WALLET_KEY_PAIR)
    await handleApiError(async () => {
      console.log('Your balance is: ' + (await client.balance(WALLET_KEY_PAIR.pub)))
    })
  } catch (e) {
    console.log(e.message)
  }
}

async function getAddress ({host}) {
  try {
    console.log(WALLET_KEY_PAIR.pub)
  } catch (e) {
    console.log(e.message)
  }
}

//HELPERS
async function initWallet (walletPath) {
  const pass = '123' // prompt pass
  WALLET_KEY_PAIR = await getWalletByPathAndDecrypt(walletPath, pass) || 123
}

async function getWalletByPathAndDecrypt (path, password) {
  // TODO
}

async function createSecureWallet (name, password) {
  // TODO
}