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

//    _____                           _
//   |_   _|                         | |
//     | |  _ __  ___ _ __   ___  ___| |_
//     | | | '_ \/ __| '_ \ / _ \/ __| __|
//    _| |_| | | \__ \ |_) |  __/ (__| |_
//   |_____|_| |_|___/ .__/ \___|\___|\__|
//                   | |
//                   |_|

const {unknownCommandHandler} = require('./utils')
const program = require('commander')

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const {Inspect} = require('./commands')

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')

program
  .command('account <hash>')
  .description('The address of the account to inspect (eg: ak$...)')
  .action(async (hash, cmd) => await Inspect.getAccountByHash(hash, cmd.parent))

program
  .command('block <hash>')
  .description('The block hash to inspect (eg: bh$...)')
  .action(async (hash, cmd) => await Inspect.getBlockByHash(hash, cmd.parent))

program
  .command('transaction <hash>')
  .description('The transaction hash to inspect (eg: th$...)')
  .action(async (hash, cmd) => await Inspect.getTransactionByHash(hash, cmd.parent))

program
  .command('deploy <descriptor>')
  .description('The contract deploy descriptor to inspect')
  .action(async (descriptor, cmd) => await Inspect.getContractByDescr(descriptor, cmd.parent))

program
  .command('height <height>')
  .description('The height of the chain to inspect (eg:14352)')
  .action(async (height, cmd) => await Inspect.getBlockByHeight(height, cmd.parent))

program
  .command('name <name>')
  .description('The name to inspect (eg: mydomain.aet)')
  .action(async (name, cmd) => await Inspect.getName(name, cmd.parent))

// HANDLE UNKNOWN COMMAND
program.on('command:*', () => unknownCommandHandler(program)())

program.parse(process.argv)
if (program.args.length === 0) program.help()
