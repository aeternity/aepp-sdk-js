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

const { default: Ae, Wallet, Contract } = require('@aeternity/aepp-sdk')
const program = require('commander')
const fs = require('fs')

program
  .version('0.1.0')
  .arguments('<infile> <function> [args...]')
  .option('-i, --init [state]', 'Arguments to contructor function')
  .option('-H, --host [hostname]', 'Node to connect to', 'http://localhost:3013')
  .option('--debug', 'Switch on debugging')
  .action(exec)
  .parse(process.argv)

function exec (infile, fn, args) {
  console.log(infile, fn, args)

  const keypair = {
    priv: process.env['WALLET_PRIV'],
    pub: process.env['WALLET_PUB']
  }

  if (!keypair.pub || !keypair.priv) {
    throw Error('Environment variables WALLET_PRIV and WALLET_PUB need to be set')
  }

  if (!infile || !fn) {
    program.outputHelp()
    process.exit(1)
  }

  const code = fs.readFileSync(infile, 'utf-8')

  Ae.create(program.host, { debug: program.debug }).then(client => {
    return Contract.create(client, { wallet: Wallet.create(client, keypair) }).compile(code)
  }).then(bytecode => {
    console.log(`Obtained bytecode ${bytecode.bytecode}`)
    return bytecode.deploy({ initState: program.init })
  }).then(deployed => {
    console.log(`Contract deployed at ${deployed.address}`)
    return deployed.call(fn, { args: args.join(' ') })
  }).then(value => {
    console.log(`Execution result: ${value}`)
  }).catch(e => console.log(e.message))
}
