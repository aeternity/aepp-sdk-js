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
 * ContractCompilerHttp module
 *
 * @module @aeternity/aepp-sdk/es/contract/compiler
 * @export ContractCompilerHttp
 * @example import { ContractCompilerHttp } from '@aeternity/aepp-sdk'
 */

import { RestError } from '@azure/core-rest-pipeline'
import stampit from '@stamp/it'
import semverSatisfies from '../utils/semver-satisfies'
import { Compiler as CompilerApi } from '../apis/compiler/'
import { MissingParamError, UnsupportedVersionError } from '../utils/errors'

/**
 * Contract Compiler Stamp
 *
 * This stamp include api call's related to contract compiler functionality.
 * @function
 * @alias module:@aeternity/aepp-sdk/es/contract/compiler
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {String} [options.compilerUrl] compilerUrl - Url for compiler API
 * @return {Object} Contract compiler instance
 * @example ContractCompilerHttp({ compilerUrl: 'COMPILER_URL' })
 */
export default stampit({
  init ({ compilerUrl, ignoreVersion }) {
    if (!compilerUrl) return
    this.setCompilerUrl(compilerUrl, { ignoreVersion })
  },
  methods: {
    setCompilerUrl (compilerUrl, { ignoreVersion = false } = {}) {
      if (!compilerUrl) throw new MissingParamError('compilerUrl required')
      this.compilerApi = new CompilerApi(compilerUrl, {
        allowInsecureConnection: true,
        additionalPolicies: [{
          policy: {
            name: 'version-check',
            async sendRequest (request, next) {
              if (ignoreVersion || new URL(request.url).pathname === '/api-version') return next(request)
              const args = [await versionPromise, COMPILER_GE_VERSION, COMPILER_LT_VERSION]
              if (!semverSatisfies(...args)) throw new UnsupportedVersionError('compiler', ...args)
              return next(request)
            }
          },
          position: 'perCall'
        }, {
          policy: {
            name: 'error-formatter',
            async sendRequest (request, next) {
              try {
                return await next(request)
              } catch (error) {
                if (!(error instanceof RestError)) throw error
                let body
                try {
                  body = JSON.parse(error.response.bodyAsText)
                } catch (e) {
                  throw error
                }
                error.message = `${new URL(error.request.url).pathname.slice(1)} error`
                if (body.reason) {
                  error.message += ': ' + body.reason +
                    (body.parameter ? ` in ${body.parameter}` : '') +
                    // TODO: revising after improving documentation https://github.com/aeternity/aesophia_http/issues/78
                    (body.info ? ` (${JSON.stringify(body.info)})` : '')
                }
                if (Array.isArray(body)) {
                  error.message += ':\n' + body
                    .map(e => `${e.type}:${e.pos.line}:${e.pos.col}: ${e.message}${e.context ? `(${e.context})` : ''}`)
                    .map(e => e.trim()) // TODO: remove after fixing https://github.com/aeternity/aesophia_http/issues/80
                    .join('\n')
                }
                throw error
              }
            }
          },
          position: 'perCall'
        }]
      })
      const versionPromise = this.compilerApi.aPIVersion().then(({ apiVersion }) => {
        this.compilerVersion = apiVersion
        return apiVersion
      })
    }
  },
  props: {
    compilerVersion: null
  }
})

const COMPILER_GE_VERSION = '6.1.0'
const COMPILER_LT_VERSION = '7.0.0'
