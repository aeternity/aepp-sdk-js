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

import program from 'commander'
import Cli from '../ae/cli'

function version () {
  Cli({url: 'https://sdk-testnet.aepps.com'})
    .then(async client => {
      const version = await client.api.getVersion()
      console.log(version)
    }).catch(err => console.log(err))
}

function top () {
  Cli({url: 'https://sdk-testnet.aepps.com'})
    .then(async client => {
      const top = await client.api.getTop()
      console.log(top)
    }).catch(err => console.log(err))
}

function mempool () {
  Cli({url: 'https://sdk-testnet.aepps.com'})
    .then(async client => {
      const pool = await client.mempool()
      console.log(pool)
    }).catch(err => console.log(err.message))
}

function play () {

  Cli({url: 'https://sdk-testnet.aepps.com'})
    .then(async client => {
        await poll(client)
    }).catch(err => console.log(err.message))
}

async function poll (client, height, interval = 3000) {
  let currentTop = {}
  const intervalId = setInterval(async () => {
    try {
      let top = await client.api.getTop()
      if (currentTop.height === top.height) return;

      console.log('<------------------------------------------->')
      console.log(
        Object.assign(top, { transactions: 0 })
      );
      console.log('<------------------------------------------->')
      currentTop = top
    } catch (e) {
      console.error(e.message);
      clearInterval(intervalId)
    }
  }, interval)
}

function init () {
  program
    .command('version')
    .action(version)

  program
    .command('play')
    .action(play)

  program
    .command('mempool')
    .action(mempool)

  program
    .command('top')
    .action(top)
}

export default init