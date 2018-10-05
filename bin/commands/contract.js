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

import * as R from 'ramda'
import path from 'path'

import { readFile, readJSONFile, writeFile } from '../utils/helpers'
import { initClient } from '../utils/cli'
import { handleApiError } from '../utils/errors'
import { printError, print, logContractDescriptor } from '../utils/print'
import { getWalletByPathAndDecrypt } from '../utils/account'

export async function compile (file, options) {
  try {
    const code = readFile(path.resolve(process.cwd(), file), 'utf-8')
    if (!code) throw new Error('Contract file not found')

    const client = await initClient(options)

    await handleApiError(async () => {
      const contract = await client.contractCompile(code)
      print(`Contract bytecode:
      ${contract.bytecode}`)
    })
  } catch (e) {
    printError(e.message)
  }
}

async function deploy (walletPath, contractPath, options) {
  const { gas, init, ttl, password, json } = options
  // Deploy a contract to the chain and create a deploy descriptor
  // with the contract informations that can be use to invoke the contract
  // later on.
  //   The generated descriptor will be created in the same folde of the contract
  // source file. Multiple deploy of the same contract file will generate different
  // deploy descriptor
  try {
    const keypair = await getWalletByPathAndDecrypt(walletPath, { password })
    const client = await initClient(R.merge(options, { keypair }))
    const contractFile = readFile(path.resolve(process.cwd(), contractPath), 'utf-8')

    await handleApiError(
      async () => {
        // `contractCompile` takes a raw Sophia contract in string form and sends it
        // off to the node for bytecode compilation. This might in the future be done
        // without talking to the node, but requires a bytecode compiler
        // implementation directly in the SDK.
        const contract = await client.contractCompile(contractFile, { gas })
        // Invoking `deploy` on the bytecode object will result in the contract
        // being written to the chain, once the block has been mined.
        // Sophia contracts always have an `init` method which needs to be invoked,
        // even when the contract's `state` is `unit` (`()`). The arguments to
        // `init` have to be provided at deployment time and will be written to the
        // block as well, together with the contract's bytecode.
        const deployDescriptor = await contract.deploy({ initState: init, options: { ttl } })

        // Write contractDescriptor to file
        const descPath = `${R.last(contractPath.split('/'))}.deploy.${deployDescriptor.owner.slice(3)}.json`
        const contractDescriptor = R.merge({
          descPath,
          source: contractFile,
          bytecode: contract.bytecode,
          abi: 'sophia'
        }, deployDescriptor)

        writeFile(
          descPath,
          JSON.stringify(contractDescriptor)
        )

        // Log contract descriptor
        logContractDescriptor(contractDescriptor, 'Contract was successfully deployed', json)
      }
    )
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }
}

async function call (walletPath, descrPath, fn, returnType, args, options) {
  const { password } = options
  if (!path || !fn || !returnType) {
    program.outputHelp()
    process.exit(1)
  }
  try {
    const keypair = await getWalletByPathAndDecrypt(walletPath, { password })
    const client = await initClient(R.merge(options, { keypair }))
    const descr = await readJSONFile(path.resolve(process.cwd(), descrPath))

    await handleApiError(
      async () => {
        args = args.filter(arg => arg !== '[object Object]')
        args = args.length ? `(${args.join(',')})` : '()'
        const callResult = await client.contractCall(descr.bytecode, descr.abi || 'sophia', descr.address, fn, { args, options })
        // The execution result, if successful, will be an AEVM-encoded result
        // value. Once type decoding will be implemented in the SDK, this value will
        // not be a hexadecimal string, anymore.
        print('Contract address_________ ' + descr.address)
        print('Gas price________________ ' + R.path(['result', 'gasPrice'])(callResult))
        print('Gas used_________________ ' + R.path(['result', 'gasUsed'])(callResult))
        print('Return value (encoded)___ ' + R.path(['result', 'returnValue'])(callResult))
        // Decode result
        const { type, value } = await callResult.decode(returnType)
        print('Return value (decoded)___ ' + value)
        print('Return remote type_______ ' + type)
      }
    )
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }
}

export const Contract = {
  compile,
  deploy,
  call
}
