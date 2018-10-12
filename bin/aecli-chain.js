#!/usr/bin/env node
// # æternity CLI `chain` file
//
// This script initialize all `chain` command's
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
//
// Also we need `esm` package to handle `ES imports`
const program = require('commander')

require = require('esm')(module/*, options*/) //use to handle es6 import/export
const utils = require('./utils/index')
const { Chain } = require('./commands')

// # Initialize `options`
program
  .option('--host [hostname]', 'Node to connect to', utils.constant.EPOCH_URL)
  .option('--internalUrl [internal]', 'Node to connect to(internal)', utils.constant.EPOCH_INTERNAL_URL)
  .option('-L --limit [playlimit]', 'Limit for play command', utils.constant.PLAY_LIMIT)
  .option('-P --height [playToHeight]', 'Play to selected height')
  .option('-f --force', 'Ignore epoch version compatibility check')
  .option('--json', 'Print result in json format')

// ## Initialize `top` command
//
// You can use this command to retrieve `top block` from `epoch`
//
// Example: `aecli chain top`
program
  .command('top')
  .description('Get top of Chain')
  .action(async (...arguments) => await Chain.top(utils.cli.getCmdFromArguments(arguments)))

// ## Initialize `status` command
//
// You can use this command to retrieve `epoch version`
//
// Example: `aecli chain status`
program
  .command('status')
  .description('Get Epoch version')
  .action(async (...arguments) => await Chain.version(utils.cli.getCmdFromArguments(arguments)))

// ## Initialize `mempool` command
//
// You can use this command to retrieve list of `mempool` transaction from `epoch`
//
// Example: `aecli chain mempool`
program
  .command('mempool')
  .description('Get mempool of Chain')
  .action(async (...arguments) => await Chain.mempool(utils.cli.getCmdFromArguments(arguments)))

// ## Initialize `play` command
//
// You can use this command to get list of block by some condition(by `limit` or `height`)
//
// Example: `aecli chain play --limit 10` --> print 10 blocks starting from top
//
// Example: `aecli chain play --height` --> print blocks until reach some height starting from top
program
  .command('play')
  .description('Real-time block monitoring')
  .action(async (...arguments) => await Chain.play(utils.cli.getCmdFromArguments(arguments)))

// Handle unknown command's
program.on('command:*', () => utils.errors.unknownCommandHandler(program)())

// Parse arguments or show `help` if argument's is empty
program.parse(process.argv)
if (program.args.length === 0) program.help()
