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
 * ContractACI module
 *
 * @module @aeternity/aepp-sdk/es/contract/aci
 * @export getContractInstance
 */

import * as R from 'ramda'
import BigNumber from 'bignumber.js'
import { Encoder as Calldata } from '@aeternity/aepp-calldata'
import { decodeEvents } from './transformation'
import { DRY_RUN_ACCOUNT, DEPOSIT } from '../../tx/builder/schema'
import TxObject from '../../tx/tx-object'
import { decode } from '../../tx/builder/helpers'

/**
 * Get function schema from contract ACI object
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @param external
 * @return {Object} function ACI
 */
function getFunctionACI (aci, name, external) {
  const fn = aci.functions.find(f => f.name === name)
  if (!fn && name !== 'init') throw new Error(`Function ${name} doesn't exist in contract`)

  return {
    ...fn,
    bindings: [
      {
        state: aci.state,
        type_defs: aci.type_defs,
        name: aci.name
      },
      ...external.map(R.pick(['state', 'type_defs', 'name']))
    ],
    event: aci.event ? aci.event.variant : []
  }
}

/**
 * Generate contract ACI object with predefined js methods for contract usage - can be used for creating a reference to already deployed contracts
 * @alias module:@aeternity/aepp-sdk/es/contract/aci
 * @param {String} source Contract source code
 * @param {Object} [options={}] Options object
 * @param {String} [options.aci] Contract ACI
 * @param {String} [options.contractAddress] Contract address
 * @param {Object} [options.filesystem] Contact source external namespaces map
 * @param {Boolean} [options.validateByteCode] Compare source code with on-chain version
 * @return {ContractInstance} JS Contract API
 * @example
 * const contractIns = await client.getContractInstance(sourceCode)
 * await contractIns.deploy([321]) or await contractIns.methods.init(321)
 * const callResult = await contractIns.call('setState', [123]) or await contractIns.methods.setState.send(123, options)
 * const staticCallResult = await contractIns.call('setState', [123], { callStatic: true }) or await contractIns.methods.setState.get(123, options)
 * Also you can call contract like: await contractIns.methods.setState(123, options)
 * Then sdk decide to make on-chain or static call(dry-run API) transaction based on function is stateful or not
 */
export default async function getContractInstance (source, { aci, contractAddress, filesystem = {}, validateByteCode, ...otherOptions } = {}) {
  aci = aci || await this.contractGetACI(source, { filesystem })
  if (contractAddress) contractAddress = await this.resolveName(contractAddress, 'ct', { resolveByNode: true })
  const instance = {
    interface: R.defaultTo(null, R.prop('interface', aci)),
    aci: R.defaultTo(null, R.path(['encoded_aci', 'contract'], aci)),
    calldata: new Calldata([aci.encoded_aci, ...aci.external_encoded_aci]),
    externalAci: aci.external_encoded_aci ? aci.external_encoded_aci.map(a => a.contract || a.namespace) : [],
    source,
    compiled: null,
    deployInfo: { address: contractAddress },
    options: {
      ...this.Ae.defaults,
      callStatic: false,
      filesystem,
      ...otherOptions
    },
    compilerVersion: this.compilerVersion
  }

  // Check for valid contract address and contract code
  if (contractAddress) {
    const contract = await this.getContract(contractAddress).catch(e => null)
    if (!contract || !contract.active) throw new Error(`Contract with address ${contractAddress} not found on-chain or not active`)
    if (validateByteCode) {
      const onChanByteCode = (await this.getContractByteCode(contractAddress)).bytecode
      const isCorrespondingBytecode = await this.validateByteCodeAPI(onChanByteCode, instance.source, instance.options).catch(e => false)
      if (!isCorrespondingBytecode) throw new Error('Contract source do not correspond to the contract bytecode deployed on the chain')
    }
  }

  /**
   * Compile contract
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype () => ContractInstance: Object
   * @return {String} compiled bytecode
   */
  instance.compile = async (options = {}) => {
    const { bytecode } = await this.contractCompile(instance.source, { ...instance.options, ...options })
    instance.compiled = bytecode
    return instance.compiled
  }

  const sendAndProcess = async (tx, options) => {
    const txData = await this.send(tx, options)
    const result = {
      hash: txData.hash, tx: TxObject({ tx: txData.rawTx }), txData, rawTx: txData.rawTx
    }
    if (options.waitMined === false) return result
    const txInfo = await this.getTxInfo(txData.hash)
    await handleCallError(txInfo)
    return { ...result, result: txInfo }
  }

  const handleCallError = ({ returnType, returnValue }) => {
    let message
    // TODO: ensure that it works correctly https://github.com/aeternity/aepp-calldata-js/issues/88
    switch (returnType) {
      case 'ok': return
      case 'revert':
        message = instance.calldata.serializer.deserializeStream(decode(returnValue))[0].valueOf()
        break
      case 'error':
        message = decode(returnValue).toString()
        break
      default: throw new Error(`Unknown returnType: ${returnType}`)
    }
    throw new Error(`Invocation failed${message ? `: "${message}"` : ''}`)
  }

  /**
   * Deploy contract
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype (init: Array, options: Object) => ContractInstance: Object
   * @param {Array} params Contract init function arguments array
   * @param {Object} [options] options
   * @return {Object} deploy info
   */
  instance.deploy = async (params = [], options) => {
    const opt = { ...instance.options, ...options, deposit: DEPOSIT }
    if (!instance.compiled) await instance.compile(opt)

    if (opt.callStatic) return instance.call('init', params, opt)

    const source = opt.source || instance.source
    const ownerId = await this.address(opt)
    const { tx, contractId } = await this.contractCreateTx({
      ...opt,
      callData: instance.calldata.encode(instance.aci.name, 'init', params),
      code: instance.compiled,
      ownerId
    })
    const { hash, rawTx, result, txData } = await sendAndProcess(tx, opt)
    instance.deployInfo = Object.freeze({
      result,
      owner: ownerId,
      transaction: hash,
      rawTx,
      txData,
      address: contractId,
      call: (name, args, options) =>
        this.contractCall(source, contractId, name, args, { ...opt, ...options }),
      callStatic: (name, args, options) =>
        this.contractCallStatic(source, contractId, name, args, { ...opt, ...options }),
      createdAt: new Date()
    })
    return instance.deployInfo
  }

  /**
   * Call contract function
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype (init: Array, options: Object = { callStatic: false }) => CallResult: Object
   * @param {String} fn Function name
   * @param {Array} params Array of function arguments
   * @param {Object} [options={}] Array of function arguments
   * @param {Boolean} [options.callStatic=false] Static function call
   * @return {Object} CallResult
   */
  instance.call = async (fn, params = [], options = {}) => {
    const opt = { ...instance.options, ...options }
    const fnACI = getFunctionACI(instance.aci, fn, instance.externalAci)
    const contractId = instance.deployInfo.address

    if (!fn) throw new Error('Function name is required')
    if (fn === 'init' && !opt.callStatic) throw new Error('"init" can be called only via dryRun')
    if (!contractId && fn !== 'init') throw new Error('You need to deploy contract before calling!')
    if (
      BigNumber(opt.amount).gt(0) &&
      (Object.prototype.hasOwnProperty.call(fnACI, 'payable') && !fnACI.payable)
    ) throw new Error(`You try to pay "${opt.amount}" to function "${fn}" which is not payable. Only payable function can accept tokens`)

    const callerId = await this.address(opt).catch(error => {
      if (opt.callStatic) return DRY_RUN_ACCOUNT.pub
      else throw error
    })
    const callData = instance.calldata.encode(instance.aci.name, fn, params)

    let res
    if (opt.callStatic) {
      if (typeof opt.top === 'number') {
        opt.top = (await this.getKeyBlock(opt.top)).hash
      }
      const txOpt = {
        ...opt,
        callData,
        nonce: opt.top && (await this.getAccount(callerId, { hash: opt.top })).nonce + 1
      }
      const tx = fn === 'init'
        ? (await this.contractCreateTx({ ...txOpt, code: instance.compiled || opt.bytecode, ownerId: callerId })).tx
        : await this.contractCallTx({ ...txOpt, callerId, contractId })

      const { callObj, ...dryRunOther } = await this.txDryRun(tx, callerId, opt)
      await handleCallError(callObj)
      res = { ...dryRunOther, tx: TxObject({ tx }), result: callObj }
    } else {
      const tx = await this.contractCallTx({ ...opt, callerId, contractId, callData })
      res = await sendAndProcess(tx, opt)
    }
    if (opt.waitMined || opt.callStatic) {
      res.decodedResult = fnACI.returns && fnACI.returns !== 'unit' && fn !== 'init' &&
        instance.calldata.decode(instance.aci.name, fn, res.result.returnValue)
      res.decodedEvents = instance.decodeEvents(fn, res.result.log)
    }
    return res
  }

  /**
   * Decode Events
   * @alias module:@aeternity/aepp-sdk/es/contract/aci
   * @rtype (fn: String, events: Array) => DecodedEvents: Array
   * @param {String} fn Function name
   * @param {Array} events Array of encoded events(callRes.result.log)
   * @return {Object} DecodedEvents
   */
  instance.decodeEvents = (fn, events) => {
    const fnACI = getFunctionACI(instance.aci, fn, instance.externalAci)
    if (!fnACI.event || !fnACI.event.length) return []

    const eventsSchema = fnACI.event.map(e => {
      const name = Object.keys(e)[0]
      return { name, types: e[name] }
    })
    return decodeEvents(events, eventsSchema)
  }

  /**
   * Generate proto function based on contract function using Contract ACI schema
   * All function can be called like:
   * 'await contract.methods.testFunction()' -> then sdk will decide to use dry-run or send tx on-chain base on if function stateful or not.
   * Also you can manually do that:
   * `await contract.methods.testFunction.get()` -> use call-static(dry-run)
   * `await contract.methods.testFunction.send()` -> send tx on-chain
   */
  instance.methods = Object.fromEntries(instance.aci.functions
    .map(({ name, arguments: aciArgs, stateful }) => {
      const genHandler = callStatic => (...args) => {
        const options = args.length === aciArgs.length + 1 ? args.pop() : {}
        if (typeof options !== 'object') throw new Error(`Options should be an object: ${options}`)
        if (name === 'init') return instance.deploy(args, { callStatic, ...options })
        return instance.call(name, args, { callStatic, ...options })
      }
      return [
        name,
        Object.assign(
          genHandler(name === 'init' ? false : !stateful),
          {
            get: genHandler(true),
            send: genHandler(false),
            decodeEvents: events => instance.decodeEvents(name, events)
          }
        )
      ]
    })
  )

  return instance
}
