/*
 * Copyright 2018 Æternity Anstalt
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

/*
 * Wraps all account related endpoints of the Epoch HTTP API
 */
class Account {

  constructor(epochClient) {
    this.BASE_ENDPOINT = 'account'
    this.client = epochClient
  }

  async getPublicKey() {
    let url = `${this.BASE_ENDPOINT}/pub-key`
    let {data} = await this.client.get(url, {}, true)
    return data['pub_key']
  }

  async balance() {
    let pubKey = await this.getPublicKey()
    let url = `${this.BASE_ENDPOINT}/balance/${pubKey}`
    let {data} = await this.client.get (url, {}, true)
    return data.balance
  }

}

module.exports = Account
