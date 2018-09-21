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

import {
  initClient,
  handleApiError,
  printError,
  print,
  printBlock,
  getBlock
} from '../utils'

async function version ({host, internalUrl}) {
  try {
    const client = await initClient(host, null, internalUrl)
    await handleApiError(async () => {
      const {nodeVersion} = await client.api.getStatus()
      print(`Epoch node version____________  ${nodeVersion}`)
    })
  } catch (e) {
    printError(e.message)
  }
}

async function top ({host, internalUrl}) {
  try {
    const client = await initClient(host, null, internalUrl)
    await handleApiError(
      async () => printBlock(await client.api.getTopBlock())
    )
  } catch (e) {
    console.log(e)
    printError(e.message)
  }
}

async function mempool ({host, internalUrl}) {
  try {
    const client = await initClient(host, null, internalUrl)

    await handleApiError(async () => {
      const {pendingTransactionsCount} = await client.api.getStatus()

      print('Mempool______________________________')
      print('Pending Transactions Count___________ ' + pendingTransactionsCount)
      // TODO getPendingTransactions API doesn't work
      // if (mempool && mempool.length) {
      //   mempool.forEach(tx => {
      //     print('--------------------->')
      //     print(tx.tx)
      //     print('--------------------->')
      //   })
      // }
    })
  } catch (e) {
    printError(e.message)
  }
}

async function play ({host, limit, internalUrl}) {
  limit = parseInt(limit)
  try {
    const client = await initClient(host, null, internalUrl)

    await handleApiError(async () => {
      const top = await client.api.getTopBlock()
      printBlock(top)
      await playWithLimit(--limit, top.prevHash, client)
    })
  } catch (e) {
    printError(e.message)
  }
}

export async function playWithLimit (limit, blockHash, client) {
  if (!limit) return

  let block = await getBlock(blockHash)(client)

  setTimeout(async () => {
    print('>>>>>>>>>')
    printBlock(block)
    await playWithLimit(--limit, block.prevHash, client)
  }, 1000)
}

export const Chain = {
  mempool,
  top,
  version,
  play
}