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

  async getCreateTx(code, options = {}) {
    console.log(`ito: ${JSON.stringify(options)}`)
    let contractTxData = {
      ...createTxCallParams(options),
      owner: options.owner,
      'vm_version': options.vmVersion || 1,
      code: code,
      'call_data': options.callData || '',
      deposit: options.deposit || 4
    }
    let {data} = await this.client.post('tx/contract/create', contractTxData)
    return data
  }

  async getCallTxWithData(callData, contractPubKey, options = {}) {
    let payload = {
      ...createTxCallParams(options),
      'caller': options.caller || await this.client.accounts.getPublicKey(),
      'vm_version': options.vmVersion || 1,
      'call_data': callData,
      'contract': contractPubKey
    }
    let {data} = await this.client.post('tx/contract/call', payload)
    return data
  }

  async getCallTx(callData, contractPubKey, functionName, args = [], options = {}) {
    let payload = {
      ...createTxCallParams(options),
      'caller': options.caller || await this.client.accounts.getPublicKey(),
      'vm_version': options.vmVersion || 1,
      'contract': contractPubKey,
      'function': functionName,
      'arguments': args.join(',')
    }
  }

  async compile(code, options) {
    let inputData = {code, options}
    let {data} = await this.client.post('contract/compile', inputData)
    return data.bytecode
  }

  async call(abi, code, func, arg) {
    let inputData = {abi: abi, code, 'function': func, arg}
    let {data} = await this.client.post('contract/call', inputData)
    return data.out
  }

  async encodeCallData(abi, code, func, arg) {
    let body = {code, abi, 'function': func, arg}
    let {data} = await this.client.post('contract/encode-calldata', body)
    return data.calldata
  }

  async deployContract(code, privateKey, options = {}) {
    // Create the transaction
    let data = await this.getCreateTx(code, options)
    await this.client.tx.sendSigned(data.tx, privateKey, options)
    return data
  }

}

module.exports = Contracts
