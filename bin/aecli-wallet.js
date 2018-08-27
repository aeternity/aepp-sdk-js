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

//   __          __   _ _      _
//   \ \        / /  | | |    | |
//    \ \  /\  / /_ _| | | ___| |_ ___
//     \ \/  \/ / _` | | |/ _ \ __/ __|
//      \  /\  / (_| | | |  __/ |_\__ \
//       \/  \/ \__,_|_|_|\___|\__|___/
//
//

const program = require('commander')

const {
  initClient,
  generateSecureWallet,
  handleApiError,
  getWalletByPathAndDecrypt,
  initExecCommands,
  unknownCommandHandler,
  generateSecureWalletFromPrivKey,
  checkPref,
  printError,
  printTransaction,
  HASH_TYPES
} = require('./utils')

// EXEC COMMANDS LIST
const EXECUTABLE_CMD = [
  {name: 'name', desc: 'Name lifecycle api'},
  {name: 'contract', desc: 'Contract lifecycle api'}
]

let WALLET_KEY_PAIR
let WALLET_NAME

// Grab WALLET_PATH and try to read and decrypt keypair. IF success -> remove wallet path from argv and take it commander.js
initWallet()
  .then(() => {
    // SET KEYPAIR TO PROCESS.ENV
    process.env['WALLET_KEYS'] = JSON.stringify(WALLET_KEY_PAIR)

    // remove wallet_name from argv
    process.argv = process.argv.filter((e, i) => i !== 2)

    program.parse(process.argv)
    if (program.args.length === 0) program.help()
  })
  .catch(e => printError(e.message))

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')
  .option('-O, --output [output]', 'Output directory', '.')
  .option('-T, --ttl [ttl]', 'Validity of the spend transaction in number of blocks (default forever)', Number.MAX_SAFE_INTEGER)
  .usage('<wallet-name> [options] [commands]')

// INIT EXECUTABLE COMMANDS
initExecCommands(program)(EXECUTABLE_CMD)

program
  .command('spend <receiver> <amount>')
  .description('Create a transaction to another wallet')
  .action(async (receiver, amount, cmd) => await spend(receiver, amount, Object.assign({}, cmd, cmd.parent)))

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
  .action(async (cmd) => await createSecureWallet(WALLET_NAME, Object.assign({}, cmd, cmd.parent)))

program
  .command('save <privkey>')
  .description('Save a private keys string to a password protected file wallet')
  .action(async (priv, cmd) => await createSecureWalletByPrivKey(WALLET_NAME, priv, Object.assign({}, cmd, cmd.parent)))

program.on('command:*', () => unknownCommandHandler(program)(EXECUTABLE_CMD))

async function spend (receiver, amount, {host, ttl}) {
  ttl = parseInt(ttl)
  try {
    checkPref(receiver, HASH_TYPES.account)
    const client = await initClient(host, WALLET_KEY_PAIR)
    const tx = await client.spend(parseInt(amount), receiver, {ttl})
    print('Transaction mined')
    printTransaction(tx)
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
    const client = await initClient(host, WALLET_KEY_PAIR)
    await handleApiError(
      async () => console.log('Your address is: ' + await client.address())
    )
  } catch (e) {
    console.log(e.message)
  }
}

async function createSecureWallet (name, {output, password}) {
  try {
    await generateSecureWallet(name, {output, password})
  } catch (e) {
    console.log(e.message)
  }
}

async function createSecureWalletByPrivKey (name, priv, {output, password}) {
  try {
    await generateSecureWalletFromPrivKey(name, priv, {output, password})
  } catch (e) {
    console.log(e.message)
  }
}

//HELPERS
async function initWallet () {
  return new Promise((resolve, reject) => {
    program
      .arguments('<wallet_name> [command]')
      .option('-P, --password [password]', 'Wallet Password')
      .action(async (name, command, cmd) => {
        WALLET_NAME = name

        // Prevent grab wallet keys and create new wallet
        if (command === 'create' || command === 'save') resolve()

        try {
          WALLET_KEY_PAIR = await getWalletByPathAndDecrypt(name, cmd.password)
        } catch (e) {
          reject(e)
        }
        resolve()
      })
      .parse(process.argv)

    if (program.args.length === 0) program.help()
  })
}
