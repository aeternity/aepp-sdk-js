
import axios from 'axios'
import JSONbig from 'json-bigint'
import * as R from 'ramda'
import stampit from '@stamp/it'

async function get (url, options) {
  return axios.get(`${this.baseUrl}${url}`, R.merge(this.httpConfig, options))
}

async function post (url, body, options) {
  return axios.post(`${this.baseUrl}${url}`, body, R.merge(this.httpConfig, options))
}

async function put (url, body, options) {
  return axios.put(`${this.baseUrl}${url}`, body, R.merge(this.httpConfig, options))
}

async function _delete (url, options) {
  return axios.delete(`${this.baseUrl}${url}`, R.merge(this.httpConfig, options))
}

function changeBaseUrl (newUrl) {
  this.baseUrl = newUrl
}

const Http = stampit({
  init ({ baseUrl }) {
    if (!baseUrl) throw new Error('You need to provider base url.')
    this.baseUrl = baseUrl
  },
  methods: {
    changeBaseUrl,
    getRequest: get,
    postRequest: post,
    putRequest: put,
    'delete': _delete
  },
  props: {
    httpConfig: {
      headers: { 'Content-Type': 'application/json' },
      transformResponse: [JSONbig({ 'storeAsString': true }).parse]
    }
  }
})

export default Http
