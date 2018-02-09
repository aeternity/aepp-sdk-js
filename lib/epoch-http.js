const axios = require ('axios')

const CURRENT_API_VERSION = 'v2'
const Base = require ('./endpoints/base')
const AENS = require ('./endpoints/aens')
const Account = require ('./endpoints/account')

const DEFAULT_HEADERS = {headers: {'Content-Type': 'application/json'}}


class EpochHttpClient {

  constructor(host, port, internalPort, version, secured) {
    this.host = host || 'localhost'
    this.port = port || 3003
    this.internalPort = internalPort || 3103
    this.version = version || CURRENT_API_VERSION
    this.protocol = typeof secured === 'undefined' || secured ? 'https' : 'http'

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
    let internal = options.internal
    let config = options.config || DEFAULT_HEADERS
    let fullUrl = `${this.getBaseUrl (internal)}${endpoint}`
    let response = await axios.post (fullUrl, data, config)
    // console.log (`${response.status} ${fullUrl}`)
    return response
  }

}

module.exports = EpochHttpClient