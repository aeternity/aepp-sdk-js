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
'use strict'

const program = require('commander')
const { initExecCommands, unknownCommandHandler, printConfig, HOST, INTERNAL_URL } = require('./utils')

const EXECUTABLE_CMD = [
  { name: 'chain', desc: 'Interact with the blockchain' },
  { name: 'inspect', desc: 'Get information on transactions, blocks,...' },
  { name: 'wallet', desc: 'Handle wallet operations' },
  { name: 'contract', desc: 'Compile contracts' },
  // TODO implement oracle module
  // {name: 'oracle', desc: 'Interact with oracles'},
  { name: 'crypto', desc: 'Crypto helpers' }
]

program
  .version(require('../package.json').version)

program
  .command('config')
  .description('Print the client configuration')
  .action((cmd) => printConfig(cmd))
  .option('-H, --host [hostname]', 'Node to connect to', HOST)
  .option('-U, --internalUrl [internal]', 'Node to connect to(internal)', INTERNAL_URL)

// INIT EXEC COMMANDS
initExecCommands(program)(EXECUTABLE_CMD)

// HANDLE UNKNOWN COMMAND
program.on('command:*', () => unknownCommandHandler(program)(EXECUTABLE_CMD))

program
  .parse(process.argv)

if (program.args.length === 0) program.help()
