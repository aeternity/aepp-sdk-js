import axios from 'axios'
import JsonBig from './json-big'
import * as R from 'ramda'
import stampit from '@stamp/it'

async function get (url, options) {
  return processResponse(
    axios.get(`${this.baseUrl}${url}`, R.merge(this.httpConfig, options))
  )
}

async function post (url, body, options) {
  return processResponse(
    axios.post(`${this.baseUrl}${url}`, body, R.merge(this.httpConfig, options))
  )
}

async function put (url, body, options) {
  return processResponse(
    axios.put(`${this.baseUrl}${url}`, body, R.merge(this.httpConfig, options))
  )
}

async function _delete (url, options) {
  return processResponse(
    axios.delete(`${this.baseUrl}${url}`, R.merge(this.httpConfig, options))
  )
}

function changeBaseUrl (newUrl) {
  this.baseUrl = newUrl
}

const processResponse = async (res) => {
  try {
    return (await res).data
  } catch (e) {
    if (!e.response) throw e
    throw Object.assign(
      Error(`Http request for ${e.config.url} failed with status code ${e.response.status}. Status: ${e.response.statusText}. \nError data: ${JSON.stringify(e.response.data)}`),
      { data: e.response.data }
    )
  }
}

const Http = stampit({
  init ({ baseUrl }) {
    this.baseUrl = baseUrl
  },
  methods: {
    changeBaseUrl,
    get,
    post,
    put,
    'delete': _delete
  },
  props: {
    httpConfig: {
      headers: { 'Content-Type': 'application/json' },
      transformResponse: [(data) => {
        try {
          return JsonBig.parse(data)
        } catch (e) {
          return data
        }
      }]
    }
  }
})

export default Http
