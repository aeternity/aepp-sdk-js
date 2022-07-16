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

import BrowserConnection from './connection/Browser';
import BrowserWindowMessageConnection from './connection/BrowserWindowMessage';
import { MESSAGE_DIRECTION, METHODS } from './schema';
import { UnsupportedPlatformError } from '../utils/errors';

interface Wallet {
  info: {
    id: string;
    type: string;
    origin: string;
  };
  getConnection: () => BrowserWindowMessageConnection;
}
interface Wallets { [key: string]: Wallet }

/**
 * A function to detect available wallets
 * @category aepp wallet communication
 * @param connection - connection to use to detect wallets
 * @param onDetected - call-back function which trigger on new wallet
 * @returns a function to stop scanning
 */
export default (
  connection: BrowserConnection,
  onDetected: ({ wallets, newWallet }: { wallets: Wallets; newWallet?: Wallet }) => void,
): () => void => {
  if (window == null) throw new UnsupportedPlatformError('Window object not found, you can run wallet detector only in browser');
  const wallets: Wallets = {};

  connection.connect((
    { method, params }: { method: string; params: Wallet['info'] },
    origin: string,
    source: Window,
  ) => {
    if (method !== METHODS.readyToConnect || wallets[params.id] != null) return;

    const wallet = {
      info: params,
      getConnection() {
        const isExtension = params.type === 'extension';
        return new BrowserWindowMessageConnection({
          sendDirection: isExtension ? MESSAGE_DIRECTION.to_waellet : undefined,
          receiveDirection: isExtension ? MESSAGE_DIRECTION.to_aepp : undefined,
          target: source,
          origin: isExtension ? window.origin : params.origin,
        });
      },
    };
    wallets[wallet.info.id] = wallet;
    onDetected({ wallets, newWallet: wallet });
  }, () => {});
  if (Object.keys(wallets).length > 0) onDetected({ wallets });

  return () => connection.disconnect();
};
