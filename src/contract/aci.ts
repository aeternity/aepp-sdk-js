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
import { Encoder as Calldata } from '@aeternity/aepp-calldata';
import { DRY_RUN_ACCOUNT, AMOUNT } from '../tx/builder/schema';
import { Tag, AensName } from '../tx/builder/constants';
import { buildContractIdByContractTx, unpackTx } from '../tx/builder';
import { _buildTx } from '../tx';
import { send } from '../spend';
import { decode, Encoded } from '../utils/encoder';
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
  UnexpectedTsError,
  InternalError,
} from '../utils/errors';
import { hash as calcHash } from '../utils/crypto';
import { Aci as BaseAci } from '../apis/compiler';
import { ContractCallReturnType } from '../apis/node';
import Compiler from './Compiler';
import Node from '../Node';
import {
  getAccount, getContract, getContractByteCode, getKeyBlock, resolveName, txDryRun,
} from '../chain';
import AccountBase from '../account/Base';

interface FunctionACI {
  arguments: any[];
  name: string;
  payable: boolean;
  returns: string;
  stateful: boolean;
}

interface Aci extends BaseAci {
  encodedAci: {
    contract: {
      name: string;
      event: any;
      kind: string;
      state: any;
      type_defs: any[];
      functions: FunctionACI[];
    };
  };
  externalEncodedAci: any[];
}

interface Event {
  address: Encoded.ContractAddress;
  data: string;
  topics: Array<string | number>;
}

interface DecodedEvent {
  name: string;
  args: unknown;
  contract: {
    name: string;
    address: Encoded.ContractAddress;
  };
}

type TxData = Awaited<ReturnType<typeof send>>;

export interface ContractInstance {
  _aci: Aci;
  _name: string;
  calldata: any;
  source?: string;
  bytecode?: Encoded.ContractBytearray;
  deployInfo: {
    address?: Encoded.ContractAddress;
    result?: {
      callerId: string;
      callerNonce: string;
      contractId: string;
      gasPrice: bigint;
      gasUsed: number;
      height: number;
      log: any[];
      returnType: ContractCallReturnType;
      returnValue: string;
    };
    owner?: Encoded.AccountAddress;
    transaction?: string;
    rawTx?: string;
    txData?: TxData;
  };
  options: any;
  compile: (options?: {}) => Promise<Encoded.ContractBytearray>;
  _estimateGas: (name: string, params: any[], options: object) => Promise<number>;
  deploy: (params?: any[], options?: object) => Promise<any>;
  call: (fn: string, params?: any[], options?: {}) => Promise<{
    hash: string;
    tx: any;
    txData: TxData;
    rawTx: string;
    result: {
      callerId: Encoded.AccountAddress;
      callerNonce: number;
      contractId: Encoded.ContractAddress;
      gasPrice: number;
      gasUsed: number;
      height: number;
      log: any[];
      returnType: ContractCallReturnType;
      returnValue: string;
    };
    decodedResult: any;
    decodedEvents: DecodedEvent[];
  }>;
  decodeEvents: (
    events: Event[], options?: { omitUnknown?: boolean; contractAddressToName?: any }
  ) => DecodedEvent[];
  methods: any;
}

/**
 * Generate contract ACI object with predefined js methods for contract usage - can be used for
 * creating a reference to already deployed contracts
 * @category contract
 * @param options - Options object
 * @returns JS Contract API
 * @example
 * ```js
 * const contractIns = await aeSdk.getContractInstance({ source })
 * await contractIns.deploy([321]) or await contractIns.methods.init(321)
 * const callResult = await contractIns.call('setState', [123]) or
 * await contractIns.methods.setState.send(123, options)
 * const staticCallResult = await contractIns.call('setState', [123], { callStatic: true }) or
 * await contractIns.methods.setState.get(123, options)
 * ```
 * Also you can call contract like: `await contractIns.methods.setState(123, options)`
 * Then sdk decide to make on-chain or static call(dry-run API) transaction based on function is
 * stateful or not
 */
export default async function getContractInstance({
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
  onAccount?: AccountBase;
  onCompiler: Compiler;
  onNode: Node;
  source?: string;
  bytecode?: Encoded.ContractBytearray;
  aci?: Aci;
  contractAddress?: Encoded.ContractAddress | AensName;
  fileSystem?: Record<string, string>;
  validateBytecode?: boolean;
  [key: string]: any;
}): Promise<ContractInstance> {
  if (_aci == null && source != null) {
    // TODO: should be fixed when the compiledAci interface gets updated
    _aci = await onCompiler.generateACI({ code: source, options: { fileSystem } }) as Aci;
  }
  if (_aci == null) throw new MissingContractDefError();

  if (contractAddress != null) {
    contractAddress = await resolveName(
      contractAddress,
      'contract_pubkey',
      { resolveByNode: true, onNode },
    ) as Encoded.ContractAddress;
  }

  if (contractAddress == null && source == null && bytecode == null) {
    throw new MissingContractAddressError('Can\'t create instance by ACI without address');
  }

  if (contractAddress != null) {
    const contract = await getContract(contractAddress, { onNode });
    if (contract.active == null) throw new InactiveContractError(contractAddress);
  }

  const instance: ContractInstance = {
    _aci,
    _name: _aci.encodedAci.contract.name,
    calldata: new Calldata([_aci.encodedAci, ..._aci.externalEncodedAci]),
    source,
    bytecode,
    deployInfo: { address: contractAddress },
    options: {
      onAccount,
      onCompiler,
      onNode,
      amount: AMOUNT,
      callStatic: false,
      fileSystem,
      ...otherOptions,
    },
    /* eslint-disable @typescript-eslint/no-unused-vars */
    /* eslint-disable @typescript-eslint/no-empty-function */
    async compile(_options?: {}): Promise<any> {},
    async _estimateGas(_name: string, _params: any[], _options: object): Promise<any> {},
    async deploy(_params?: any[], _options?: any): Promise<any> {},
    async call(_fn: string, _params?: any[], _options?: {}): Promise<any> {},
    decodeEvents(_events: Event[], options?: { omitUnknown?: boolean }): any {},
    /* eslint-enable @typescript-eslint/no-unused-vars */
    /* eslint-enable @typescript-eslint/no-empty-function */
    methods: undefined,
  };

  if (validateBytecode != null) {
    if (contractAddress == null) throw new MissingContractAddressError('Can\'t validate bytecode without contract address');
    const onChanBytecode = (await getContractByteCode(contractAddress, { onNode })).bytecode;
    const isValid: boolean = source != null
      ? await onCompiler.validateByteCode(
        { bytecode: onChanBytecode, source, options: instance.options },
      ).then(() => true, () => false)
      : bytecode === onChanBytecode;
    if (!isValid) throw new BytecodeMismatchError(source != null ? 'source' : 'bytecode');
  }

  /**
   * Compile contract
   * @returns bytecode
   */
  instance.compile = async (options = {}): Promise<Encoded.ContractBytearray> => {
    if (instance.bytecode != null) throw new IllegalArgumentError('Contract already compiled');
    if (instance.source == null) throw new IllegalArgumentError('Can\'t compile without source code');
    instance.bytecode = (await onCompiler.compileContract({
      code: instance.source, options: { ...instance.options, ...options },
    })).bytecode as Encoded.ContractBytearray;
    return instance.bytecode;
  };

  const handleCallError = (
    { returnType, returnValue }: {
      returnType: ContractCallReturnType;
      returnValue: Encoded.ContractBytearray;
    },
    transaction: string,
  ): void => {
    let message: string;
    switch (returnType) {
      case 'ok': return;
      case 'revert':
        message = instance.calldata.decodeFateString(returnValue);
        break;
      case 'error':
        message = decode(returnValue).toString();
        break;
      default:
        throw new InternalError(`Unknown return type: ${returnType}`);
    }
    throw new NodeInvocationError(message, transaction);
  };

  const sendAndProcess = async (tx: Encoded.Transaction, options: any): Promise<{
    result?: ContractInstance['deployInfo']['result'];
    hash: TxData['hash'];
    tx: Awaited<ReturnType<typeof unpackTx<Tag.ContractCallTx | Tag.ContractCreateTx>>>;
    txData: TxData;
    rawTx: Encoded.Transaction;
  }> => {
    options = { ...instance.options, ...options };
    const txData = await send(tx, options);
    const result = {
      hash: txData.hash,
      tx: unpackTx<Tag.ContractCallTx | Tag.ContractCreateTx>(txData.rawTx),
      txData,
      rawTx: txData.rawTx,
    };
    if (txData.blockHeight == null) return result;
    const { callInfo } = await onNode.getTransactionInfoByHash(txData.hash);
    Object.assign(result.txData, callInfo); // TODO: don't duplicate data in result
    // @ts-expect-error TODO api should be updated to match types
    handleCallError(callInfo, tx);
    return { ...result, result: callInfo };
  };

  instance._estimateGas = async (name: string, params: any[], options: object): Promise<number> => {
    const { result: { gasUsed } } = await instance
      .call(name, params, { ...options, callStatic: true });
    // taken from https://github.com/aeternity/aepp-sdk-js/issues/1286#issuecomment-977814771
    return Math.floor(gasUsed * 1.25);
  };

  /**
   * Deploy contract
   * @param params - Contract init function arguments array
   * @param options - Options
   * @returns deploy info
   */
  instance.deploy = async (
    params = [],
    options?:
    Parameters<typeof instance.compile>[0] &
    Parameters<typeof instance.call>[2] &
    Parameters<AccountBase['address']>[0] &
    Parameters<typeof sendAndProcess>[1],
  ): Promise<ContractInstance['deployInfo']> => {
    const opt = { ...instance.options, ...options };
    if (instance.bytecode == null) await instance.compile(opt);
    // @ts-expect-error TODO: need to fix compatibility between return types of `deploy` and `call`
    if (opt.callStatic === true) return instance.call('init', params, opt);
    if (instance.deployInfo.address != null) throw new DuplicateContractError();

    const ownerId = await opt.onAccount.address(options);
    const tx = await _buildTx(Tag.ContractCreateTx, {
      ...opt,
      gasLimit: opt.gasLimit ?? await instance._estimateGas('init', params, opt),
      callData: instance.calldata.encode(instance._name, 'init', params),
      code: instance.bytecode,
      ownerId,
      onNode,
    });
    const contractId = buildContractIdByContractTx(tx);
    const {
      hash, rawTx, result, txData,
    } = await sendAndProcess(tx, opt);
    instance.deployInfo = Object.freeze({
      result,
      owner: ownerId,
      transaction: hash,
      rawTx,
      txData,
      address: contractId,
    });
    return instance.deployInfo;
  };

  /**
   * Get function schema from contract ACI object
   * @param name - Function name
   * @returns function ACI
   */
  function getFunctionACI(name: string): Partial<FunctionACI> {
    const fn = instance._aci.encodedAci.contract.functions.find(
      (f: { name: string }) => f.name === name,
    );
    if (fn != null) {
      return fn;
    }
    if (name === 'init') return { payable: false };
    throw new NoSuchContractFunctionError(`Function ${name} doesn't exist in contract`);
  }

  /**
   * Call contract function
   * @param fn - Function name
   * @param params - Array of function arguments
   * @param options - Array of function arguments
   * @returns CallResult
   */
  instance.call = async (fn: string, params: any[] = [], options: object = {}) => {
    const opt = { ...instance.options, ...options };
    const fnACI = getFunctionACI(fn);
    const contractId = instance.deployInfo.address;

    if (fn == null) throw new MissingFunctionNameError();
    if (fn === 'init' && opt.callStatic === false) throw new InvalidMethodInvocationError('"init" can be called only via dryRun');
    if (contractId == null && fn !== 'init') throw new InvalidMethodInvocationError('You need to deploy contract before calling!');
    if (fn !== 'init' && opt.amount > 0 && fnACI.payable === false) throw new NotPayableFunctionError(opt.amount, fn);

    const callerId = await Promise.resolve()
      .then(() => opt.onAccount.address(opt))
      .catch((error: any) => {
        if (opt.callStatic === true) return DRY_RUN_ACCOUNT.pub;
        throw error;
      }) as Encoded.AccountAddress;
    const callData = instance.calldata.encode(instance._name, fn, params);

    let res: any;
    if (opt.callStatic === true) {
      if (typeof opt.top === 'number') {
        opt.top = (await getKeyBlock(opt.top, { onNode })).hash;
      }
      const txOpt = { ...opt, onNode, callData };
      if (opt.nonce == null && opt.top != null) {
        opt.nonce = (await getAccount(callerId, { hash: opt.top, onNode })).nonce + 1;
      }
      const tx = await (fn === 'init'
        ? _buildTx(Tag.ContractCreateTx, { ...txOpt, code: instance.bytecode, ownerId: callerId })
        : _buildTx(Tag.ContractCallTx, { ...txOpt, callerId, contractId }));

      const { callObj, ...dryRunOther } = await txDryRun(tx, callerId, { onNode, ...opt });
      if (callObj == null) throw new UnexpectedTsError();
      handleCallError({
        returnType: callObj.returnType as ContractCallReturnType,
        returnValue: callObj.returnValue as Encoded.ContractBytearray,
      }, tx);
      res = { ...dryRunOther, tx: unpackTx(tx), result: callObj };
    } else {
      const tx = await _buildTx(Tag.ContractCallTx, {
        ...opt,
        onNode,
        gasLimit: opt.gasLimit ?? await instance._estimateGas(fn, params, opt),
        callerId,
        contractId,
        callData,
      });
      res = await sendAndProcess(tx, opt);
    }
    if (opt.callStatic === true || res.txData.blockHeight != null) {
      res.decodedResult = fnACI.returns != null && fnACI.returns !== 'unit' && fn !== 'init'
        && instance.calldata.decode(instance._name, fn, res.result.returnValue);
      res.decodedEvents = instance.decodeEvents(res.result.log, opt);
    }
    return res;
  };

  /**
   * @param address - Contract address that emitted event
   * @param nameHash - Hash of emitted event name
   * @param options - Options
   * @returns Contract name
   * @throws {@link MissingEventDefinitionError}
   * @throws {@link AmbiguousEventDefinitionError}
   */
  function getContractNameByEvent(
    address: Encoded.ContractAddress,
    nameHash: BigInt,
    { contractAddressToName }: {
      contractAddressToName?: { [key: Encoded.ContractAddress]: string };
    },
  ): string {
    const addressToName = { ...instance.options.contractAddressToName, ...contractAddressToName };
    if (addressToName[address] != null) return addressToName[address];

    const matchedEvents = [
      instance._aci.encodedAci,
      ...instance._aci.externalEncodedAci,
    ]
      .filter(({ contract }) => contract?.event)
      .map(({ contract }) => [contract.name, contract.event.variant])
      .map(([name, events]) => events.map((event: {}) => [name, Object.keys(event)[0]]))
      .flat()
      .filter(([, eventName]) => BigInt(`0x${calcHash(eventName).toString('hex')}`) === nameHash);
    switch (matchedEvents.length) {
      case 0: throw new MissingEventDefinitionError(nameHash.toString(), address);
      case 1: return matchedEvents[0][0];
      default: throw new AmbiguousEventDefinitionError(address, matchedEvents);
    }
  }

  /**
   * Decode Events
   * @param events - Array of encoded events (callRes.result.log)
   * @param options - Options
   * @returns DecodedEvents
   */
  instance.decodeEvents = (
    events: Event[],
    { omitUnknown, ...opt }: { omitUnknown?: boolean } = {},
  ): DecodedEvent[] => events
    .map((event) => {
      const topics = event.topics.map((t: string | number) => BigInt(t));
      let contractName;
      try {
        contractName = getContractNameByEvent(event.address, topics[0], opt);
      } catch (error) {
        if ((omitUnknown ?? false) && error instanceof MissingEventDefinitionError) return null;
        throw error;
      }
      const decoded = instance.calldata.decodeEvent(contractName, event.data, topics);
      const [name, args] = Object.entries(decoded)[0];
      return {
        name,
        args,
        contract: {
          name: contractName,
          address: event.address,
        },
      };
    }).filter((e: DecodedEvent | null): e is DecodedEvent => e != null);

  /**
   * Generate proto function based on contract function using Contract ACI schema
   * All function can be called like:
   * ```js
   * await contract.methods.testFunction()
   * ```
   * then sdk will decide to use dry-run or send tx
   * on-chain base on if function stateful or not.
   * Also, you can manually do that:
   * ```js
   * await contract.methods.testFunction.get() // use call-static (dry-run)
   * await contract.methods.testFunction.send() // send tx on-chain
   * ```
   */
  instance.methods = Object.fromEntries(instance._aci.encodedAci.contract.functions
    .map(({ name, arguments: aciArgs, stateful }: FunctionACI) => {
      const genHandler = (callStatic: boolean) => async (...args: any[]) => {
        const options = args.length === aciArgs.length + 1 ? args.pop() : {};
        if (typeof options !== 'object') throw new TypeError(`Options should be an object: ${options as string}`);
        if (name === 'init') return instance.deploy(args, { callStatic, ...options });
        return instance.call(name, args, { callStatic, ...options });
      };
      return [
        name,
        Object.assign(
          genHandler(name === 'init' ? false : !stateful),
          {
            get: genHandler(true),
            send: genHandler(false),
          },
        ),
      ];
    }));

  return instance;
}
