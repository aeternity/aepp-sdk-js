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
const fs = require('fs')

const {
  initClient,
  printError,
  getCmdFromAguments,
  unknownCommandHandler,
  handleApiError
} = require('./utils')

const WALLET_KEY_PAIR = JSON.parse(process.env['WALLET_KEYS'])

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')
  .option('-I, --init [state]', 'Arguments to contructor function')
  .option('-G --gas [gas]', 'Amount of gas to deploy the contract', 40000000)

program
  .command('call <desc_path> <fn>')
  .description('Execute a function of the contract')
  .action(async (path, dn, ...arguments) => {})

program
  .command('deploy <contract_path>')
  .description('Execute a function of the contract')
  .action(async (path, cmd) => await deploy(path, cmd.parent))

program.on('command:*', () => unknownCommandHandler(program)())

program.parse(process.argv)
if (program.args.length === 0) program.help()

async function deploy (path, {host, gas, init}) {
  // Deploy a contract to the chain and create a deploy descriptor
  // with the contract informations that can be use to invoke the contract
  // later on.
  //   The generated descriptor will be created in the same folde of the contract
  // source file. Multiple deploy of the same contract file will generate different
  // deploy descriptor
  try {
    const code = fs.readFileSync(path, 'utf-8')
    const client = await initClient(host, WALLET_KEY_PAIR)
    await handleApiError(
      async () => {
        const contract = await client.contractCompile(code, {gas})
        console.log('after compile')
        console.log(contract)
        console.log('---------------------')
        const descr = await contract.deploy({initState: init})
        console.log('after deploy')
        console.log(descr)
        console.log('---------------------')
      }
    )
  } catch (e) {
    printError(e.message)
  }
}

const call = async (descr, fn) => {
  // TODO
}
