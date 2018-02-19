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


const WebsocketProvider = require('./providers/ws')
const HttpProvider = require('./providers/http')


/**
 * Client to interact with the Epoch reference implementation
 */
class AeternityClient {

  /**
   *
   * @param provider
   */
  constructor(provider) {
    this.provider = provider

    // Semantically close services are bundeled in classes
    this.base = provider.base
    this.aens = provider.aens
    this.accounts = provider.accounts
    this.oracles = provider.oracles
    this.tx = provider.tx
  }

  addSubscription(subscription) {
    if (this.provider.addSubscription
      && typeof this.provider.addSubscription === 'function') {
      this.provider.addSubscription(subscription)
    } else {
      throw 'The current provider accepts no subscriptions'
    }
  }

  removeSubscription(subscription) {
    if (this.provider.removeSubscription
      && typeof this.provider.removeSubscription === 'function') {
      this.provider.removeSubscription(subscription)
    }
  }

  addConnectionListener(listener) {
    if (this.provider.addConnectionListener
      && typeof this.provider.addConnectionListener === 'function') {
      this.provider.addConnectionListener(listener)
    }
  }

  removeConnectionListener(listener) {
    if (this.provider.removeConnectionListener
      && typeof this.provider.removeConnectionListener === 'function') {
      this.provider.removeConnectionListener(listener)
    }
  }

}

AeternityClient.providers = {
  WebsocketProvider,
  HttpProvider
}

module.exports = AeternityClient
