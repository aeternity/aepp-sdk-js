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
 * EpochContract module
 *
 * This is the complement to {@link module:@aeternity/aepp-sdk/es/contract}.
 * @module @aeternity/aepp-sdk/es/contract/epoch
 * @export EpochContract
 * @example import Selector from '@aeternity/aepp-sdk/es/contract/apoch'
 */

import * as R from 'ramda'
import ContractBase from './'
import Epoch from '../epoch'

async function contractEpochEncodeCallData (code, abi, name, arg) {
  return (await this.api.encodeCalldata({ abi, code, 'function': name, arg })).calldata
}

async function contractEpochCall (code, abi, name, arg = '()') {
  return this.api.callContract({ abi, code, 'function': name, arg })
}

async function contractEpochDecodeData (type, data) {
  return (await this.api.decodeData({ data, 'sophia-type': type })).data
}

async function compileEpochContract (code, options = {}) {
  return this.api.compileContract(R.mergeAll([this.Ae.defaults, options, { code }]))
}

const EpochContract = ContractBase.compose(Epoch, {
  methods: {
    contractEpochEncodeCallData,
    contractEpochCall,
    contractEpochDecodeData,
    compileEpochContract
  }
})

export default EpochContract
