/* eslint-disable no-undef */
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
 * Browser window Post Message connector module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection}.
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message
 * @export BrowserWindowMessageConnection
 * @example import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'
 */
import stampit from '@stamp/it'
import WalletConnection from '.'
import { v4 as uuid } from 'uuid'
import { MESSAGE_DIRECTION } from '../schema'

/**
 * Check if connected
 * @function isConnected
 * @instance
 * @rtype () => Boolean
 * @return {Boolean} Is connected
 */
function isConnected () {
  return this.listener
}

/**
 * Connect
 * @function connect
 * @instance
 * @rtype (onMessage: Function) => void
 * @param {Function} onMessage - Message handler
 * @return {void}
 */
function connect (onMessage) {
  const origin = this.origin
  const receiveDirection = this.receiveDirection
  const debug = this.debug
  if (this.listener) throw new Error('You already connected')

  this.listener = (msg, source) => {
    if (!msg || typeof msg.data !== 'object') return
    if (origin && origin !== msg.origin) return
    if (debug) console.log('Receive message: ', msg)
    if (msg.data.type) {
      if (msg.data.type !== receiveDirection) return
      onMessage(msg.data.data, msg.origin, msg.source)
    } else {
      onMessage(msg.data, msg.origin, msg.source)
    }
  }
  this.subscribeFn(this.listener)
}

/**
 * Disconnect
 * @function disconnect
 * @instance
 * @rtype () => void
 * @return {void}
 */
function disconnect () {
  if (!this.listener) throw new Error('You dont have connection. Please connect before')
  this.unsubscribeFn(this.listener)
  this.listener = null
}

/**
 * Send message
 * @function sendMessage
 * @instance
 * @rtype (msg: Object) => void
 * @param {Object} msg - Message
 * @return {void}
 */
function sendMessage (msg) {
  const message = this.sendDirection ? { type: this.sendDirection, data: msg } : msg
  if (this.debug) console.log('Send message: ', message)
  this.postFn(message)
}

/**
 * BrowserWindowMessageConnection
 * @function
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message
 * @rtype Stamp
 * @param {Object} [params={}] - Initializer object
 * @param {Object} [params.target=window.parent] - Target window for message
 * @param {Object} [params.self=window] - Host window for message
 * @param {Object} [params.origin] - Origin of receiver
 * @param {Object} [params.sendDirection] - Optional field for wrapping messages in additional structure({ type: 'to_aepp' || 'to_waellet', data }).Used for handling messages netween content script and page
 * @param {Object} [params.receiveDirection='to_aepp'] - Optional(default: 'to_aepp') field for unwrapping messages from additional structure({ type: 'to_aepp' || 'to_waellet', data }).Used for handling messages netween content script and page
 * @param {Object} [params.connectionInfo={}] - Connection info object
 * @param {Boolean} [params.debug=false] - Debug flag
 * @return {Object}
 */
export const BrowserWindowMessageConnection = stampit({
  init ({ connectionInfo = {}, target = window.parent, self = window, origin, sendDirection, receiveDirection = MESSAGE_DIRECTION.to_aepp, debug = false } = {}) {
    if (sendDirection && !Object.keys(MESSAGE_DIRECTION).includes(sendDirection)) throw new Error(`sendDirection must be one of [${Object.keys(MESSAGE_DIRECTION)}]`)
    if (!Object.keys(MESSAGE_DIRECTION).includes(receiveDirection)) throw new Error(`receiveDirection must be one of [${Object.keys(MESSAGE_DIRECTION)}]`)
    this.connectionInfo = { ...{ id: uuid() }, ...connectionInfo }

    this.origin = origin
    this.debug = debug
    this.sendDirection = sendDirection
    this.receiveDirection = receiveDirection
    this.subscribeFn = (listener) => self.addEventListener('message', listener, false)
    this.unsubscribeFn = (listener) => self.removeEventListener('message', listener, false)
    this.postFn = (msg) => target.postMessage(msg, this.origin || '*')
    if (!this.connectionInfo.id) throw new Error('ID required.')
  },
  methods: { connect, sendMessage, disconnect, isConnected }
}, WalletConnection)

export default BrowserWindowMessageConnection
