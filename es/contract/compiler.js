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
 * @example import ContractCompilerAPI from '@aeternity/aepp-sdk/es/contract/compiler'
 */

import Http from '../utils/http'
import ContractBase from './index'
import semverSatisfies from '../utils/semver-satisfies'
import AsyncInit from '../utils/async-init'

async function getCompilerVersion (options = {}) {
  return this.http
    .get('/version', options)
    .then(({ version }) => version)
}

async function contractEncodeCallDataAPI (source, name, args = [], options = {}) {
  this.isInit()
  return this.http
    .post('/encode-calldata', { source, 'function': name, arguments: args }, options)
    .then(({ calldata }) => calldata)
}

async function contractDecodeCallDataByCodeAPI (bytecode, calldata, options = {}) {
  this.isInit()
  return this.http
    .post('/decode-calldata/bytecode', { bytecode, calldata }, options)
}

async function contractDecodeCallDataBySourceAPI (source, fn, callData, options = {}) {
  this.isInit()
  return this.http
    .post('/decode-calldata/source', { 'function': fn, source, calldata: callData }, options)
}

async function contractDecodeCallResultAPI (source, fn, callValue, callResult, options = {}) {
  this.isInit()
  return this.http
    .post('/decode-call-result', { 'function': fn, source, 'call-result': callResult, 'call-value': callValue }, options)
}

async function contractDecodeDataAPI (type, data, options = {}) {
  this.isInit()
  return this.http
    .post('/decode-data', { data, 'sophia-type': type }, options)
    .then(({ data }) => data)
}

async function compileContractAPI (code, options = {}) {
  this.isInit()
  return this.http.post('/compile', { code, options }, options)
    .then(({ bytecode }) => bytecode)
}

async function contractGetACI (code, options = {}) {
  this.isInit()
  return this.http.post('/aci', { code, options }, options)
}

async function setCompilerUrl (url, { forceCompatibility } = {}) {
  this.http.changeBaseUrl(url)
  this.compilerVersion = null
  await this.checkCompatibility({ forceCompatibility })
}

async function checkCompatibility ({ force = false, forceCompatibility = false } = {}) {
  this.compilerVersion = await this.getCompilerVersion().catch(e => null)
  if (!this.compilerVersion && !force) throw new Error('Compiler do not respond')
  if (!forceCompatibility && this.compilerVersion && !semverSatisfies(this.compilerVersion.split('-')[0], COMPILER_GE_VERSION, COMPILER_LT_VERSION)) {
    const version = this.compilerVersion
    this.compilerVersion = null
    throw new Error(`Unsupported compiler version ${version}. ` +
      `Supported: >= ${COMPILER_GE_VERSION} < ${COMPILER_LT_VERSION}`)
  }
}

function isInit () {
  if (this.compilerVersion === null) throw Error('Compiler not defined')
  return true
}

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
const ContractCompilerAPI = AsyncInit.compose(ContractBase, {
  async init ({ compilerUrl = this.compilerUrl, forceCompatibility = false }) {
    this.http = Http({ baseUrl: compilerUrl })
    await this.checkCompatibility({ force: true, forceCompatibility })
  },
  methods: {
    contractEncodeCallDataAPI,
    contractDecodeDataAPI,
    compileContractAPI,
    contractGetACI,
    contractDecodeCallDataByCodeAPI,
    contractDecodeCallDataBySourceAPI,
    contractDecodeCallResultAPI,
    setCompilerUrl,
    getCompilerVersion,
    isInit,
    checkCompatibility
  },
  props: {
    compilerVersion: null
  }
})

const COMPILER_GE_VERSION = '3.1.0'
const COMPILER_LT_VERSION = '4.0.0'

export default ContractCompilerAPI
