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

import * as R from 'ramda'

const DEFAULTS = {
  deposit: 4,
  vmVersion: 1,
  gasPrice: 1,
  amount: 1,
  fee: 10,
  gas: 40000000,
  ttl: Number.MAX_SAFE_INTEGER
}

function noWallet () {
  throw Error('Wallet not provided')
}

/**
 * Encode the call data for an already-deployed contract.
 * @param code 
 * @param abi
 * @return
 */
const encodeCall = client => (code, abi) => async (name, args) => {
  return (await client.api.encodeCalldata({ abi: abi, code, 'function': name, arg: args })).calldata
}

/**
 *
 * @param 
 * @param
 * @return
 */
const callStatic = client => (code, abi) => async (name, { args = '()', conformFn = R.identity } = {}) => {
  const { out } = await client.api.callContract({ abi: abi, code, 'function': name, arg: args })
  return conformFn(out)
}

/**
 *
 * @param 
 * @param
 * @return
 */
const call = (client, wallet, { defaults = {} } = {}) => address => async (name, { args = '()', conformFn = R.identity, options = {} } = {}) => {
  const opt = R.merge(defaults, options)
  const { tx } = await client.api.postContractCallCompute(R.merge(opt, {
    function: name,
    arguments: args,
    contract: address,
    caller: wallet.account
  }))

  const { hash } = await wallet.sendTransaction(tx, { options: opt })
  const result = await client.api.getContractCallFromTx(hash)

  if (result.returnType === 'ok') {
    return conformFn(result.returnValue)
  } else {
    const error = Buffer.from(result.returnValue.slice(2)).toString()
    throw Object.assign(Error(`Invocation failed: ${error}`), R.merge(result, { error }))
  }
}

/**
 *
 * @param 
 * @param
 * @return
 */
const deploy = (client, wallet, { defaults = {} } = {}) => (code, abi) => async ({ options = { initState: '()' } } = {}) => {
  const callData = await encodeCall(client)(code, abi)('init', options.initState)
  const opt = R.merge(defaults, options)
  const { tx, contractAddress } = await client.api.postContractCreate(R.merge(opt, {
    callData,
    code,
    owner: wallet.account
  }))

  await wallet.sendTransaction(tx, { options: opt })

  return Object.freeze({
    address: contractAddress,
    call: call(client, wallet, { defaults })(contractAddress)
  })
}

/**
 *
 * @param 
 * @param
 * @return
 */
const compile = (client, { wallet, defaults = {} } = {}) => async (code, { options = {} } = {}) => {
  const o = await client.api.compileContract(R.mergeAll([defaults, options, {
    code,
    options: ''
  }]))

  return Object.freeze(Object.assign({
    encodeCall: encodeCall(client)(o.bytecode, 'sophia'),
    call: callStatic(client)(o.bytecode, 'sophia'),
    deploy: R.isNil(wallet) ? noWallet : deploy(client, wallet, { defaults })(o.bytecode, 'sophia')
  }, o))
}

/**
 *
 * @param 
 * @param
 * @return
 */
function create (client, { wallet, defaults = {} } = {}) {
  const options = R.merge(DEFAULTS, defaults)

  return Object.freeze({
    compile: compile(client, { wallet, defaults: options }),
    callStatic: callStatic(client),
    deploy: deploy(client, wallet, { defaults: options }),
    call: call(client, wallet, { defaults: options }),
    encodeCall: encodeCall(client)
  })
}

export default {
  create
}
