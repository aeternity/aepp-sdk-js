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
 * @module @aeternity/aepp-sdk/es/contract/node
 * @export ContractNodeAPI
 * @example import ContractNodeAPI from '@aeternity/aepp-sdk/es/contract/node'
 */

import * as R from 'ramda'
import ContractBase from './'
import Node from '../node'

const TYPE_CHECKED_ABI = ['sophia', 'sophia-address']

async function contractNodeEncodeCallData (codeOrAddress, abi, name, arg, call) {
  // Get contract bytecode from aeternity node if we want to get callData using { abi: 'sophia-address', code: 'contract address' }
  let code = codeOrAddress
  if (abi === 'sophia-address' && codeOrAddress.slice(0, 2) === 'ct') {
    code = (await this.getContractByteCode(code)).bytecode
    abi = 'sophia'
  }

  return (TYPE_CHECKED_ABI.includes(abi) && call)
    ? (await this.api.encodeCalldata({ abi, code, call })).calldata
    : (await this.api.encodeCalldata({ abi, code, 'function': name, arg })).calldata
}

async function contractNodeCall (address, abi = 'sophia-address', name, arg = '()', call) {
  if (call && TYPE_CHECKED_ABI.includes(abi)) return this.api.callContract({ abi, code: address, call })
  return this.api.callContract({ abi, code: address, 'function': name, arg })
}

async function contractNodeDecodeData (type, data) {
  return (await this.api.decodeData({ data, 'sophia-type': type })).data
}

async function compileNodeContract (code, options = {}) {
  return this.api.compileContract(R.mergeAll([this.Ae.defaults, options, { code }]))
}

async function getContractByteCode (contractId) {
  return this.api.getContractCode(contractId)
}

const ContractNodeAPI = ContractBase.compose(Node, {
  methods: {
    contractNodeEncodeCallData,
    contractNodeCall,
    contractNodeDecodeData,
    compileNodeContract,
    getContractByteCode
  },
  deepProps: {
    Ae: {
      defaults: {
        options: ''
      }
    }
  }
})

export default ContractNodeAPI
