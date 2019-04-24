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

async function contractEncodeCallDataAPI (source, name, args = [], options = {}) {
  return this.http
    .post('/encode-calldata', { source, 'function': name, arguments: args }, options)
    .then(({ calldata }) => calldata)
}

async function contractDecodeCallDataByCodeAPI (bytecode, calldata, options = {}) {
  return this.http
    .post('/decode-calldata/bytecode', { bytecode, calldata }, options)
}

async function contractDecodeCallDataBySourceAPI (source, fn, callData, options = {}) {
  return this.http
    .post('/decode-calldata/source', { 'function': fn, source, calldata: callData }, options)
}

async function contractDecodeDataAPI (type, data, options = {}) {
  return this.http
    .post('/decode-data', { data, 'sophia-type': type }, options)
    .then(({ data }) => data)
}

async function compileContractAPI (code, options = {}) {
  return this.http.post('/compile', { code, options }, options)
    .then(({ bytecode }) => bytecode)
}

async function contractGetACI (code, options = {}) {
  return this.http.post('/aci', { code, options }, options)
}

function setCompilerUrl (url) {
  this.http.changeBaseUrl(url)
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
const ContractCompilerAPI = ContractBase.compose({
  init ({ compilerUrl = this.compilerUrl }) {
    this.http = Http({ baseUrl: compilerUrl })
  },
  methods: {
    contractEncodeCallDataAPI,
    contractDecodeDataAPI,
    compileContractAPI,
    contractGetACI,
    contractDecodeCallDataByCodeAPI,
    contractDecodeCallDataBySourceAPI,
    setCompilerUrl
  }
})

export default ContractCompilerAPI
