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
      if (!compilerUrl) throw new Error('"compilerUrl" required')
      compilerUrl = compilerUrl.replace(/\/$/, '')
      const client = await genSwaggerClient(`${compilerUrl}/api`, {
        disableBigNumbers: true,
        disableCaseConversion: true
      })
      this.compilerVersion = client.spec.info.version
      this._compilerApi = client.api

      this._isCompiler6 = semverSatisfies(this.compilerVersion, COMPILER_6_GE_VERSION, COMPILER_LT_VERSION)
      if (ignoreVersion) return
      if (!semverSatisfies(this.compilerVersion, COMPILER_GE_VERSION, COMPILER_LT_VERSION)) {
        throw new Error(`Unsupported compiler version ${this.compilerVersion}. ` +
          `Supported: >= ${COMPILER_GE_VERSION} < ${COMPILER_LT_VERSION}`)
      }
    },
    _ensureCompilerReady () {
      if (!this._compilerApi) throw new Error('Compiler is not ready')
    },
    _prepareCompilerOptions ({ filesystem = {} } = {}) {
      return { file_system: filesystem }
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
      const { calldata } = await this._compilerApi.encodeCalldata({
        source,
        function: name,
        arguments: args,
        options: this._prepareCompilerOptions(options)
      })
      return calldata
    },
    async compileContractAPI (code, options) {
      this._ensureCompilerReady()
      const { bytecode } = await this._compilerApi.compileContract({
        code,
        options: this._prepareCompilerOptions(options)
      })
      return bytecode
    },
    contractGetACI (code, options) {
      this._ensureCompilerReady()
      return this._compilerApi.generateACI({ code, options: this._prepareCompilerOptions(options) })
    },
    contractDecodeCallDataByCodeAPI (bytecode, calldata) {
      this._ensureCompilerReady()
      return this._compilerApi.decodeCalldataBytecode({ bytecode, calldata })
    },
    contractDecodeCallDataBySourceAPI (source, fn, callData, options) {
      this._ensureCompilerReady()
      return this._compilerApi.decodeCalldataSource({
        function: fn,
        source,
        calldata: callData,
        options: this._prepareCompilerOptions(options)
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
     * const decodedData = await sdk.contractDecodeCallResultAPI(SourceCode ,'functionName', 'cb_asdasdasd...', 'ok|revert')lt
     */
    contractDecodeCallResultAPI (source, fn, callValue, callResult, options) {
      this._ensureCompilerReady()
      return this._compilerApi.decodeCallResult({
        function: fn,
        source,
        'call-result': callResult,
        'call-value': callValue,
        options: this._prepareCompilerOptions(options)
      })
    },
    async validateByteCodeAPI (bytecode, source, options) {
      this._ensureCompilerReady()
      const res = await this._compilerApi.validateByteCode({
        bytecode,
        source,
        options: this._prepareCompilerOptions(options)
      })
      return typeof res === 'object' ? true : res
    },
    getFateAssembler (bytecode, options) {
      this._ensureCompilerReady()
      return this._compilerApi.getFateAssemblerCode({ bytecode, options: this._prepareCompilerOptions(options) })
    },
    getBytecodeCompilerVersion (bytecode, options) {
      this._ensureCompilerReady()
      return this._compilerApi.getCompilerVersion({
        bytecode,
        options: this._prepareCompilerOptions(options)
      })
    }
  },
  props: {
    compilerVersion: null
  }
})

const COMPILER_GE_VERSION = '4.1.0'
const COMPILER_6_GE_VERSION = '6.0.0'
const COMPILER_LT_VERSION = '7.0.0'
