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

const axios = require ('axios')

const CURRENT_API_VERSION = 'v2'
const Base = require ('./endpoints/base')
const AENS = require ('./endpoints/aens')
const Account = require ('./endpoints/account')

const DEFAULT_HEADERS = {'Content-Type': 'application/json'}


class EpochHttpClient {

  constructor(host, port, internalPort, version, secured) {
    this.host = host || 'localhost'
    this.port = port || 3003
    this.internalPort = internalPort || 3103
    this.version = version || CURRENT_API_VERSION
    this.protocol = typeof secured === 'undefined' || secured ? 'https' : 'http'

    // Semantically close endpoints are bundeled in classes
    this.base = new Base (this)
    this.aens = new AENS (this)
    this.account = new Account (this)

  }

  getBaseUrl(internal) {
    // This pattern might change during the alpha phase as the topic
    // internal vs. external ports still has to be discussed
    return `${this.protocol}://${this.host}:${internal ? this.internalPort : this.port}/${this.version}/`
  }

  async get(endpoint, params, internal) {
    let response = await axios.get (`${this.getBaseUrl (internal)}${endpoint}`, {params: params})
    return response
  }

  async post(endpoint, data, options) {
    let internal = options && options.internal
    let headers = options && options.headers || DEFAULT_HEADERS
    let fullUrl = `${this.getBaseUrl (internal)}${endpoint}`
    let response = await axios.post (fullUrl, data, {headers: headers})
    // console.log (`${response.status} ${fullUrl} ${JSON.stringify(response.data)}`)
    return response
  }

}

module.exports = EpochHttpClient