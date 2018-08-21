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

export default function initChainCommands(chain) {
  chain.command( 'top',
    {
      desc: 'Get top of Chain',
      callback: async (options) => await top(options)
    }
  );

  chain
    .command('version',
      {
        desc: 'Get Epoch version',
        callback: async ( options ) => await version(options)
      }
    );

  chain
    .command('play',
      {
        desc: 'Real-time block monitoring',
        callback: async (options) => await play(options)
      });

  chain
    .command('mempool',
      {
        desc: 'Get mempool of Chain',
        callback: async (options) => await mempool(options)
      });
}

async function version ({host}) {
  try {
    const client = await initClient(url)
    const {version} = await client.api.getVersion()
    console.log(`Epoch node version____________  ${version}`)
  } catch (e) {
    console.error(e.message)
  }
}

async function top ({host}) {
  try {
    const client = await initClient(url)
    printBlock(await client.api.getTop())
  } catch (e) {
    console.error(e.message)
  }
}

async function mempool ({host}) {
  try {
    const client = await initClient(url)
    const mempool = await client.mempool()
    console.log(mempool)
  } catch (e) {
    console.error(e.message)
  }
}

async function play ({host, limit}) {
  try {
    const client = await initClient(host)
    // await poll(client, interval)
    console.log(client)
    let top = await client.api.getTop()
    await playWithLimit(--limit, top.prevHash)
  } catch (e) {
    console.error(e.message)
  }
}

async function playWithLimit(limit, blockHash) {
  if (!limit) return;

  let block = await client.api.getBlockByHash(blockHash);

  console.log('<------------------------------------------->')
  printBlock(top)
  console.log('<------------------------------------------->')

  await playWithLimit(--limit, block.prevHash);
}

function poll (client, interval) {
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