/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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
import { ArgumentCountMismatchError } from './errors'
import { snakeToPascal } from './string'

/**
 * Generator of Swagger client
 * @function
 * @alias module:@aeternity/aepp-sdk/es/utils/swagger
 * @rtype Object
 * @param {String} specUrl - Swagger specification URL on external node host
 * @param {Object} options
 * @param {String} [options.spec] - Override OpenAPI definition
 * @param {Boolean} [options.disableBigNumbers]
 * @param {Boolean} [options.disableCaseConversion]
 * @param {Function} [options.responseInterceptor]
 * @return {Object} Swagger client
 * @example (await genSwaggerClient('https://mainnet.aeternity.io/api')).getAccountByPubkey('ak_jupBUgZNbcC4krDLR3tAkw1iBZoBbkNeShAq4atBtpFWmz36r')
 */
export default async (
  specUrl,
  { spec, disableBigNumbers, disableCaseConversion, responseInterceptor } = {}
) => {
  spec = spec || await (await fetch(specUrl)).json()
  const jsonImp = disableBigNumbers ? JSON : JsonBig

  const pendingGetRequests = {}
  const swagger = await SwaggerClient({
    url: specUrl,
    spec,
    requestInterceptor: request => {
      if (request.method !== 'GET') return
      return {
        ...request,
        userFetch: async (url, request) => {
          const key = JSON.stringify({ ...request, url })
          pendingGetRequests[key] ??= fetch(url, request)
          try {
            return (await pendingGetRequests[key]).clone()
          } finally {
            delete pendingGetRequests[key]
          }
        }
      }
    },
    responseInterceptor: response => {
      if (response.text === '' || response.text?.size === 0) return response
      const body = jsonImp.parse(response.text)
      Object.assign(response, {
        body: disableCaseConversion ? body : pascalizeKeys(body)
      })
      return (responseInterceptor && responseInterceptor(response)) || response
    }
  })

  const intermediateApi = swagger.apis.external ?? Object.assign({}, ...Object.values(swagger.apis))

  const opSpecs = Object.values(spec.paths)
    .map(paths => Object.values(paths))
    .flat()
    .reduce((acc, n) => ({ ...acc, [n.operationId]: n }), {})

  const requestQueues = {}
  const api = mapObject(intermediateApi, ([opId, handler]) => {
    const functionName = opId.slice(0, 1).toLowerCase() + snakeToPascal(opId.slice(1))
    return [
      functionName,
      async (...args) => {
        const opSpec = opSpecs[opId]
        const parameters = [
          ...opSpec.parameters,
          ...opSpec.requestBody
            ? [{
                required: opSpec.requestBody.required,
                schema: Object.values(opSpec.requestBody.content)[0].schema,
                name: '__requestBody'
              }]
            : []
        ]
        const required = parameters.filter(param => param.required).map(p => p.name)
        if (![0, 1].includes(args.length - required.length)) {
          throw new ArgumentCountMismatchError(functionName, required.length, args.length)
        }
        const values = required.reduce(
          (acc, req, idx) => ({ ...acc, [req]: args[idx] }),
          args[required.length] || {}
        )
        const { __requestBody, __queue, ...stringified } = mapObject(values, ([param, value]) => {
          if (typeof value !== 'object') return [param, value]
          const rootKeys = Object.keys(parameters.find(p => p.name === param).schema.properties)
          const filteredValue = filterObject(
            disableCaseConversion ? value : snakizeKeys(value),
            ([key]) => rootKeys.includes(key)
          )
          return [param, jsonImp.stringify(filteredValue)]
        })

        const request = async () => (await handler(stringified, { requestBody: __requestBody }))
          .body
        if (!__queue) return request()
        const res = (requestQueues[__queue] ?? Promise.resolve()).then(request, request)
        // TODO: remove after fixing https://github.com/aeternity/aeternity/issues/3803
        // gap to ensure that node won't reject the nonce
        requestQueues[__queue] = res.then(() => new Promise(resolve => setTimeout(resolve, 750)))
        return res
      }
    ]
  })

  return Object.assign(swagger, { api })
}
