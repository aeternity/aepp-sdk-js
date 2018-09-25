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

//   _____ _           _
//  / ____| |         (_)
// | |    | |__   __ _ _ _ __
// | |    | '_ \ / _` | | '_ \
// | |____| | | | (_| | | | | |
//  \_____|_| |_|\__,_|_|_| |_|

const program = require('commander')

const {unknownCommandHandler, getCmdFromArguments, HOST, INTERNAL_URL} = require('./utils')
require = require('esm')(module/*, options*/) //use to handle es6 import/export
const {Chain} = require('./commands')

program
  .option('-H, --host [hostname]', 'Node to connect to', HOST)
  .option('-U, --internalUrl [internal]', 'Node to connect to(internal)', INTERNAL_URL)
  .option('-L --limit [playlimit]', 'Limit for play command', 10)
  .option('-P --height [playToHeight]', 'Play to selected height')

program
  .command('top')
  .description('Get top of Chain')
  .action(async (...arguments) => await Chain.top(getCmdFromArguments(arguments)))

program
  .command('version')
  .description('Get Epoch version')
  .action(async (...arguments) => await Chain.version(getCmdFromArguments(arguments)))

program
  .command('mempool')
  .description('Get mempool of Chain')
  .action(async (...arguments) => await Chain.mempool(getCmdFromArguments(arguments)))

program
  .command('play')
  .description('Real-time block monitoring')
  .action(async (...arguments) => await Chain.play(getCmdFromArguments(arguments)))

// HANDLE UNKNOWN COMMAND
program.on('command:*', () => unknownCommandHandler(program)())

program.parse(process.argv)
if (program.args.length === 0) program.help()