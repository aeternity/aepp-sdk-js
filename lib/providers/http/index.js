/*
 * Copyright 2018 aeternity developers
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
const Base = require('./services/base')
const AENS = require('./services/aens')
const Accounts = require('./services/accounts')
const Transactions = require('./services/transactions')
const Oracles = require('./services/oracles')
const Contracts = require('./services/contracts')


const CURRENT_API_VERSION = 'v2'
const DEFAULT_HEADERS = {'Content-Type': 'application/json'}

/**
 * Client to interact with the Epoch reference implementation
 */
class AeHttpProvider {

  /**
   *
   * @param host Hostname
   * @param port External HTTP port
   * @param internalPort Internal HTTP port
   * @param version HTTP API version
   * @param secured Use the https protocol if set to `true`
   */
  constructor(host, port, {internalPort, version, secured}) {
    this.host = host || 'localhost'
    this.port = port || 3003
    this.internalPort = internalPort || 3103
    this.version = version || CURRENT_API_VERSION
    this.protocol = typeof secured === 'undefined' || secured ? 'https' : 'http'

    this.base = new Base(this)
    this.aens = new AENS(this)
    this.accounts = new Accounts(this)
    this.oracles = new Oracles(this)
    this.tx = new Transactions(this)
    this.contracts = new Contracts(this)

    // This pattern might change during the alpha phase as the topic
    // internal vs. external ports still has to be discussed.
    // Until then the base url can be set programmatically via `setBaseUrl`
    this.baseUrls = {
      external: `${this.protocol}://${this.host}:${this.port}/${this.version}/`,
      internal: `${this.protocol}://${this.host}:${this.internalPort}/${this.version}/`
    }

  }


  /**
   * Return the base url
   *
   * @param internal Use an internal endpoint route
   * @returns {string}
   */
  getBaseUrl(internal) {
    return this.baseUrls[internal ? 'internal': 'external']
  }

  /**
   * Set base url programmatically
   *
   * @param url
   * @param internal if `true` the url represents the internal base url
   */
  setBaseUrl(url, internal) {
    this.baseUrls[internal ? 'internal': 'external'] = url
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Call Http `GET` for a given endpoint
   *
   * @param endpoint
   * @param params
   * @param internal
   * @returns {Promise<*>}
   */
  async get(endpoint, params, internal) {
    let url = `${this.getBaseUrl (internal)}${endpoint}`
    return await axios.get (url, {params: params})
  }

  /**
   * Call Http `POST` for a given endpoint
   *
   * @param endpoint
   * @param data
   * @param options
   * @returns {Promise<*>}
   */
  async post(endpoint, data, options) {
    let internal = options && options.internal
    let headers = options && options.headers || DEFAULT_HEADERS
    let fullUrl = `${this.getBaseUrl (internal)}${endpoint}`
    try {
      return await axios.post (fullUrl, data, {headers: headers})
    } catch (e) {
      throw e
    }
  }

}

module.exports = AeHttpProvider
