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
import uuid from 'uuid/v4'

function createSession () {
  const id = uuid()
  this.rpcSessions[id] = { id }
  return id
}

function hello () {
  return Promise.resolve(this.createSession())
}

async function receive ({ data, origin, source }) {
  if (typeof data !== 'object' || data.jsonrpc !== '2.0') return

  const { id, method, params, session } = data

  function error () {
    return Promise.reject(Error(`Error: No such method ${method}`))
  }

  R.call(
    (this.rpcMethods[method] || error).bind(this),
    { params, session: this.rpcSessions[session], origin }
  ).then(result => {
    const resolve = typeof result === 'object' && Object.prototype.toString.call(result) === '[object Object]'
      ? Object.entries(result)
        .filter(([key, value]) => typeof value !== 'function')
        .reduce((p, [key, value]) => ({ ...p, [key]: value }), {})
      : result
    source.postMessage({ jsonrpc: '2.0', id, result: { resolve } }, '*')
  }).catch(error => {
    source.postMessage({ jsonrpc: '2.0', id, result: { reject: error.message } }, '*')
  })
}

const RpcServer = stampit({
  init ({ self = window }) {
    const handler = this.receive.bind(this)
    self.addEventListener('message', handler, false)
    this.destroyServer = () =>
      self.removeEventListener('message', handler, false)
  },
  methods: {
    receive,
    createSession
  },
  props: {
    rpcSessions: {}
  },
  deepProps: {
    rpcMethods: { hello }
  }
})

export default RpcServer
