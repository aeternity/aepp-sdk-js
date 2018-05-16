/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

// const {AeSubscription} = require('./subscriptions')

import { w3cwebsocket as WebSocket } from 'websocket'

// let WebSocket
// if (process.browser || typeof window !== 'undefined') {
//   WebSocket = window.WebSocket
// } else {
//   WebSocket = require('websocket').w3cwebsocket
// }

const Oracles = require('./services/oracles')

class WebSocketProvider {
  constructor (host, port, endpoint = 'websocket') {
    this._ws = new WebSocket(`ws://${host}:${port}/${endpoint}`)

    this.subscriptions = []
    this.connectionListeners = []

    this._ws.onmessage = (message) => {
      let data = JSON.parse(message.data)
      this.subscriptions.forEach(
        (sub) => {
          if (sub.matches(data)) {
            sub.update(data)
          }
        }
      )
    }

    // New block mining events are so fundamental that the subscription
    // should be active by default
    this._ws.onopen = () => {
      // register to mining event
      this.sendJson({
        'target': 'chain',
        'action': 'subscribe',
        'payload': {'type': 'new_block'}
      })

      this.connectionListeners.forEach(
        (listener) => {
          listener.onOpen()
        })
    }

    this.oracles = new Oracles(this)
  }

  addSubscription (subscription) {
    this.subscriptions.push(subscription)
  }

  removeSubscription (subscription) {
    this.subscriptions = this.subscriptions.filter(x => {
      return x !== subscription
    })
  }

  sendJson (data) {
    let stringified = JSON.stringify(data)
    this._ws.send(stringified)
  }

  addConnectionListener (listener) {
    this.connectionListeners.push(listener)
  }

  removeConnectionListener (listener) {
    this.connectionListeners = this.connectionListeners.filter(x => {
      return x !== listener
    })
  }
}

export default WebSocketProvider
