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

/**
 * Browser connection proxy
 * Provide functionality to easily forward messages from one connection to another and back
 * @category aepp wallet communication
 * @param con1 - first connection
 * @param con2 - second connection
 * @returns a function to stop proxying
 */
export default (con1: BrowserConnection, con2: BrowserConnection): () => void => {
  con1.connect((msg: any) => con2.sendMessage(msg), () => con2.disconnect());
  con2.connect((msg: any) => con1.sendMessage(msg), () => con1.disconnect());

  return () => {
    con1.disconnect();
    con2.disconnect();
  };
};
