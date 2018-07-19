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
 * Contracts functions
 *
 * High level documentation of the contracts are available at
 * https://github.com/aeternity/protocol/tree/master/contracts and
 * example code which uses this API at
 * https://github.com/aeternity/aepp-sdk-js/blob/develop/bin/aecontract.js
 *
 */

import Ae from './'
import * as R from 'ramda'

async function encodeCall (code, abi, name, args) {
  return (await this.api.encodeCalldata({ abi: abi, code, 'function': name, arg: args })).calldata
}

async function callStatic (code, abi, name, { args = '()', conformFn = R.identity } = {}) {
  const {out} = await this.api.callContract({ abi: abi, code, 'function': name, arg: args })
  return conformFn(out)
}

async function call (code, abi, address, name, { args = '()', conformFn = R.identity, options = {} } = {}) {
  const opt = R.merge(this.Ae.defaults, options)

  const tx = await this.contractCallTx(R.merge(opt, {
    callData: await this.contractEncodeCall(code, abi, name, args),
    contract: address,
    caller: await this.address()
  }))

  const {hash} = await this.send(tx, opt)
  const result = await this.api.getContractCallFromTx(hash)

  if (result.returnType === 'ok') {
    return conformFn(result.returnValue)
  } else {
    const error = Buffer.from(result.returnValue.slice(2)).toString()
    throw Object.assign(Error(`Invocation failed: ${error}`), R.merge(result, { error }))
  }
}

async function deploy (code, abi, {initState = '()', options = {}} = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const callData = await this.contractEncodeCall(code, abi, 'init', initState)
  const {tx, contractAddress} = await this.contractCreateTx(R.merge(opt, {
    callData,
    code,
    owner: await this.address()
  }))

  await this.send(tx, opt)

  return Object.freeze({
    address: contractAddress,
    call: async (name, options) => this.contractCall(code, abi, contractAddress, name, options)
  })
}

async function compile (code, options = {}) {
  const o = await this.api.compileContract(R.mergeAll([this.Ae.defaults, options, {code}]))

  return Object.freeze(Object.assign({
    encodeCall: async (name, args) => this.contractEncodeCall(o.bytecode, 'sophia', name, args),
    call: async (name, options) => this.contractCallStatic(o.bytecode, 'sophia', name, options),
    deploy: async (options) => this.contractDeploy(o.bytecode, 'sophia', options)
  }, o))
}

const Contract = Ae.compose({
  methods: {
    contractCompile: compile,
    contractCallStatic: callStatic,
    contractDeploy: deploy,
    contractCall: call,
    contractEncodeCall: encodeCall
  },
  deepProps: {Ae: {defaults: {
    deposit: 4,
    vmVersion: 1,
    gasPrice: 1,
    amount: 1,
    gas: 40000000,
    options: ''
  }}}
})

export default Contract
