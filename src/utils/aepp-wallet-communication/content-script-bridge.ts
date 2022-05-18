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
 * Content Script Bridge module
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge
 * @export ContentScriptBridge
 * @example
 * import ContentScriptBridge
 * from '@aeternity/aepp-sdk/es/utils/wallet-communication/content-script-bridge
 */
import { UnsupportedPlatformError } from '../errors'
import BrowserRuntimeConnection from './connection/browser-runtime'
import BrowserWindowMessageConnection from './connection/browser-window-message'

/**
 * ContentScriptBridge
 * Provide functionality to easly redirect messages from page to extension and from extension to
 * page through content script
 * Using Runtime(Extension) and WindowPostMessage(Web-Page) connections
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/content-script-bridge
 * @param params - Initializer object
 * @param params.pageConnection - Page connection object
 * (@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/
 * browser-window-message)
 * @param params.extConnection - Extension connection object
 * (@link module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-runtime)
 * @return ContentScriptBridge object
 */
export default class ContentScriptBridge {
  allowCrossOrigin: boolean
  pageConnection: BrowserWindowMessageConnection
  extConnection: BrowserRuntimeConnection

  constructor ({ pageConnection, extConnection, allowCrossOrigin = false }: {
    pageConnection: BrowserWindowMessageConnection
    extConnection: BrowserRuntimeConnection
    allowCrossOrigin: boolean }) {
    if (window == null) throw new UnsupportedPlatformError('Window object not found, you can run bridge only in browser')
    this.allowCrossOrigin = allowCrossOrigin
    this.pageConnection = pageConnection
    this.extConnection = extConnection
  }

  /**
   * Start message proxy
   * @instance
   */
  run (): void {
    const allowCrossOrigin = this.allowCrossOrigin
    // Connect to extension using runtime
    this.extConnection.connect((msg: MessageEvent) => {
      this.pageConnection.sendMessage(msg)
    })
    // Connect to page using window.postMessage
    this.pageConnection.connect((msg: MessageEvent, origin: string, source: Window) => {
      if (!allowCrossOrigin && source !== window) return
      this.extConnection.sendMessage(msg)
    })
  }

  /**
   * Stop message proxy
   * @instance
   */
  stop (): void {
    this.extConnection.disconnect()
    this.pageConnection.disconnect()
  }
}
