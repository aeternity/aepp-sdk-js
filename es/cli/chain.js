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

import { initClient, printBlock } from './utils'

export async function version () {
  try {
    const client = await initClient('https://sdk-testnet.aepps.com')
    const {version} = await client.api.getVersion()
    console.log(`Epoch node version____________  ${version}`)
  } catch (e) {
    console.error(e.message)
  }
}

export async function top () {
  try {
    const client = await initClient('https://sdk-testnet.aepps.com')
    printBlock(await client.api.getTop())
  } catch (e) {
    console.error(e.message)
  }
}

export async function mempool () {
  try {
    const client = await initClient('https://sdk-testnet.aepps.com')
    const mempool = await client.mempool()
    console.log(mempool)
  } catch (e) {
    console.error(e.message)
  }
}

export async function play (interval = 3000) {
  try {
    const client = await initClient('https://sdk-testnet.aepps.com')
    await poll(client, interval)
  } catch (e) {
    console.error(e.message)
  }
}

async function poll (client, interval) {
  let currentTop = {}

  const intervalId = setInterval(
    async () => {
      try {
        let top = await client.api.getTop()
        if (currentTop.height === top.height) return

        console.log('<------------------------------------------->')
        printBlock(top)
        console.log('<------------------------------------------->')

        currentTop = top
      } catch (e) {
        console.error(e.message)
        clearInterval(intervalId)
      }
    },
    interval
  )
}