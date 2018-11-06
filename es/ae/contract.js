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
 * Contract module - routines to interact with the æternity contract
 *
 * High level documentation of the contracts are available at
 * https://github.com/aeternity/protocol/tree/master/contracts and
 * example code which uses this API at
 * https://github.com/aeternity/aepp-sdk-js/blob/develop/bin/aecontract.js
 *
 * @module @aeternity/aepp-sdk/es/ae/contract
 * @export Contract
 * @example import Contract from '@aeternity/aepp-sdk/es/ae/contract'
 */

import Ae from './'
import * as R from 'ramda'

async function encodeCall (code, abi, name, args, call) {
  return this.contractEpochEncodeCallData(code, abi, name, args, call)
}

async function callStatic (code, abi, name, { args = '()', call } = {}) {
  const { out } = await this.contractEpochCall(code, abi, name, args, call)
  return {
    result: out,
    decode: (type) => this.contractDecodeData(type, out)
  }
}

async function decode (type, data) {
  return this.contractEpochDecodeData(type, data)
}

async function call (code, abi, address, name, { args = '()', options = {}, call } = {}) {
  const opt = R.merge(this.Ae.defaults, options)

  // Check for MAX_GAS
  if (opt.gas > this.Ae.defaults.gas) {
    opt.gas = this.Ae.defaults.gas
  }

  const tx = await this.contractCallTx(R.merge(opt, {
    callData: await this.contractEncodeCall(code, abi, name, args, call),
    contractId: address,
    callerId: await this.address()
  }))

  const { hash } = await this.send(tx, opt)
  const result = await this.getTxInfo(hash)

  if (result.returnType === 'ok') {
    return {
      result,
      decode: (type) => this.contractDecodeData(type, result.returnValue)
    }
  } else {
    const error = Buffer.from(result.returnValue.slice(2)).toString()
    throw Object.assign(Error(`Invocation failed: ${error}`), R.merge(result, { error }))
  }
}

async function deploy (code, abi, { initState = '()', options = {} } = {}) {
  const opt = R.merge(this.Ae.defaults, options)
  const callData = await this.contractEncodeCall(code, abi, 'init', initState)
  const ownerId = await this.address()

  // Check for MAX_GAS
  if (opt.gas > this.Ae.defaults.gas) {
    opt.gas = this.Ae.defaults.gas
  }

  const { tx, contractId } = await this.contractCreateTx(R.merge(opt, {
    callData,
    code,
    ownerId
  }))

  const { hash } = await this.send(tx, opt)
  return Object.freeze({
    owner: ownerId,
    transaction: hash,
    address: contractId,
    call: async (name, options) => this.contractCall(code, abi, contractId, name, options),
    createdAt: new Date()
  })
}

async function compile (code, options = {}) {
  const o = await this.compileEpochContract(code, options)

  return Object.freeze(Object.assign({
    encodeCall: async (name, args, { call, abi }) => this.contractEncodeCall(o.bytecode, R.defaultTo('sophia', abi), name, args, call),
    call: async (name, options) => this.contractCallStatic(o.bytecode, R.defaultTo('sophia', options.abi), name, options),
    deploy: async (options) => this.contractDeploy(o.bytecode, R.defaultTo('sophia', options.abi), options)
  }, o))
}

const Contract = Ae.compose({
  methods: {
    contractCompile: compile,
    contractCallStatic: callStatic,
    contractDeploy: deploy,
    contractCall: call,
    contractEncodeCall: encodeCall,
    contractDecodeData: decode
  },
  deepProps: { Ae: { defaults: {
    deposit: 4,
    vmVersion: 1,
    gasPrice: 1,
    amount: 1,
    gas: 1600000 - 21000, // MAX GAS
    options: ''
  } } }
})

export default Contract
