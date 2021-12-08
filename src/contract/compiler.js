/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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
 * ContractCompilerAPI module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/contract}.
 * @module @aeternity/aepp-sdk/es/contract/compiler
 * @export ContractCompilerAPI
 * @example import { ContractCompilerAPI } from '@aeternity/aepp-sdk'
 */

import ContractBase from './index'
import semverSatisfies from '../utils/semver-satisfies'
import AsyncInit from '../utils/async-init'
import genSwaggerClient from '../utils/swagger'
import {
  UnavailableCompilerError,
  MissingParamError,
  UnsupportedCompilerError
} from '../utils/errors'
import { mapObject } from '../utils/other'

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
 * @example ContractCompilerAPI({ compilerUrl: 'COMPILER_URL' })
 */
export default AsyncInit.compose(ContractBase, {
  async init ({ compilerUrl, ignoreVersion }) {
    if (!compilerUrl) return
    await this.setCompilerUrl(compilerUrl, { ignoreVersion })
  },
  methods: {
    async setCompilerUrl (compilerUrl, { ignoreVersion = false } = {}) {
      if (!compilerUrl) throw new MissingParamError('compilerUrl required')
      compilerUrl = compilerUrl.replace(/\/$/, '')
      const client = await genSwaggerClient(`${compilerUrl}/api`, {
        disableBigNumbers: true,
        disableCaseConversion: true,
        responseInterceptor: response => {
          if (response.ok) return
          let message = `${new URL(response.url).pathname.slice(1)} error`
          if (response.body.reason) {
            message += ': ' + response.body.reason +
              (response.body.parameter ? ` in ${response.body.parameter}` : '') +
              // TODO: revising after improving documentation https://github.com/aeternity/aesophia_http/issues/78
              (response.body.info ? ` (${JSON.stringify(response.body.info)})` : '')
          }
          if (Array.isArray(response.body)) {
            message += ':\n' + response.body
              .map(e => `${e.type}:${e.pos.line}:${e.pos.col}: ${e.message}${e.context ? `(${e.context})` : ''}`)
              .map(e => e.trim()) // TODO: remove after fixing https://github.com/aeternity/aesophia_http/issues/80
              .join('\n')
          }
          response.statusText = message
          return response
        }
      })
      this.compilerVersion = client.spec.info.version
      this.compilerApi = mapObject(
        client.api,
        ([key, fn]) => [
          key,
          ({ options: { filesystem, ...options } = {}, ...args } = {}) => fn({
            ...args, options: { ...options, file_system: filesystem }
          })
        ]
      )

      if (ignoreVersion) return
      if (!semverSatisfies(this.compilerVersion, COMPILER_GE_VERSION, COMPILER_LT_VERSION)) {
        throw new UnsupportedCompilerError(
          this.compilerVersion, COMPILER_GE_VERSION, COMPILER_LT_VERSION
        )
      }
    },
    _ensureCompilerReady () {
      if (!this.compilerApi) throw new UnavailableCompilerError()
    },
    getCompilerVersion () {
      this._ensureCompilerReady()
      return Promise.resolve(this.compilerVersion)
    },
    /**
     * Encode call data for contract call
     * @function
     * @category async
     * @param {String} source Contract source code
     * @param {String} name Name of function to call
     * @param {Array} args Argument's for call
     * @param {Object} [options={}]  Options
     * @param {Object} [options.filesystem={}] Contract external namespaces map
     * @return {Promise<String>}
     */
    async contractEncodeCallDataAPI (source, name, args = [], options) {
      this._ensureCompilerReady()
      const { calldata } = await this.compilerApi.encodeCalldata({
        source,
        function: name,
        arguments: args,
        options
      })
      return calldata
    },
    async compileContractAPI (code, options) {
      this._ensureCompilerReady()
      const { bytecode } = await this.compilerApi.compileContract({ code, options })
      return bytecode
    },
    contractGetACI (code, options) {
      this._ensureCompilerReady()
      return this.compilerApi.generateACI({ code, options })
    },
    contractDecodeCallDataByCodeAPI (bytecode, calldata) {
      this._ensureCompilerReady()
      return this.compilerApi.decodeCalldataBytecode({ bytecode, calldata })
    },
    contractDecodeCallDataBySourceAPI (source, fn, calldata, options) {
      this._ensureCompilerReady()
      return this.compilerApi.decodeCalldataSource({
        function: fn,
        source,
        calldata,
        options
      })
    },
    /**
     * Decode contract call result data
     * @function
     * @category async
     * @param {String} source - source code
     * @param {String } fn - function name
     * @param {String} callValue - result call data
     * @param {String} callResult - result status
     * @param {Object} [options={}]  Options
     * @param {Object} [options.filesystem={}] Contract external namespaces map
     * @return {Promise<String>} Result object
     * @example
     * const decodedData = await sdk.contractDecodeCallResultAPI(
     *   SourceCode ,'functionName', 'cb_asdasdasd...', 'ok|revert'
     * )
     */
    contractDecodeCallResultAPI (source, fn, callValue, callResult, options) {
      this._ensureCompilerReady()
      return this.compilerApi.decodeCallResult({
        function: fn,
        source,
        'call-result': callResult,
        'call-value': callValue,
        options
      })
    }
  },
  props: {
    compilerVersion: null
  }
})

const COMPILER_GE_VERSION = '6.1.0'
const COMPILER_LT_VERSION = '7.0.0'
