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

//   _____            _                  _
//  / ____|          | |                | |
// | |     ___  _ __ | |_ _ __ __ _  ___| |_ ___
// | |    / _ \| '_ \| __| '__/ _` |/ __| __/ __|
// | |___| (_) | | | | |_| | | (_| | (__| |_\__ \
//  \_____\___/|_| |_|\__|_|  \__,_|\___|\__|___/

const program = require('commander')

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const utils = require('./utils/index')
const { Contract } = require('./commands')

program
  .option('--host [hostname]', 'Node to connect to', utils.constant.EPOCH_URL)
  .option('--internalUrl [internal]', 'Node to connect to(internal)', utils.constant.EPOCH_INTERNAL_URL)
  .option('-T, --ttl [ttl]', 'Validity of the transaction in number of blocks (default forever)', utils.constant.CONTRACT_TTL)
  .option('-n, --nonce [nonce]', 'Override the nonce that the transaction is going to be sent with')
  .option('-f --force', 'Ignore epoch version compatibility check')
  .option('--json', 'Print result in json format')


program
  .command('compile <file>')
  .description('Compile a contract')
  .action(async (file, ...arguments) => await Contract.compile(file, utils.cli.getCmdFromArguments(arguments)))

program
  .command('call <wallet_path> <desc_path> <fn> <return_type> [args...]')
  .option('-P, --password [password]', 'Wallet Password')
  .option('-G --gas [gas]', 'Amount of gas to call the contract', utils.constant.GAS)
  .description('Execute a function of the contract')
  .action(async (walletPath, path, fn, returnType, args, ...arguments) => await Contract.call(walletPath, path, fn, returnType, args, utils.cli.getCmdFromArguments(arguments)))

program
  .command('deploy <wallet_path> <contract_path>')
  .option('-P, --password [password]', 'Wallet Password')
  .option('-I, --init [state]', 'Deploying contract arguments for constructor function')
  .option('-G --gas [gas]', 'Amount of gas to deploy the contract', utils.constant.GAS)
  .description('Deploy a contract on the chain')
  .action(async (walletPath, path, ...arguments) => await Contract.deploy(walletPath, path, utils.cli.getCmdFromArguments(arguments)))

// HANDLE UNKNOWN COMMAND
program.on('command:*', () => utils.errors.unknownCommandHandler(program)())

program.parse(process.argv)
if (program.args.length === 0) program.help()
