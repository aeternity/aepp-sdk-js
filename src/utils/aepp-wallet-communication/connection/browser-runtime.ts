/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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
 * Browser runtime connector module
 *
 * This is the complement to
 * {@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection}.
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime
 * @export BrowserRuntimeConnection
 * @example import { BrowserRuntimeConnection } from '@aeternity/aepp-sdk'
 */

import WalletConnection from '.'
import { getBrowserAPI } from '../helpers'
import {
  RpcConnectionError,
  AlreadyConnectedError,
  NoWalletConnectedError
} from '../../errors'
import { Message } from '../rpc/rpc-client'

interface Port {
  name: string
  disconnect: Function
  error: object
  onDisconnect: {
    addListener: Function
    removeListener: Function
  }
  onMessage: {
    addListener: Function
    removeListener: Function
    hasListeners?: Function
    hasListener: Function
  }
  postMessage: Function
}

/**
 * BrowserRuntimeConnection
 * Handle browser runtime communication
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime
 * @param params - Initializer object
 * @return BrowserRuntimeConnection
 */
export default class BrowserRuntimeConnection implements WalletConnection {
  debug: boolean
  port: Port
  connectionInfo: {
    id?: string
    description?: string
    origin?: string
  }

  handler: (msg: Message, source: string) => void

  constructor ({ connectionInfo = {}, port, debug = false }: {
    connectionInfo: {
      id?: string
      description?: string
      origin?: string
    }
    port: Port
    debug: boolean
  }) {
    if (getBrowserAPI().runtime == null) throw new RpcConnectionError('Runtime is not accessible in your environment')
    this.debug = debug
    this.connectionInfo = connectionInfo
    this.port = port ?? getBrowserAPI().runtime.connect(connectionInfo.id ?? undefined)
  }

  /**
   * Disconnect
   */
  disconnect (): void {
    this.port.disconnect()
  }

  /**
   * Connect
   * @param onMessage - Message handler
   * @param onDisconnect - trigger when runtime connection in closed
   */
  connect (
    onMessage: (msg?: any, source?: any) => void,
    onDisconnect?: (msg?: any, client?: any) => void): void {
    if (this.isConnected()) throw new AlreadyConnectedError('You already connected')
    this.handler = (msg, source) => {
      if (this.debug) console.log('Receive message: ', msg)
      onMessage(msg, source)
    }
    this.port.onMessage.addListener(this.handler)
    this.port.onDisconnect.addListener(() => {
      typeof onDisconnect === 'function' && onDisconnect({}, this)
      this.port.disconnect()
    })
  }

  /**
   * Send message
   * @param msg - Message
   */
  sendMessage (msg: MessageEvent): void {
    if (this.port == null) throw new NoWalletConnectedError('You dont have connection. Please connect before')
    if (this.debug) console.log('Send message: ', msg)
    this.port.postMessage(msg)
  }

  /**
   * Check if connected
   * @return {Boolean} Is connected
   */
  isConnected (): boolean {
    return typeof this.port.onMessage.hasListeners === 'function' ? this.port.onMessage.hasListeners() : this.port.onMessage.hasListener(this.handler)
  }
}
