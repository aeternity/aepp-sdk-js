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


const Base = require ('./services/base')
const AENS = require ('./services/aens')
const Account = require ('./services/accounts')
const Oracles = require('./services/oracles')
//
// const WebSocketProvider = require('./providers/ws')


/**
 * Client to interact with the Epoch reference implementation
 */
class AeternityClient {

  /**
   *
   * @param host Hostname
   * @param port External HTTP port
   * @param internalPort Internal HTTP port
   * @param wsPort
   * @param version HTTP API version
   * @param secured Use the https protocol if set to `true`
   */
  constructor(provider) {
    this.provider = provider

    // Semantically close services are bundeled in classes
    this.base = new Base (provider)
    this.aens = new AENS (provider)
    this.account = new Account (provider)
    this.oracles = new Oracles (provider)
    //
    // if (wsPort) {
    //   this.webSocket = new WebSocketProvider(this.host, wsPort, 'websocket')
    //   this.oracles = new Oracles(this.webSocket)
    // }
  }


}

module.exports = AeternityClient
