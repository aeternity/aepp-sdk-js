
const axios = require('axios')

const CURRENT_API_VERSION = 'v2'

const DEFAULT_HEADERS = {headers: {'Content-Type': 'application/json'}}


class EpochHttpClient {

  constructor(host, port, version, secured) {
    this.host = host
    this.port = port
    this.version = version || CURRENT_API_VERSION
    this.protocol = typeof secured === 'undefined' || secured ? 'https': 'http'
  }

  getBaseUrl() {
    return `${this.protocol}://${this.host}:${this.port}/${this.version}/`
  }
  
  get(endpoint, params) {
    return axios.get(`${this.getBaseUrl()}${endpoint}`, {params: params})
  }

  post(endpoint, data, config) {
    return axios.post(`${this.getBaseUrl()}${endpoint}`, data, config || DEFAULT_HEADERS)
  }

}

module.exports = EpochHttpClient