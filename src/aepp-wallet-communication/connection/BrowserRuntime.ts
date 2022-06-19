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

import { Runtime } from 'webextension-polyfill';
import BrowserConnection from './Browser';

/**
 * BrowserRuntimeConnection
 * Handle browser runtime communication
 * @category aepp wallet communication
 */
export default class BrowserRuntimeConnection extends BrowserConnection {
  port: Runtime.Port;

  constructor({ port, ...options }: { port: Runtime.Port; debug: boolean }) {
    super(options);
    this.port = port;
  }

  disconnect(): void {
    super.disconnect();
    this.port.disconnect();
  }

  connect(
    onMessage: (message: any, origin: string, source: Runtime.Port) => void,
    onDisconnect: () => void,
  ): void {
    super.connect(onMessage, onDisconnect);
    this.port.onMessage.addListener((message, port) => {
      this.receiveMessage(message);
      onMessage(message, port.name, port);
    });
    this.port.onDisconnect.addListener(onDisconnect);
  }

  sendMessage(message: any): void {
    super.sendMessage(message);
    this.port.postMessage(message);
  }

  isConnected(): boolean {
    return this.port.onMessage.hasListeners();
  }
}
