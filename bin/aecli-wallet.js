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
const R = require('ramda')

const {
  initExecCommands,
  unknownCommandHandler,
  printError,
  getCmdFromArguments,
  HOST,
  INTERNAL_URL
} = require('./utils')
require = require('esm')(module/*, options*/) //use to handle es6 import/export
const {Wallet} = require('./commands')

// EXEC COMMANDS LIST
const EXECUTABLE_CMD = [
  {name: 'name', desc: 'Name lifecycle api'},
  {name: 'contract', desc: 'Contract lifecycle api'}
]

let WALLET_PATH
let WALLET_PASSWORD
let WALLET_NAME

// Grab WALLET_PATH and try to read and decrypt keypair. IF success -> remove wallet path from argv and take it commander.js
initWallet()
  .then(() => {
    // Prevent parsing wallet-path --> issue with arguments parsing in sub-commands
    program._args = []

    // SET WALLET DATA TO PROCESS.ENV
    process.env['WALLET_DATA'] = JSON.stringify({
      pass: WALLET_PASSWORD,
      path: WALLET_PATH,
      name: WALLET_NAME
    })

    // remove wallet_name from argv
    process.argv = process.argv.filter((e, i) => i !== 2)

    program.parse(process.argv)

    if (program.args.length === 0) program.help()
  })
  .catch(e => printError(e.message))

program
  .option('-O, --output [output]', 'Output directory', '.')
  .option('-T, --ttl [ttl]', 'Validity of the spend transaction in number of blocks (default forever)', Number.MAX_SAFE_INTEGER)
  .usage('<wallet-name> [options] [commands]')

// INIT EXECUTABLE COMMANDS
initExecCommands(program)(EXECUTABLE_CMD)

program
  .command('spend <receiver> <amount>')
  .description('Create a transaction to another wallet')
  .action(async (receiver, amount, ...arguments) => await Wallet.spend(receiver, amount, getCmdFromArguments(arguments)))

program
  .command('balance')
  .description('Get wallet balance')
  .action(async (...arguments) => await Wallet.getBalance(getCmdFromArguments(arguments)))

program
  .command('address')
  .description('Get wallet address')
  .action(async (...arguments) => await Wallet.getAddress(getCmdFromArguments(arguments)))

program
  .command('create')
  .description('Create a secure wallet')
  .action(async (...arguments) => await Wallet.createSecureWallet(WALLET_NAME, getCmdFromArguments(arguments)))

program
  .command('save <privkey>')
  .description('Save a private keys string to a password protected file wallet')
  .action(async (priv, ...arguments) => await Wallet.createSecureWalletByPrivKey(WALLET_NAME, priv, getCmdFromArguments(arguments)))

program.on('command:*', () => unknownCommandHandler(program)(EXECUTABLE_CMD))

//HELPERS
async function initWallet () {
  return new Promise((resolve, reject) => {
    program
      .arguments('<wallet_path> [command]')
      .option('-P, --password [password]', 'Wallet Password')
      .action(async (path, command, cmd) => {
        WALLET_NAME = R.last(path.split('/'))
        WALLET_PATH = path
        WALLET_PASSWORD = program.password

        // Prevent grab wallet keys for create save commands
        if (!command || command === 'create' || command === 'save') resolve()

        // Add host option if it is no sub-command (commander issue with parsing options in sub-command)
        if (!EXECUTABLE_CMD.find(cmd => cmd.name === command)) {
          program
            .option('-H, --host [hostname]', 'Node to connect to', HOST)
            .option('-U, --internalUrl [internal]', 'Node to connect to(internal)', INTERNAL_URL)
        }
        resolve()
      })
      .parse(process.argv)

    if (program.args.length === 0) program.help()
  })
}
