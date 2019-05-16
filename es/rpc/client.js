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
 * RPC client module
 * @module @aeternity/aepp-sdk/es/rpc/client
 * @export RpcClient
 * @example import RpcClient from '@aeternity/aepp-sdk/es/rpc/client'
 */

import stampit from '@stamp/it'
import AsyncInit from '../utils/async-init'
import * as R from 'ramda'

function post (method) {
  return function (...params) {
    return this.post(method, params)
  }
}

/**
 * RPC client Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/rpc/client
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Object} [options.parent=window.parent] - IFrame parent window
 * @param {Object} [options.self=window] - IFrame window
 * @return {Object} RPC client
 * @example RpcClient()
 */
const RpcClient = stampit(AsyncInit, {
  async init ({ parent = window.parent, self = window }, { stamp }) {
    if (parent === self) {
      throw new Error('rpc client: Can\'t send messages to itself')
    }

    let sequence = 0
    const callbacks = {}

    function receive ({ data }) {
      if (typeof data !== 'object' || data.type === 'webpackOk') {
        return
      }

      const { result: { resolve, reject }, id } = data

      if (callbacks[id]) {
        if (resolve) {
          callbacks[id].resolve(resolve)
        } else if (reject) {
          callbacks[id].reject(reject)
        }
        delete callbacks[id]
      }
    }

    this.post = (method, params) => {
      const ret = new Promise((resolve, reject) => {
        callbacks[sequence] = { resolve, reject }
      })

      parent.postMessage({ jsonrpc: '2.0', id: sequence, method, params, session: this.session }, '*')
      sequence++

      return ret
    }

    const handler = receive
    self.addEventListener('message', handler, false)
    this.destroyClient = () =>
      self.removeEventListener('message', handler, false)

    this.session = await this.post('hello')
  },
  props: {
    handler: null
  },
  methods: {},
  composers ({ stamp, composables }) {
    // Combine Ae and Contract methods
    const methods = [
      ...(R.path(['compose', 'deepConfiguration', 'Ae', 'methods'], stamp) || []),
      ...(R.path(['compose', 'deepConfiguration', 'Contract', 'methods'], stamp) || [])
    ]
    const rpcMethods = R.fromPairs(methods.map(m => [m, post(m)]))
    if (stamp.compose.methods) {
      // remove signTransaction and getNetworkId from AEPP instance, let's go it through RPC
      ['signTransaction', 'getNetworkId'].forEach(m => delete stamp.compose.methods[m])
    }
    stamp.compose.methods = Object.assign(rpcMethods, stamp.compose.methods)
  }
})

export default RpcClient
