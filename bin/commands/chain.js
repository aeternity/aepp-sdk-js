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

import { initClient } from '../utils/cli'
import { handleApiError } from '../utils/errors'
import { printBlock, print, printBlockTransactions, printError } from '../utils/print'
import { getBlock } from '../utils/helpers'

async function version (options) {
  try {
    const client = await initClient(options)
    await handleApiError(async () => {
      const {nodeVersion} = await client.api.getStatus()
      print(`Epoch node version____________  ${ nodeVersion }`)
    })
  } catch (e) {
    printError(e.message)
  }
}

async function top (options) {
  const { json } = options
  try {
    const client = await initClient(options)
    await handleApiError(
      async () => printBlock(await client.api.getTopBlock(), json)
    )
  } catch (e) {
    printError(e.message)
  }
}

async function mempool (options) {
  const { json } = options
  try {
    const client = await initClient(options)

    await handleApiError(async () => {
      const {transactions} = await client.mempool()

      print('Mempool______________________________')
      print('Pending Transactions Count___________ ' + transactions.length)
      if (transactions && transactions.length) {
        printBlockTransactions(transactions, json)
      }
    })
  } catch (e) {
    printError(e.message)
  }
}

async function play (options) {
  let { height, limit, json } = options
  limit = parseInt(limit)
  height = parseInt(height)
  try {
    const client = await initClient(options)

    await handleApiError(async () => {
      const top = await client.api.getTopBlock()

      if (height && height > parseInt(top.height)) {
        printError('Height is bigger then height of top block')
        process.exit(1)
      }

      printBlock(top, json)

      height ?
        await playWithHeight(height, top.prevHash)(client, json) :
        await playWithLimit(--limit, top.prevHash)(client, json)
    })
  } catch (e) {
    printError(e.message)
  }
}

function playWithLimit (limit, blockHash) {
  return async (client, json) => {
    if (!limit) return

    let block = await getBlock(blockHash)(client)

    setTimeout(async () => {
      print('>>>>>>>>>')
      printBlock(block, json)
      await playWithLimit(--limit, block.prevHash)(client, json)
    }, 1000)
  }
}

function playWithHeight (height, blockHash) {
  return async (client, json) => {

    let block = await getBlock(blockHash)(client)
    if (parseInt(block.height) < height) return

    setTimeout(async () => {
      print('>>>>>>>>>')
      printBlock(block, json)
      await playWithHeight(height, block.prevHash)(client, json)
    }, 1000)
  }
}

export const Chain = {
  mempool,
  top,
  version,
  play
}
