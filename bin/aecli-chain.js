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

const {initClient, printBlock, unknownCommandHandler, handleApiError} = require('./utils')
const program = require('commander')

program
  .option('-H, --host [hostname]', 'Node to connect to', 'https://sdk-testnet.aepps.com')
  .option('-L --limit [playlimit]', 'Limit for play command', 10)

program
  .command('top')
  .description('Get top of Chain')
  .action(async (cmd) => await top(cmd.parent))

program
  .command('version')
  .description('Get Epoch version')
  .action(async (cmd) => await version(cmd.parent))

program
  .command('mempool')
  .description('Get mempool of Chain')
  .action(async (cmd) => await mempool(cmd.parent))

program
  .command('play')
  .description('Real-time block monitoring')
  .action(async (cmd) => await play(cmd.parent))

// HANDLE UNKNOWN COMMAND
program.on('command:*', () => unknownCommandHandler(program)())

program.parse(process.argv)
if (program.args.length === 0) program.help()

async function version ({host}) {
  try {
    const client = await initClient(host)

    await handleApiError(async () => {
      const {version} = await client.api.getVersion()
      console.log(`Epoch node version____________  ${version}`)
    })
  } catch (e) {
    console.error(e.message)
  }
}

async function top ({host}) {
  try {
    const client = await initClient(host)

    await handleApiError(
      async () => printBlock(await client.api.getTop())
    )
  } catch (e) {
    console.error(e.message)
  }
}

async function mempool ({host}) {
  try {
    const client = await initClient(host)

    await handleApiError(async () => {
      const mempool = await client.mempool()
      console.log(mempool)
    })
  } catch (e) {
    console.error(e.message)
  }
}

async function play ({host, limit}) {
  limit = parseInt(limit)
  try {
    const client = await initClient(host)

    await handleApiError(async () => {
      const top = await client.api.getTop()
      printBlock(top)
      await playWithLimit(--limit, top.prevHash, client)
    })
  } catch (e) {
    console.error(e.message)
  }
}

async function playWithLimit (limit, blockHash, client) {
  if (!limit) return

  let block = await client.api.getBlockByHash(blockHash)
  setTimeout(async () => {
    console.log('<------------------------------------------->')
    printBlock(block)
    console.log('<------------------------------------------->')
    await playWithLimit(--limit, block.prevHash, client)
  }, 1000)
}