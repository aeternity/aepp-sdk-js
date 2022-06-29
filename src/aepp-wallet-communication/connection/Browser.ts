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

import { AlreadyConnectedError, NoWalletConnectedError } from '../../utils/errors';

/**
 * Browser connection base interface
 * @category aepp wallet communication
 */
export default abstract class BrowserConnection {
  debug: boolean;

  protected constructor({ debug = false }: { debug?: boolean }) {
    this.debug = debug;
  }

  /**
   * Connect
   * @param onMessage - Message handler
   * @param onDisconnect - trigger when runtime connection in closed
   */
  connect(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onMessage: (message: any, origin: string, source: any) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onDisconnect: () => void,
  ): void {
    if (this.isConnected()) throw new AlreadyConnectedError('You already connected');
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (!this.isConnected()) throw new NoWalletConnectedError('You dont have connection. Please connect before');
  }

  /**
   * Receive message
   */
  protected receiveMessage(message: any): void {
    if (this.debug) console.log('Receive message:', message);
  }

  /**
   * Send message
   */
  sendMessage(message: any): void {
    if (this.debug) console.log('Send message:', message);
  }

  /**
   * Check if connected
   * @returns Is connected
   */
  abstract isConnected(): boolean;
}
