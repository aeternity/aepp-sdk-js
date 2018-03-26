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


const HttpService = require('./index')
const {createTxCallParams} = require('./utils')

class Contracts extends HttpService {

  async getCreateTx(code, owner, options = {}) {
    let contractTxData = {
      ...createTxCallParams(options),
      owner,
      'vm_version': options.vmVersion || 1,
      code: code,
      'call_data': options.callData || '',
      deposit: options.deposit || 4
    }
    const {data} = await this.client.post('tx/contract/create', contractTxData)
    return data
  }

  async getCallTxWithData(callData, contractPubKey, options = {}) {
    const payload = {
      ...createTxCallParams(options),
      'caller': options.caller,
      'vm_version': options.vmVersion || 1,
      'call_data': callData,
      'contract': contractPubKey
    }
    const {data} = await this.client.post('tx/contract/call', payload)
    return data
  }

  async getCallTx(contractAddress, callData, options = {}) {
    const payload = {
      ...createTxCallParams(options),
      'caller': options.caller,
      'vm_version': options.vmVersion || 1,
      'call_data': callData,
      'contract': contractAddress
    }
    const {data} = await this.client.post('tx/contract/call', payload)
    return data
  }

  async compile(code, options) {
    const inputData = {code, options}
    const {data} = await this.client.post('contract/compile', inputData)
    return data.bytecode
  }

  async call(abi, code, func, arg) {
    const inputData = {abi: abi, code, 'function': func, arg}
    const {data} = await this.client.post('contract/call', inputData)
    return data.out
  }

  async encodeCallData(abi, code, func, args = []) {
    const body = {code, abi, 'function': func, 'arg': args.join(',')}
    const {data} = await this.client.post('contract/encode-calldata', body)
    return data.calldata
  }

  async deployContract(code, account, options = {}) {
    // Create the transaction
    let data = await this.getCreateTx(code, account.pub, options)
    await this.client.tx.sendSigned(data.tx, account.priv, options)
    return data
  }

  async getComputeCallTx(contract, func, args, options = {}) {
    const body = {
      'gas_price': options.gasPrice || 1,
      'caller': options.caller,
      'vm_version': options.vmVersion || 1,
      'amount': options.amount || 0,
      'contract': contract,
      'fee': options.fee || 1,
      'function': func,
      'gas': options.gas || 1,
      'arguments': args,
      'nonce': options.nonce
    }
    const {data} = await this.client.post('tx/contract/call/compute', body)
    return data
  }

}

module.exports = Contracts
