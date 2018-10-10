#!/usr/bin/env node
// # æternity CLI `contract` file
//
// This script initialize all `contract` command's
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
// We'll use `commander` for parsing options
// Also we need `esm` package to handle `ES imports`
const program = require('commander')

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const utils = require('./utils/index')
const { Contract } = require('./commands')

// ## Initialize `options`
program
  .option('--host [hostname]', 'Node to connect to', utils.constant.EPOCH_URL)
  .option('--internalUrl [internal]', 'Node to connect to(internal)', utils.constant.EPOCH_INTERNAL_URL)
  .option('-T, --ttl [ttl]', 'Validity of the transaction in number of blocks (default forever)', utils.constant.CONTRACT_TTL)
  .option('-n, --nonce [nonce]', 'Override the nonce that the transaction is going to be sent with')
  .option('-f --force', 'Ignore epoch version compatibility check')
  .option('--json', 'Print result in json format')

// ## Initialize `compile` command
//
// You can use this command to compile your `contract` to `bytecode`
//
// Example: `aecli contract compile ./mycontract.contract`
program
  .command('compile <file>')
  .description('Compile a contract')
  .action(async (file, ...arguments) => await Contract.compile(file, utils.cli.getCmdFromArguments(arguments)))

// ## Initialize `call` command
//
// You can use this command to execute a function of contract
//
// Example: `aecli contract call ./myWalletFile --password testpass ./contractDescriptorFile.json sumFunc int 1 2`
//
// You can preset gas for that call. If not set use default.
//
// Example: `aecli contract call ./myWalletFile --password tstpass ./contractDescriptorFile.json sumFunc int 1 2 --gas 2222222`
program
  .command('call <wallet_path> <desc_path> <fn> <return_type> [args...]')
  .option('-P, --password [password]', 'Wallet Password')
  .option('-G --gas [gas]', 'Amount of gas to call the contract', utils.constant.GAS)
  .description('Execute a function of the contract')
  .action(async (walletPath, path, fn, returnType, args, ...arguments) => await Contract.call(walletPath, path, fn, returnType, args, utils.cli.getCmdFromArguments(arguments)))

// ## Initialize `deploy` command
//
// You can use this command to deploy contract on the chain
//
// Example: `aecli contract deploy ./myWalletFile --password testpass ./contractSourceCodeFile`
//
// You can preset gas and initState for deploy
//
// Example: `aecli contract call ./myWalletFile --password tstpass ./contractDescriptorFile.json sumFunc int 1 2 --gas 2222222 --init state`
program
  .command('deploy <wallet_path> <contract_path>')
  .option('-P, --password [password]', 'Wallet Password')
  .option('-I, --init [state]', 'Deploying contract arguments for constructor function')
  .option('-G --gas [gas]', 'Amount of gas to deploy the contract', utils.constant.GAS)
  .description('Deploy a contract on the chain')
  .action(async (walletPath, path, ...arguments) => await Contract.deploy(walletPath, path, utils.cli.getCmdFromArguments(arguments)))

// Handle unknown command's
program.on('command:*', () => utils.errors.unknownCommandHandler(program)())

// Parse arguments or show `help` if argument's is empty
program.parse(process.argv)
if (program.args.length === 0) program.help()
