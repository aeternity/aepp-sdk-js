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
const R = require('ramda')

const {
  initClient,
  print,
  printError,
  getCmdFromArguments,
  unknownCommandHandler,
  logContractDescriptor,
  handleApiError,
  readFile,
  writeFile
} = require('./utils')

const WALLET_KEY_PAIR = JSON.parse(process.env['WALLET_KEYS'])

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')
  .option('-I, --init [state]', 'Arguments to contructor function')
  .option('-G --gas [gas]', 'Amount of gas to deploy the contract', 40000000)

program
  .command('call <desc_path> <fn> [args...]')
  .description('Execute a function of the contract')
  .action(async (path, fn, args) => await call(path, fn, args))

program
  .command('deploy <contract_path>')
  .description('Execute a function of the contract')
  .action(async (path, ...arguments) => await deploy(path, getCmdFromArguments(arguments)))

program.on('command:*', () => unknownCommandHandler(program)())

program.parse(R.init(process.argv))
if (program.args.length === 0) program.help()

async function deploy (path, {host, gas, init}) {
  // Deploy a contract to the chain and create a deploy descriptor
  // with the contract informations that can be use to invoke the contract
  // later on.
  //   The generated descriptor will be created in the same folde of the contract
  // source file. Multiple deploy of the same contract file will generate different
  // deploy descriptor
  try {
    const contractFile = readFile(path, 'utf-8')
    const client = await initClient(host, WALLET_KEY_PAIR)

    await handleApiError(
      async () => {
        // `contractCompile` takes a raw Sophia contract in string form and sends it
        // off to the node for bytecode compilation. This might in the future be done
        // without talking to the node, but requires a bytecode compiler
        // implementation directly in the SDK.
        const contract = await client.contractCompile(contractFile, {gas})
        // Invoking `deploy` on the bytecode object will result in the contract
        // being written to the chain, once the block has been mined.
        // Sophia contracts always have an `init` method which needs to be invoked,
        // even when the contract's `state` is `unit` (`()`). The arguments to
        // `init` have to be provided at deployment time and will be written to the
        // block as well, together with the contract's bytecode.
        const deployDescriptor = await contract.deploy({initState: init})

        // Write contractDescriptor to file
        delete deployDescriptor.call
        const descPath = `${R.last(path.split('/'))}.deploy.${deployDescriptor.owner.slice(3)}.json`
        const contractDescriptor = R.merge({
          descPath,
          source: contractFile,
          bytecode: contract.bytecode,
          abi: 'sophia',
        }, deployDescriptor)

        writeFile(
          descPath,
          JSON.stringify(contractDescriptor)
        )

        // Log contract descriptor
        logContractDescriptor(contractDescriptor, 'Contract was successfully deployed')
      }
    )
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }
}

async function call (path, fn, args) {
  if (!path || !fn) {
    program.outputHelp()
    process.exit(1)
  }
  try {
    const descr = JSON.parse(require('./' + path))
    const client = await initClient(program.host, WALLET_KEY_PAIR)


    await handleApiError(
      async () => {
        args = args.length ? `(${args.join(' ')})` : ''
        const callResult = await client.contractCall(descr.bytecode, descr.abi, descr.address, fn, {args})
        // The execution result, if successful, will be an AEVM-encoded result
        // value. Once type decoding will be implemented in the SDK, this value will
        // not be a hexadecimal string, anymore.
        print(callResult)
      }
    )
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }
}

