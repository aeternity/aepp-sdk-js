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

import stampit from '@stamp/it'
import * as R from 'ramda'
import Account from '../account'

let sequence = 0

async function sign (data) {
  return this.post('sign', data)
}

async function address () {
  return this.post('address')
}

async function receive ({data, source}) {
  const {id, method, params} = data
  const methods = {
    address: async () => this.address(),
    sign: async (data) => this.sign(data)
  }

  function error () {
    return Promise.resolve(`Error: No such method ${method}`)
  }

  source.postMessage({jsonrpc: '2.0', id, result: await R.apply(methods[method] || error, params)}, '*')
}

function registerAccountProxy (window) {
  this.accountProxy = this.receive.bind(this)
  window.addEventListener('message', this.accountProxy, false)
}

function unRegisterAccountProxy (window) {
  window.removeEventListener('message', this.accountProxy)
}

const PostMessageAccount = stampit(Account, {
  init ({target, window}) {
    const callbacks = {}

    function receive ({data}) {
      const {result, id} = data

      if (callbacks[id]) {
        callbacks[id].resolve(result)
        delete callbacks[id]
      }
    }

    this.post = (method, ...params) => {
      const ret = new Promise((resolve, reject) => {
        callbacks[sequence] = {resolve, reject}
      })

      target.postMessage({jsonrpc: '2.0', id: sequence, method, params}, '*')
      sequence++

      return ret
    }

    window.addEventListener('message', receive, false)
  },
  methods: {address, sign}
})

const PostMessageAccountReceiver = stampit(Account, {
  methods: {receive, registerAccountProxy, unRegisterAccountProxy}
})

export {PostMessageAccount, PostMessageAccountReceiver}
