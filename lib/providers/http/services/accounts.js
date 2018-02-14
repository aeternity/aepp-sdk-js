/*
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

/*
 * Wraps all account related services of the Epoch HTTP API
 */
class Accounts {

  constructor(httpClient) {
    this.BASE_ENDPOINT = 'account'
    this.client = httpClient
  }

  /**
   * Retrieve the public key of the account
   *
   * @returns {Promise<string>}
   */
  async getPublicKey() {
    let url = `${this.BASE_ENDPOINT}/pub-key`
    let {data} = await this.client.get(url, {}, true)
    return data['pub_key']
  }

  /**
   * Retrieves the account balance
   *
   *
   * @returns {Promise<Accounts.getBalance>}
   */
  async getBalance() {
    let pubKey = await this.getPublicKey()
    let url = `${this.BASE_ENDPOINT}/balance/${pubKey}`
    try {
      let {data} = await this.client.get (url, {}, true)
      return data.balance
    } catch ({response}) {
      throw `${pubKey}: response.data.reason`
    }
  }

}

module.exports = Accounts
