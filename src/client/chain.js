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

/**
 * General methods which interact with the chain
 */


const height = client => async () => (await client.api.getTop()).height

/**
 * Wait for the chain to reach given height.
 * @param interval -- how often to check
 * @param attempts - how many times to poll
 */
const awaitHeight = client => async (h, { interval = 5000, attempts = 12 } = {}) => {
  const heightFn = height(client)
  async function probe (resolve, reject, left) {
    const _probe = probe // Workaround for Webpack bug
    try {
      const current = await heightFn()
      if (current >= h) {
        resolve(current)
      } else if (left > 0) {
        setTimeout(() => _probe(resolve, reject, left - 1), interval)
      } else {
        reject(Error(`Giving up after ${attempts * interval}ms`))
      }
    } catch (e) {
      reject(e)
    }
  }

  return new Promise((resolve, reject) => probe(resolve, reject, attempts))
}

/**
 * Wait for the a transaction to be mined.
 * @param blocks - how many blocks to wait
 * @param interval - how long between polls
 */
const poll = client => async (th, { blocks = 10, interval = 5000 } = {}) => {
  const heightFn = height(client)
  const max = await heightFn() + blocks

  async function probe (resolve, reject) {
    const _probe = probe // Workaround for Webpack bug
    try {
      const { transaction } = await client.api.getTx(th, { txEncoding: 'json' })
      if (transaction.blockHeight !== -1) {
        resolve(transaction)
      } else {
        if (await heightFn() < max) {
          setTimeout(() => _probe(resolve, reject), interval)
        } else {
          reject(Error(`Giving up after ${blocks} blocks mined`))
        }
      }
    } catch (e) {
      reject(e)
    }
  }

  return new Promise((resolve, reject) => probe(resolve, reject))
}

function create (client) {
  return Object.freeze({
    height: height(client),
    poll: poll(client),
    awaitHeight: awaitHeight(client)
  })
}

export default {
  create
}
