/*
* ISC License (ISC)
* Copyright (c) 2022 aeternity developers
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

// @ts-expect-error TODO remove
import { Encoder as Calldata } from '@aeternity/aepp-calldata'
import { DRY_RUN_ACCOUNT, GAS_MAX, TX_TYPE, AMOUNT } from '../tx/builder/schema'
import { buildContractIdByContractTx, unpackTx } from '../tx/builder'
import { decode, EncodedData, EncodingType } from '../utils/encoder'
import {
  MissingContractDefError,
  MissingContractAddressError,
  InactiveContractError,
  BytecodeMismatchError,
  DuplicateContractError,
  MissingFunctionNameError,
  InvalidMethodInvocationError,
  NotPayableFunctionError,
  TypeError,
  NodeInvocationError,
  IllegalArgumentError,
  NoSuchContractFunctionError,
  MissingEventDefinitionError,
  AmbiguousEventDefinitionError,
  UnexpectedTsError
} from '../utils/errors'
import { hash } from '../utils/crypto'
import { Aci as BaseAci } from '../apis/compiler'
import { OnCompiler } from './compiler'
import Node from '../node'
import {
  getAccount, getContract, getContractByteCode, getKeyBlock, resolveName, txDryRun
} from '../chain'
import { _AccountBase } from '../account/base'

interface FunctionACI {
  arguments: any[]
  name: string
  payable: boolean
  returns: string
  stateful: boolean
}

interface Aci extends BaseAci {
  encodedAci: {
    contract: {
      name: string
      event: any
      kind: string
      state: any
      type_defs: any[]
      functions: FunctionACI[]
    }
  }
  externalEncodedAci: any[]
}

interface Event {
  address: EncodedData<'ct'>
  data: string
  topics: Array<string | number>
}

interface DecodedEvent {
  name: string
  args: unknown
  contract: {
    name: string
    address: EncodedData<'ct'>
  }
}

interface TxData {
  blockHash: string
  blockHeight: number
  hash: string
  signatures: any[]
  tx: object[]
  rawTx: string
  callerId: string
  callerNonce: number
  contractId: string
  gasPrice: number
  gasUsed: number
  height: number
  log: any[]
  returnType: ReturnType
  returnValue: EncodedData<EncodingType>
}

export interface ContractInstance {
  _aci: Aci
  _name: string
  calldata: any
  source?: string
  bytecode?: string
  deployInfo: {
    address?: EncodedData<'ct'>
    result?: {
      callerId: string
      callerNonce: string
      contractId: string
      gasPrice: bigint
      gasUsed: number
      height: number
      log: any[]
      returnType: string
      returnValue: string
    }
    owner?: EncodedData<'ak'>
    transaction?: string
    rawTx?: string
    txData?: TxData
  }
  options: any
  compile: (options?: {}) => Promise<string>
  _estimateGas: (name: string, params: any[], options: object) => Promise<number>
  deploy: (params: any[], options: object) => Promise<any>
  call: (fn: string, params?: any[], options?: {}) => Promise<any>
  decodeEvents: (events: Event[], { omitUnknown, ...opt }: {
    omitUnknown?: boolean}) => DecodedEvent[]
  methods: any
}

type ReturnType = 'ok' | 'error' | 'revert'

/**
* Generate contract ACI object with predefined js methods for contract usage - can be used for
* creating a reference to already deployed contracts
* @alias module:@aeternity/aepp-sdk/es/contract/aci
* @param options Options object
* @returns JS Contract API
* @example
* const contractIns = await aeSdk.getContractInstance({ source })
* await contractIns.deploy([321]) or await contractIns.methods.init(321)
* const callResult = await contractIns.call('setState', [123]) or
* await contractIns.methods.setState.send(123, options)
* const staticCallResult = await contractIns.call('setState', [123], { callStatic: true }) or
* await contractIns.methods.setState.get(123, options)
* Also you can call contract like: await contractIns.methods.setState(123, options)
* Then sdk decide to make on-chain or static call(dry-run API) transaction based on function is
* stateful or not
*/
export default async function getContractInstance ({
  onAccount,
  onCompiler,
  onNode,
  source,
  bytecode,
  aci: _aci,
  contractAddress,
  fileSystem = {},
  validateBytecode,
  ...otherOptions
}: {
  onAccount: _AccountBase & { send: any, buildTx: any, Ae: any }
  onCompiler: OnCompiler
  onNode: Node
  source?: string
  bytecode?: EncodedData<'cb'>
  aci?: Aci
  contractAddress?: EncodedData<'ct'>
  fileSystem?: Record<string, string>
  validateBytecode?: boolean
}): Promise<ContractInstance> {
  if (_aci == null && source != null) {
    // @ts-expect-error TODO should be fixed when the compiledAci interface gets updated
    _aci = await onCompiler.generateACI({ code: source, options: { fileSystem } })
  }
  if (_aci == null) throw new MissingContractDefError()

  if (contractAddress != null) contractAddress = await resolveName(contractAddress, 'contract_pubkey', { resolveByNode: true, onNode }) as EncodedData<'ct'>

  if (contractAddress == null && source == null && bytecode == null) {
    throw new MissingContractAddressError('Can\'t create instance by ACI without address')
  }

  if (contractAddress != null) {
    const contract = await getContract(contractAddress, { onNode })
    if (contract.active == null) throw new InactiveContractError(contractAddress)
  }

  const instance: ContractInstance = {
    _aci,
    _name: _aci.encodedAci.contract.name,
    calldata: new Calldata([_aci.encodedAci, ..._aci.externalEncodedAci]),
    source,
    bytecode,
    deployInfo: { address: contractAddress },
    options: {
      ...onAccount.Ae.defaults,
      amount: AMOUNT,
      callStatic: false,
      fileSystem,
      ...otherOptions
    },
    compile: async function (_options?: {}): Promise<any> {},
    _estimateGas: async function (_name: string, _params: any[], _options: object): Promise<any> {},
    deploy: async function (_params: any[], _options: any): Promise<any> {},
    call: async function (_fn: string, _params?: any[], _options?: {}): Promise<any> {},
    decodeEvents (
      _events: Event[],
      { omitUnknown, ...opt }: { omitUnknown?: boolean }
    ): any {},
    methods: undefined
  }

  if (validateBytecode != null) {
    if (contractAddress == null) throw new MissingContractAddressError('Can\'t validate bytecode without contract address')
    const onChanBytecode = (await getContractByteCode(contractAddress, { onNode })).bytecode
    const isValid: boolean = source != null
      ? await onCompiler.validateByteCode(
        { bytecode: onChanBytecode, source, options: instance.options }
      ).then(() => true, () => false)
      : bytecode === onChanBytecode
    if (!isValid) throw new BytecodeMismatchError(source != null ? 'source' : 'bytecode')
  }

  /**
  * Compile contract
  * @alias module:@aeternity/aepp-sdk/es/contract/aci
  * @return bytecode
  */
  instance.compile = async (options = {}): Promise<string> => {
    if (instance.bytecode != null) throw new IllegalArgumentError('Contract already compiled')
    if (instance.source == null) throw new IllegalArgumentError('Can\'t compile without source code')
    const { bytecode }: { bytecode: EncodedData<'cb'> } = await onCompiler.compileContract({
      code: instance.source, options: { ...instance.options, ...options }
    }) as { bytecode: EncodedData<'cb'> }
    instance.bytecode = bytecode
    return instance.bytecode
  }

  const sendAndProcess = async (tx: EncodedData<'tx'>, options: any): Promise<{
    result?: ContractInstance['deployInfo']['result']
    hash: EncodedData<'th'>
    tx: object
    txData: TxData
    rawTx: EncodedData<'tx'>
  }> => {
    const txData = await onAccount.send(tx, options) // TODO onAccount shouldn't have .send method
    const result = {
      hash: txData.hash, tx: unpackTx(txData.rawTx), txData, rawTx: txData.rawTx
    }
    if (txData.blockHeight == null) return result
    const { callInfo } = await onNode.getTransactionInfoByHash(txData.hash)
    Object.assign(result.txData, callInfo) // TODO: don't duplicate data in result
    // @ts-expect-error TODO api should be updated to match types
    handleCallError(callInfo, tx)
    return { ...result, result: callInfo }
  }
  const handleCallError = (
    { returnType, returnValue }: {
      returnType: ReturnType
      returnValue: EncodedData<EncodingType>},
    transaction: string): void => {
    let message: string
    switch (returnType) {
      case 'ok': return
      case 'revert':
        message = instance.calldata.decodeFateString(returnValue)
        break
      case 'error':
        message = decode(returnValue).toString()
        break
    }
    throw new NodeInvocationError(message, transaction)
  }

  instance._estimateGas = async (
    name: string, params: any[], options: object): Promise<number> => {
    const { result: { gasUsed } } =
      await instance.call(name, params, { ...options, callStatic: true })
    // taken from https://github.com/aeternity/aepp-sdk-js/issues/1286#issuecomment-977814771
    return Math.floor(gasUsed * 1.25)
  }

  /**
  * Deploy contract
  * @alias module:@aeternity/aepp-sdk/es/contract/aci
  * @param params Contract init function arguments array
  * @param options
  * @returns deploy info
  */
  instance.deploy = async (params = [],
    options:
    Parameters<typeof instance.compile>[0] &
    Parameters<typeof instance.call>[2] &
    Parameters<typeof onAccount.address>[0] &
    Parameters<typeof sendAndProcess>[1]
  ): Promise<ContractInstance['deployInfo']> => {
    const opt = { ...instance.options, ...options }
    if (instance.bytecode == null) await instance.compile(opt)
    if (opt.callStatic === true) return await instance.call('init', params, opt)
    if (instance.deployInfo.address != null) throw new DuplicateContractError()

    const ownerId: EncodedData<'ak'> = await onAccount.address(opt)
    // TODO onAccount shouldn't have .buildTx method
    const tx = await onAccount.buildTx(TX_TYPE.contractCreate, {
      ...opt,
      gasLimit: opt.gasLimit ?? await instance._estimateGas('init', params, opt),
      callData: instance.calldata.encode(instance._name, 'init', params),
      code: instance.bytecode,
      ownerId
    })
    const contractId = buildContractIdByContractTx(tx)
    const { hash, rawTx, result, txData } = await sendAndProcess(tx, opt)
    instance.deployInfo = Object.freeze({
      result,
      owner: ownerId,
      transaction: hash,
      rawTx,
      txData,
      address: contractId
    })
    return instance.deployInfo
  }

  /**
  * Get function schema from contract ACI object
  * @param name Function name
  * @return function ACI
  */
  function getFunctionACI (name: string): Partial<FunctionACI> {
    const fn = instance._aci.encodedAci.contract.functions.find(
      (f: { name: string }) => f.name === name)
    if (fn != null) {
      return fn
    }
    if (name === 'init') return { payable: false }
    throw new NoSuchContractFunctionError(`Function ${name} doesn't exist in contract`)
  }

  /**
  * Call contract function
  * @alias module:@aeternity/aepp-sdk/es/contract/aci
  * @param fn Function name
  * @param params Array of function arguments
  * @param options Array of function arguments
  * @returns CallResult
  */
  instance.call = async (fn: string, params: any[] = [], options: object = {}) => {
    const opt = { ...instance.options, ...options }
    const fnACI = getFunctionACI(fn)
    const contractId = instance.deployInfo.address

    if (fn == null) throw new MissingFunctionNameError()
    if (fn === 'init' && opt.callStatic === false) throw new InvalidMethodInvocationError('"init" can be called only via dryRun')
    if (contractId == null && fn !== 'init') throw new InvalidMethodInvocationError('You need to deploy contract before calling!')
    if (fn !== 'init' && opt.amount > 0 && fnACI.payable === false) throw new NotPayableFunctionError(opt.amount, fn)

    const callerId = await onAccount.address(opt).catch((error: any) => {
      if (opt.callStatic === true) return DRY_RUN_ACCOUNT.pub
      else throw error
    })
    const callData = instance.calldata.encode(instance._name, fn, params)

    let res: any
    if (opt.callStatic === true) {
      if (typeof opt.top === 'number') {
        opt.top = (await getKeyBlock(opt.top, { onNode })).hash
      }
      const txOpt = {
        ...opt,
        gasLimit: opt.gasLimit ?? GAS_MAX,
        callData
      }
      if (opt.nonce == null && opt.top != null) {
        opt.nonce = (await getAccount(callerId, { hash: opt.top, onNode })).nonce + 1
      }
      // TODO onAccount shouldn't have .buildTx method
      const tx = await onAccount.buildTx(...fn === 'init'
        ? [TX_TYPE.contractCreate, { ...txOpt, code: instance.bytecode, ownerId: callerId }]
        : [TX_TYPE.contractCall, { ...txOpt, callerId, contractId }])

      const { callObj, ...dryRunOther } = await txDryRun(tx, callerId, { onNode, ...opt })
      if (callObj == null) throw new UnexpectedTsError()
      handleCallError({
        returnType: callObj.returnType as ReturnType,
        returnValue: callObj.returnValue as EncodedData<EncodingType>
      }, tx)
      res = { ...dryRunOther, tx: unpackTx(tx), result: callObj }
    } else {
    // TODO onAccount shouldn't have .buildTx method
      const tx = await onAccount.buildTx(TX_TYPE.contractCall, {
        ...opt,
        gasLimit: opt.gasLimit ?? await instance._estimateGas(fn, params, opt),
        callerId,
        contractId,
        callData
      })
      res = await sendAndProcess(tx, opt)
    }
    if (opt.callStatic === true || res.txData.blockHeight != null) {
      res.decodedResult = fnACI.returns != null && fnACI.returns !== 'unit' && fn !== 'init' &&
        instance.calldata.decode(instance._name, fn, res.result.returnValue)
      res.decodedEvents = instance.decodeEvents(res.result.log, opt)
    }
    return res
  }

  /**
  * @param address Contract address that emitted event
  * @param nameHash Hash of emitted event name
  * @param options Options
  * @returns Contract name
  * @throws {MissingEventDefinitionError}
  * @throws {AmbiguousEventDefinitionError}
  */
  function getContractNameByEvent (
    address: EncodedData<'ct'>,
    nameHash: BigInt,
    { contractAddressToName }: { contractAddressToName?: { [key: EncodedData<'ct'>]: string } }
  ): string {
    const addressToName = { ...instance.options.contractAddressToName, ...contractAddressToName }
    if (addressToName[address] != null) return addressToName[address]

    const matchedEvents = [
      instance._aci.encodedAci,
      ...instance._aci.externalEncodedAci
    ]
      .filter(({ contract }) => contract?.event)
      .map(({ contract }) => [contract.name, contract.event.variant])
      .map(([name, events]) => events.map((event: {}) => [name, Object.keys(event)[0]]))
      .flat()
      .filter(([, eventName]) => BigInt('0x' + hash(eventName).toString('hex')) === nameHash)
    switch (matchedEvents.length) {
      case 0: throw new MissingEventDefinitionError(nameHash.toString(), address)
      case 1: return matchedEvents[0][0]
      default: throw new AmbiguousEventDefinitionError(address, matchedEvents)
    }
  }

  /**
  * Decode Events
  * @alias module:@aeternity/aepp-sdk/es/contract/aci
  * @param events Array of encoded events (callRes.result.log)
  * @param options Options
  * @returns DecodedEvents
  */
  instance.decodeEvents = (
    events: Event[],
    { omitUnknown, ...opt }: {omitUnknown?: boolean} = {}
  ): DecodedEvent[] => events
    .map(event => {
      const topics = event.topics.map((t: string | number) => BigInt(t))
      let contractName
      try {
        contractName = getContractNameByEvent(event.address, topics[0], opt)
      } catch (error) {
        if ((omitUnknown ?? false) && error instanceof MissingEventDefinitionError) return null
        throw error
      }
      const decoded = instance.calldata.decodeEvent(contractName, event.data, topics)
      const [name, args] = Object.entries(decoded)[0]
      return {
        name,
        args,
        contract: {
          name: contractName,
          address: event.address
        }
      }
    }).filter((e: DecodedEvent | null): e is DecodedEvent => e != null)

  /**
  * Generate proto function based on contract function using Contract ACI schema
  * All function can be called like:
  * 'await contract.methods.testFunction()' -> then sdk will decide to use dry-run or send tx
  * on-chain base on if function stateful or not.
  * Also you can manually do that:
  * `await contract.methods.testFunction.get()` -> use call-static(dry-run)
  * `await contract.methods.testFunction.send()` -> send tx on-chain
  */
  instance.methods = Object.fromEntries(instance._aci.encodedAci.contract.functions
    .map(({ name, arguments: aciArgs, stateful }: FunctionACI) => {
      const genHandler = (callStatic: boolean) => async (...args: any[]) => {
        const options = args.length === aciArgs.length + 1 ? args.pop() : {}
        if (typeof options !== 'object') throw new TypeError(`Options should be an object: ${options as string}`)
        if (name === 'init') return await instance.deploy(args, { callStatic, ...options })
        return await instance.call(name, args, { callStatic, ...options })
      }
      return [
        name,
        Object.assign(
          genHandler(name === 'init' ? false : !stateful),
          {
            get: genHandler(true),
            send: genHandler(false)
          }
        )
      ]
    })
  )

  return instance
}
