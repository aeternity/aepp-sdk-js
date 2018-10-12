#!/usr/bin/env node
// # æternity CLI `inspect` file
//
// This script initialize all `inspect` commands
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

require = require('esm')(module/*, options */) // use to handle es6 import/export
const utils = require('./utils/index')
const { Inspect } = require('./commands')

// ## Initialize `options`
program
  .option('--host [hostname]', 'Node to connect to', utils.constant.EPOCH_URL)
  .option('--internalUrl [internal]', 'Node to connect to(internal)', utils.constant.EPOCH_INTERNAL_URL)
  .option('-f --force', 'Ignore epoch version compatibility check')
  .option('--json', 'Print result in json format')

// ## Initialize `inspect` command
//
// You can use this command to get info about account, block, transaction or name
//
// Example: `aecli inspect testName.aet` --> get info about AENS `name`
//
// Example: `aecli inspect ak_134defawsgf34gfq4f` --> get info about `account`
//
// Example: `aecli inspect kh_134defawsgf34gfq4f` --> get info about `key block` by block `hash`
//
// Example: `aecli inspect mh_134defawsgf34gfq4f` --> get info about `micro block` by block `hash`
//
// Example: `aecli inspect 1234` --> get info about `block` by block `height`
//
// Example: `aecli inspect th_asfwegfj34234t34t` --> get info about `transaction` by transaction `hash`
program
  .arguments('<hash>')
  .description('Hash or Name to inspect (eg: ak_..., mk_..., name.aet)')
  .action(async (hash, cmd) => await Inspect.inspect(hash, cmd))

// Parse arguments or show `help` if argument's is empty
program.parse(process.argv)
if (program.args.length === 0) program.help()
