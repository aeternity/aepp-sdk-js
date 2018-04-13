#!/usr/bin/env node

/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

const url = require('url')
const program = require('commander')
const {AeternityClient, Crypto} = require('../')
const {HttpProvider} = AeternityClient.providers

const wallet = {
  priv: process.env['WALLET_PRIV'],
  pub: process.env['WALLET_PUB']
}

function spend (receiver, amount, {host}) {
  const node = url.parse(host)
  const client = new AeternityClient(new HttpProvider(node.hostname, node.port, {secured: node.protocol === 'https:'}))

  client.base.spend(receiver, parseInt(amount), wallet).then(({tx_hash}) => {
    console.log(`Waiting for ${tx_hash} to be mined...`)
    return client.tx.waitForTransaction(tx_hash)
  })
}

program.version ('0.1.0')

program
  .command('spend <receiver> <amount>')
  .option('-h, --host [host]', 'Node to connect to', 'http://localhost:3013')
  .action(spend)

program.parse (process.argv)
if (program.args.length === 0) program.help ()
