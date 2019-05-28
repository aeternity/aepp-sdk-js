#!/usr/bin/env node
// # Simple AE Token Spending Script
//
// This script shows how to use the `Wallet` module from the SDK to send AE to
// other addresses.
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

// We'll need the main client module `Ae` in the `Universal` flavor from the SDK.
const { Universal: Ae } = require('@aeternity/aepp-sdk')
const program = require('commander')

function spend (receiver, amount, { host, debug }) {
  // This code is relatively simple: We create the Ae client asynchronously and
  // invoke the spend method on it. Passing in `process` from nodejs will make
  // the implementation grab the key pair from the `WALLET_PRIV` and
  // `WALLET_PUB` environment variables, respectively.
  Ae({ url: host, debug, process })
    .then(ae => ae.spend(parseInt(amount), receiver))
    .then(tx => console.log('Transaction mined', tx))
    .catch(e => console.log(e.message))
}

// ## Command Line Interface
//
// The `commander` library provides maximum command line parsing convenience.
program.version('0.1.0')

program
  .command('spend <receiver> <amount>')
  .option('-H, --host [hostname]', 'Node to connect to', 'http://localhost:3013')
  .option('--debug', 'Switch on debugging')
  .action(spend)

program.parse(process.argv)
if (program.args.length === 0) program.help()
