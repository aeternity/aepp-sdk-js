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

const height = client => async () => (await client.api.getTop()).height

const awaitHeight = client => async (h, {interval = 5000, attempts = 12} = {}) => {
  const heightFn = height(client)
  async function probe (resolve, reject, left) {
    try {
      const current = await heightFn()
      if (current >= h) {
        resolve(current)
      } else if (attempts > 0) {
        setTimeout(() => probe(resolve, reject, left - 1), interval)
      } else {
        reject(Error(`Giving up after ${attempts * interval}ms`))
      }
    } catch (e) {
      reject(e)
    }
  }

  return new Promise((resolve, reject) => probe(resolve, reject, attempts))
}

const poll = client => async (th, { blocks = 10, interval = 5000 } = {}) => {
  const heightFn = height(client)
  const max = await heightFn() + blocks

  async function probe (resolve, reject) {
    try {
      const { transaction } = await client.api.getTx(th, { txEncoding: 'json' })
      if (transaction.blockHeight !== -1) {
        resolve(transaction)
      } else {
        if (await heightFn() < max) {
          setTimeout(() => probe(resolve, reject), interval)
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
