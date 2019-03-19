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
 * ContractNodeAPI module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/contract}.
 * @module @aeternity/aepp-sdk/es/contract/compiler
 * @export ContractCompilerAPI
 * @example import ContractCompilerAPI from '@aeternity/aepp-sdk/es/contract/compiler'
 */

import * as R from 'ramda'
import Http from '../utils/http'
import AsyncInit from '../utils/async-init'

const TYPE_CHECKED_ABI = ['sophia', 'sophia-address']

async function contractAPIEncodeCallData (code, abi, name, arg, call) {
  return (TYPE_CHECKED_ABI.includes(abi) && call)
    ? (await this.api.encodeCalldata({ abi, code, call })).calldata
    : (await this.api.encodeCalldata({ abi, code, 'function': name, arg })).calldata
}

async function contractAPIDecodeData (type, data) {
  return (await this.api.decodeData({ data, 'sophia-type': type })).data
}

async function compileAPIContract (code, options = {}) {
  return this.api.compileContract(R.mergeAll([this.Ae.defaults, options, { code }]))
}

const ContractCompilerAPI = AsyncInit.compose({
  init ({ compilerUrl }) {
    this.http = Http({ baseUrl: compilerUrl })
  },
  methods: {
    contractAPIEncodeCallData,
    contractAPIDecodeData,
    compileAPIContract
  }
})

export default ContractCompilerAPI
