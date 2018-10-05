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

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const utils = require('./utils/index')
const { Wallet } = require('./commands')

program
  .option('-H, --host [hostname]', 'Node to connect to', utils.constant.EPOCH_URL)
  .option('-U, --internalUrl [internal]', 'Node to connect to(internal)', utils.constant.EPOCH_INTERNAL_URL)
  .option('-P, --password [password]', 'Wallet Password')
  .option('-f --force', 'Ignore epoch version compatibility check')
  .option('--json ', 'Print result in json format')

program
  .command('spend <wallet_path> <receiver> <amount>')
  .option('-T, --ttl [ttl]', 'Validity of the spend transaction in number of blocks (default forever)', utils.constant.ACCOUNT_TX_TTL)
  .description('Create a transaction to another wallet')
  .action(async (walletPath, receiver, amount, ...arguments) => await Wallet.spend(walletPath, receiver, amount, utils.cli.getCmdFromArguments(arguments)))

program
  .command('balance <wallet_path>')
  .description('Get wallet balance')
  .action(async (walletPath, ...arguments) => await Wallet.getBalance(walletPath, utils.cli.getCmdFromArguments(arguments)))

program
  .command('address [wallet_path]')
  .option('-K, --privateKey', 'Print private key')
  .description('Get wallet address')
  .action(async (walletPath, ...arguments) => await Wallet.getAddress(walletPath, utils.cli.getCmdFromArguments(arguments)))

program
  .command('create <wallet_path>')
  .option('-O, --output [output]', 'Output directory', '.')
  .description('Create a secure wallet')
  .action(async (walletPath, ...arguments) => await Wallet.createSecureWallet(walletPath, utils.cli.getCmdFromArguments(arguments)))

program
  .command('save <wallet_path> <privkey>')
  .option('-O, --output [output]', 'Output directory', '.')
  .description('Save a private keys string to a password protected file wallet')
  .action(async (walletPath, priv, ...arguments) => await Wallet.createSecureWalletByPrivKey(walletPath, priv, utils.cli.getCmdFromArguments(arguments)))

// HANDLE UNKNOWN COMMAND
program.on('command:*', () => utils.errors.unknownCommandHandler(program)())

program.parse(process.argv)
if (program.args.length === 0) program.help()
