/*
 * ISC License (ISC)
 * Copyright 2018 aeternity developers
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

import HttpService from './index'
import { createTxCallParams } from './utils'
import * as R from 'ramda'

class Contracts extends HttpService {
  async getCreateTx (code, owner, options = {}) {
    let contractTxData = {
      ...createTxCallParams(options),
      owner,
      vmVersion: options.vmVersion || 1,
      code: code,
      callData: options.callData || '',
      deposit: options.deposit || 4
    }

    return this.client.ae.api.postContractCreate(contractTxData)
  }

  async getCallTxWithData (callData, contractPubKey, options = {}) {
    const payload = {
      ...createTxCallParams(options),
      caller: options.caller,
      vmVersion: options.vmVersion || 1,
      callData: callData,
      contract: contractPubKey
    }

    return this.client.ae.api.postContractCall(payload)
  }

  async getCallTx (contractAddress, callData, options = {}) {
    const payload = {
      ...createTxCallParams(options),
      caller: options.caller,
      vmVersion: options.vmVersion || 1,
      callData: callData,
      contract: contractAddress
    }

    return this.client.ae.api.postContractCall(payload)
  }

  async compile (code, options) {
    const { bytecode } = await this.client.ae.api.compileContract({code, options})
    return bytecode
  }

  async callStatic (abi, code, func, arg) {
    const { out } = await this.client.ae.api.callContract({abi: abi, code, 'function': func, arg})
    return out
  }

  async encodeCallData (abi, code, func, args = []) {
    const body = {code, abi, 'function': func, 'arg': args.join(',')}
    const { calldata } = await this.client.ae.api.encodeCalldata(body)
    return calldata
  }

  async deployContract (code, account, options = {}) {
    // Create the transaction
    const data = await this.getCreateTx(code, account.pub, options)
    const send = await this.client.tx.sendSigned(data.tx, account.priv, options)

    return R.merge(data, send)
  }

  async getComputeCallTx (contract, func, args, options = {}) {
    const body = {
      gasPrice: options.gasPrice || 1,
      caller: options.caller,
      vmVersion: options.vmVersion || 1,
      amount: options.amount || 0,
      contract: contract,
      fee: options.fee || 1,
      'function': func,
      gas: options.gas || 1,
      arguments: args,
      nonce: options.nonce
    }

    return this.client.ae.api.postContractCallCompute(body)
  }
}

export default Contracts
