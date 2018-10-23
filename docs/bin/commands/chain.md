





  

```js
#!/usr/bin/env node

```







# æternity CLI `chain` file

This script initialize all `chain` function


  

```js
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

import { initClient } from '../utils/cli'
import { handleApiError } from '../utils/errors'
import { printBlock, print, printBlockTransactions, printError, printUnderscored } from '../utils/print'
import { getBlock } from '../utils/helpers'


```







## Retrieve `Epoch` version


  

```js
async function version (options) {
  try {

```







Initialize `Ae`


  

```js
    const client = await initClient(options)

```







Call `getStatus` API and print it


  

```js
    await handleApiError(async () => {
      const { nodeVersion } = await client.api.getStatus()
      print(`Epoch node version____________  ${nodeVersion}`)
    })
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }
}


```







## Retrieve `TOP` block


  

```js
async function top (options) {
  const { json } = options
  try {

```







Initialize `Ae`


  

```js
    const client = await initClient(options)

```







Call `getTopBlock` API and print it


  

```js
    await handleApiError(
      async () => printBlock(await client.topBlock(), json)
    )
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }
}


```







## Retrieve `mempool`


  

```js
async function mempool (options) {
  const { json } = options
  try {

```







Initialize `Ae`


  

```js
    const client = await initClient(options)

    await handleApiError(async () => {

```







Get `mempool` from `API`


  

```js
      const { transactions } = await client.mempool()

      printUnderscored('Mempool', '')
      printUnderscored('Pending Transactions Count', transactions.length)

```







If we have `transaction's` in `mempool` print them


  

```js
      if (transactions && transactions.length) {
        printBlockTransactions(transactions, json)
      }
    })
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }
}


```







## This function `Play`(print all block) from `top` block to some condition(reach some `height` or `limit`)


  

```js
async function play (options) {
  let { height, limit, json } = options
  limit = parseInt(limit)
  height = parseInt(height)
  try {
    const client = await initClient(options)

    await handleApiError(async () => {

```







Get top block from `Epoch`. It is a start point for play.


  

```js
      const top = await client.topBlock()

      if (height && height > parseInt(top.height)) {
        printError('Height is bigger then height of top block')
        process.exit(1)
      }

      printBlock(top, json)


```







Play by `height` or by `limit` using `top` block as start point


  

```js
      height
        ? await playWithHeight(height, top.prevHash)(client, json)
        : await playWithLimit(--limit, top.prevHash)(client, json)
    })
  } catch (e) {
    printError(e.message)
    process.exit(1)
  }
}


```







# Play by `limit`


  

```js
function playWithLimit (limit, blockHash) {
  return async (client, json) => {
    if (!limit) return

    let block = await getBlock(blockHash)(client)

    setTimeout(async () => {
      printBlock(block, json)
      await playWithLimit(--limit, block.prevHash)(client, json)
    }, 1000)
  }
}


```







# Play by `height`


  

```js
function playWithHeight (height, blockHash) {
  return async (client, json) => {
    let block = await getBlock(blockHash)(client)
    if (parseInt(block.height) < height) return

    setTimeout(async () => {
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


```




