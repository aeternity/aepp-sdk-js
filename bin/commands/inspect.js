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

//    _____                           _
//   |_   _|                         | |
//     | |  _ __  ___ _ __   ___  ___| |_
//     | | | '_ \/ __| '_ \ / _ \/ __| __|
//    _| |_| | | \__ \ |_) |  __/ (__| |_
//   |_____|_| |_|___/ .__/ \___|\___|\__|
//                   | |
//                   |_|

import * as R from 'ramda'
import path from 'path'
import {
  handleApiError,
  initClient,
  print,
  printError,
  printBlock,
  printTransaction,
  printName,
  checkPref,
  readJSONFile,
  printContractDescr,
  getBlock,
  HASH_TYPES
} from '../utils'

async function getBlockByHash (hash, {host, internalUrl}) {
  try {
    checkPref(hash, [HASH_TYPES.block, HASH_TYPES.micro_block])
    const client = await initClient(host, null, internalUrl)
    await handleApiError(
      async () => printBlock(
        await getBlock(hash)(client)
      )
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getTransactionByHash (hash, {host, internalUrl}) {
  try {
    checkPref(hash, HASH_TYPES.transaction)
    const client = await initClient(host, null, internalUrl)
    await handleApiError(
      async () => printTransaction(await client.tx(hash))
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getAccountByHash (hash, {host, internalUrl}) {
  try {
    checkPref(hash, HASH_TYPES.account)
    const client = await initClient(host, null, internalUrl)
    await handleApiError(
      async () => print('Account balance___________ ' + (await client.api.getAccountByPubkey(hash)).balance)
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getBlockByHeight (height, {host, internalUrl}) {
  height = parseInt(height)
  try {
    const client = await initClient(host, null, internalUrl)

    await handleApiError(
      async () => printBlock(await client.api.getKeyBlockByHeight(height))
    )
  } catch (e) {
    printError(e.message)
  }
}

async function getName (name, {host, internalUrl}) {
  try {
    if (R.last(name.split('.')) !== 'aet') throw new Error('AENS TLDs must end in .aet')
    const client = await initClient(host, null, internalUrl)

    printName(Object.assign(await client.api.getNameEntryByName(name), {status: 'CLAIMED'}))
  } catch (e) {
    if (e.response && e.response.status === 404) {
      printName({status: 'AVAILABLE'})
      process.exit(1)
    }
    printError(e.message)
  }
}

async function getContractByDescr (descrPath, {host, internalUrl}) {
  try {
    const descriptor = await readJSONFile(path.resolve(process.cwd(), descrPath))
    const client = await initClient(host, null, internalUrl)

    await handleApiError(
      async () => {
        printContractDescr(descriptor)
        printTransaction(await client.tx(descriptor.transaction))
      }
    )
  } catch (e) {
    printError(e.message)
  }
}

export const Inspect = {
  getName,
  getAccountByHash,
  getBlockByHash,
  getBlockByHeight,
  getContractByDescr,
  getTransactionByHash
}