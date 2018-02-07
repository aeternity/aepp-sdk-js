
import axios from 'axios'

const CURRENT_API_VERSION = 'v2'


class EpochHttpClient {

  constructor(host, port, version, secured) {
    this.host = port
    this.port = port
    this.version = version || CURRENT_API_VERSION
    this.protocol = typeof secured === 'undefined' || secured ? 'https': 'http'
  }

  getBaseUrl() {
    return `${this.protocol}://${this.host}:${this.port}/${this.version}`
  }
  
  get(url) {
    return axios.get(`${this.getBaseUrl()}/${url}`)
  }

  post(url, data) {
    return axios.post(`${this.getBaseUrl()}/`, data)
  }

}
