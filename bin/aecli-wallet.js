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
const program = require('commander')
const {initClient} = require('./utils')

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')

program
  .command('spend <receiver> <amount>')
  .description('Create a transaction to another wallet')
  .action(async (receiver, amount, cmd) => await spend(receiver, amount, cmd.parent))

program.parse(process.argv)
if (program.args.length === 0) program.help()

async function spend (receiver, amount, host) {
  // the implementation grab the key pair from the `WALLET_PRIV` and
  // `WALLET_PUB` environment variables, respectively.
  try {
    const client = await initClient(host)
    const tx = await client.spend(parseInt(amount), receiver)
    console.log('Transaction mined', tx)
  } catch (e) {

  }
}