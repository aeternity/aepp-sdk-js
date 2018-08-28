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



const {
  initClient,
  printBlock,
  unknownCommandHandler,
  handleApiError,
  print,
  printError,
  getCmdFromArguments
} = require('./utils')
const program = require('commander')

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')
  .option('-L --limit [playlimit]', 'Limit for play command', 10)

program
  .command('top')
  .description('Get top of Chain')
  .action(async (...arguments) => await top(getCmdFromArguments(arguments)))

program
  .command('version')
  .description('Get Epoch version')
  .action(async (...arguments) => await version(getCmdFromArguments(arguments)))

program
  .command('mempool')
  .description('Get mempool of Chain')
  .action(async (...arguments) => await mempool(getCmdFromArguments(arguments)))

program
  .command('play')
  .description('Real-time block monitoring')
  .action(async (...arguments) => await play(getCmdFromArguments(arguments)))

// HANDLE UNKNOWN COMMAND
program.on('command:*', () => unknownCommandHandler(program)())

program.parse(process.argv)
if (program.args.length === 0) program.help()

async function version ({host}) {
  try {
    const client = await initClient(host)

    await handleApiError(async () => {
      const {version} = await client.api.getVersion()
      print(`Epoch node version____________  ${version}`)
    })
  } catch (e) {
    printError(e.message)
  }
}

async function top ({host}) {
  try {
    const client = await initClient(host)

    await handleApiError(
      async () => printBlock(await client.api.getTop())
    )
  } catch (e) {
    printError(e.message)
  }
}

async function mempool ({host}) {
  try {
    const client = await initClient(host)

    await handleApiError(async () => {
      const mempool = await client.mempool()
      print('Memmpool______________ ' + mempool)
    })
  } catch (e) {
    printError(e.message)
  }
}

async function play ({host, limit}) {
  limit = parseInt(limit)
  try {
    const client = await initClient(host)

    await handleApiError(async () => {
      const top = await client.api.getTop()
      printBlock(top)
      print('>>>>>>>>>')
      await playWithLimit(--limit, top.prevHash, client)
    })
  } catch (e) {
    printError(e.message)
  }
}

async function playWithLimit (limit, blockHash, client) {
  if (!limit) return

  let block = await client.api.getBlockByHash(blockHash)
  setTimeout(async () => {
    printBlock(block)
    print('>>>>>>>>>')
    await playWithLimit(--limit, block.prevHash, client)
  }, 1000)
}