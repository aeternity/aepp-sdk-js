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
const R = require('ramda')

const {
  getCmdFromArguments,
  unknownCommandHandler,
} = require('./utils')
require = require('esm')(module/*, options*/) //use to handle es6 import/export
const {Contract} = require('./commands')

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')
  .option('-I, --init [state]', 'Deploying contract arguments for constructor function')
  .option('-G --gas [gas]', 'Amount of gas to deploy the contract', 40000000)

program
  .command('call <desc_path> <fn> <return_type> [args...]')
  .description('Execute a function of the contract')
  .action(async (path, fn, returnType, args, ...arguments) => await Contract.call(path, fn, returnType, args, getCmdFromArguments(arguments)))

program
  .command('deploy <contract_path>')
  .description('Deploy a contract on the chain')
  .action(async (path, ...arguments) => await Contract.deploy(path, getCmdFromArguments(arguments)))

program.on('command:*', () => unknownCommandHandler(program)())

program.parse(R.init(process.argv))
if (program.args.length === 0) program.help()