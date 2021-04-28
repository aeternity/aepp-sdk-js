/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
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

/**
 * Generator of Swagger client module
 * @module @aeternity/aepp-sdk/es/utils/swagger
 * @export genSwaggerClient
 */

import SwaggerClient from 'swagger-client'
import fetch from 'cross-fetch'
import JsonBig from './json-big'
import { snakizeKeys, pascalizeKeys, mapObject, filterObject } from './other'

/**
 * Generator of Swagger client
 * @function
 * @alias module:@aeternity/aepp-sdk/es/utils/swagger
 * @rtype Object
 * @param {String} specUrl - Swagger specification URL on external node host
 * @param {Object} options
 * @param {String} [options.internalUrl] - Node internal URL
 * @param {Boolean} [options.disableBigNumbers]
 * @param {Boolean} [options.keysOfValuesToIgnore] TODO: Convert keys according to Swagger definitions instead
 * @return {Object} Swagger client
 * @example (await genSwaggerClient('https://mainnet.aeternity.io/api')).getAccountByPubkey('ak_jupBUgZNbcC4krDLR3tAkw1iBZoBbkNeShAq4atBtpFWmz36r')
 */
export default async (specUrl, { internalUrl, disableBigNumbers, keysOfValuesToIgnore } = {}) => {
  const spec = await (await fetch(specUrl)).json()
  const jsonImp = disableBigNumbers ? JSON : JsonBig;

  ['claim', 'preclaim', 'transfer', 'revoke', 'update'].forEach(name => {
    const s = spec.paths[`/debug/names/${name}`]?.post
    if (s && !s.consumes) s.consumes = ['application/json']
  })

  const [external, internal] = await Promise.all([specUrl, internalUrl].map((urlString) => {
    if (!urlString) return null
    const url = new URL(urlString)
    const s = spec
    s.schemes = [url.protocol.slice(0, -1)]
    s.host = url.host
    return SwaggerClient({
      spec: s,
      responseInterceptor: response => {
        if (!response.text) return response
        const body = pascalizeKeys(jsonImp.parse(response.text), keysOfValuesToIgnore)
        return Object.assign(response, { body })
      }
    })
  }))

  const combinedApi = [
    ...Object.values(external.apis),
    ...internal ? [internal.apis.internal, internal.apis.debug] : []
  ].reduce((acc, n) => ({ ...acc, ...n }))

  const opSpecs = Object.values(spec.paths)
    .map(paths => Object.values(paths))
    .flat()
    .reduce((acc, n) => ({ ...acc, [n.operationId]: n }), {})

  const api = mapObject(combinedApi, ([opId, handler]) => [
    opId.slice(0, 1).toLowerCase() + opId.slice(1),
    async (...args) => {
      const { parameters } = opSpecs[opId]
      const required = parameters.filter(param => param.required).map(p => p.name)
      if (args.length < required.length) throw new Error('swagger: Not enough arguments')
      const values = required.reduce(
        (acc, req, idx) => ({ ...acc, [req]: args[idx] }),
        args[required.length] || {}
      )
      const stringified = mapObject(values, ([param, value]) => {
        if (typeof value !== 'object') return [param, value]
        const rootKeys = Object.keys(parameters.find(p => p.name === param).schema.properties)
        const filteredValue = filterObject(
          snakizeKeys(value, keysOfValuesToIgnore),
          ([key]) => rootKeys.includes(key)
        )
        return [param, jsonImp.stringify(filteredValue)]
      })
      return (await handler(stringified)).body
    }
  ])

  return Object.assign(external, { api })
}
