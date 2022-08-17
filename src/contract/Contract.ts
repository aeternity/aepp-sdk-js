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
 * Contract module - routines to interact with the æternity contract
 *
 * High level documentation of the contracts are available at
 * https://github.com/aeternity/protocol/tree/master/contracts and
 */

import { Encoder as Calldata } from '@aeternity/aepp-calldata';
import { DRY_RUN_ACCOUNT } from '../tx/builder/schema';
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
import { ContractCallObject, ContractCallReturnType } from '../apis/node';
import Compiler from './Compiler';
import Node, { TransformNodeType } from '../Node';
import {
  getAccount, getContract, getContractByteCode, getKeyBlock, resolveName, txDryRun,
} from '../chain';
import AccountBase from '../account/Base';
import { concatBuffers } from '../utils/other';
import { isNameValid, produceNameId } from '../tx/builder/helpers';

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
  _calldata: any;
  $options: {
    sourceCode?: string;
    bytecode?: Encoded.ContractBytearray;
    address?: Encoded.ContractAddress;
    onCompiler: Compiler;
    onNode: Node;
    fileSystem?: Record<string, string>;
    omitUnknown?: boolean;
    contractAddressToName?: { [key: Encoded.ContractAddress]: string };
    [key: string]: any;
  };
  $compile: (options?: {}) => Promise<Encoded.ContractBytearray>;
  _estimateGas: (name: string, params: any[], options: object) => Promise<number>;
  $deploy: (params?: any[], options?: object) => Promise<any>;
  $call: (fn: string, params?: any[], options?: {}) => Promise<{
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
  $decodeEvents: (
    events: Event[],
    options?: {
      omitUnknown?: boolean;
      contractAddressToName?: { [key: Encoded.ContractAddress]: string };
    },
  ) => DecodedEvent[];
  $createDelegationSignature: (
    ids?: Array<Encoded.Any | AensName>,
    _options?: { omitAddress?: boolean; onAccount?: AccountBase },
  ) => Promise<Uint8Array>;
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
 * const contractIns = await aeSdk.getContractInstance({ sourceCode })
 * await contractIns.$deploy([321]) or await contractIns.methods.init(321)
 * const callResult = await contractIns.$call('setState', [123]) or
 * await contractIns.methods.setState.send(123, options)
 * const staticCallResult = await contractIns.$call('setState', [123], { callStatic: true }) or
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
  sourceCode,
  bytecode,
  aci: _aci,
  address,
  fileSystem = {},
  validateBytecode,
  ...otherOptions
}: {
  onAccount?: AccountBase;
  onCompiler: Compiler;
  onNode: Node;
  sourceCode?: string;
  bytecode?: Encoded.ContractBytearray;
  aci?: Aci;
  address?: Encoded.ContractAddress | AensName;
  fileSystem?: Record<string, string>;
  validateBytecode?: boolean;
  [key: string]: any;
}): Promise<ContractInstance> {
  if (_aci == null && sourceCode != null) {
    // TODO: should be fixed when the compiledAci interface gets updated
    _aci = await onCompiler.generateACI({ code: sourceCode, options: { fileSystem } }) as Aci;
  }
  if (_aci == null) throw new MissingContractDefError();

  if (address != null) {
    address = await resolveName(
      address,
      'contract_pubkey',
      { resolveByNode: true, onNode },
    ) as Encoded.ContractAddress;
  }

  if (address == null && sourceCode == null && bytecode == null) {
    throw new MissingContractAddressError('Can\'t create instance by ACI without address');
  }

  if (address != null) {
    const contract = await getContract(address, { onNode });
    if (contract.active == null) throw new InactiveContractError(address);
  }

  const instance: ContractInstance = {
    _aci,
    _name: _aci.encodedAci.contract.name,
    _calldata: new Calldata([_aci.encodedAci, ..._aci.externalEncodedAci]),
    $options: {
      sourceCode,
      bytecode,
      address,
      onAccount,
      onCompiler,
      onNode,
      callStatic: false,
      fileSystem,
      ...otherOptions,
    },
    /* eslint-disable @typescript-eslint/no-unused-vars */
    /* eslint-disable @typescript-eslint/no-empty-function */
    async $compile(_options?: {}): Promise<any> {},
    async _estimateGas(_name: string, _params: any[], _options: object): Promise<any> {},
    async $deploy(_params?: any[], _options?: any): Promise<any> {},
    async $call(_fn: string, _params?: any[], _options?: {}): Promise<any> {},
    $decodeEvents(_events: Event[], options?: { omitUnknown?: boolean }): any {},
    /* eslint-enable @typescript-eslint/no-unused-vars */
    /* eslint-enable @typescript-eslint/no-empty-function */
    methods: undefined,
    /**
     * Helper to generate a signature to delegate
     *  - pre-claim/claim/transfer/revoke of a name to a contract.
     *  - register/extend/respond of an Oracle to a contract.
     * @category contract
     * @param ids - The list of id's to prepend
     * @param _options - Options
     * @param _options.omitAddress - Prepend delegation signature with an account address
     * @param _options.onAccount - Account to use
     * @returns Signature
     * @example
     * ```js
     * const aeSdk = new AeSdk({ ... })
     * const contract = await aeSdk.getContractInstance({ address: 'ct_asd2ks...' })
     * const aensName = 'example.chain'
     * const onAccount = new MemoryAccount(...) // Sign with a specific account
     * // Preclaim signature
     * const preclaimSig = await contract.$createDelegationSignature([], { onAccount })
     * // Claim, transfer and revoke signature
     * const aensDelegationSig = await contract
     *   .$createDelegationSignature([aensName], { onAccount })
     * ```
     * @example
     * ```js
     * const aeSdk = new AeSdk({ ... })
     * const contract = await aeSdk.getContractInstance({ address: 'ct_asd2ks...' })
     * const oracleQueryId = 'oq_...'
     * const onAccount = new MemoryAccount(...) // Sign with a specific account
     * // Oracle register and extend signature
     * const oracleDelegationSig = await contract.$createDelegationSignature([], { onAccount })
     * // Oracle respond signature
     * const respondSig = await contract
     *   .$createDelegationSignature([oracleQueryId], { onAccount, omitAddress: true })
     * ```
     */
    async $createDelegationSignature(
      ids: Array<Encoded.Any | AensName> = [],
      _options?: { omitAddress?: boolean; onAccount?: AccountBase },
    ): Promise<Uint8Array> {
      const options = { ...instance.$options, ..._options };
      const contractId = instance.$options.address;
      if (options.onAccount == null) throw new IllegalArgumentError('Can\'t create delegation signature without account');
      if (contractId == null) throw new MissingContractAddressError('Can\'t create delegation signature without address');
      return options.onAccount.sign(
        concatBuffers([
          Buffer.from(await options.onNode.getNetworkId()),
          ...options.omitAddress === true ? [] : [decode(options.onAccount.address)],
          ...ids.map((e) => (isNameValid(e) ? produceNameId(e) : e)).map((e) => decode(e)),
          decode(contractId),
        ]),
        options,
      );
    },
  };

  if (validateBytecode != null) {
    if (address == null) throw new MissingContractAddressError('Can\'t validate bytecode without contract address');
    const onChanBytecode = (await getContractByteCode(address, { onNode })).bytecode;
    const isValid: boolean = sourceCode != null
      ? await onCompiler.validateByteCode(
        { bytecode: onChanBytecode, source: sourceCode, options: instance.$options },
      ).then(() => true, () => false)
      : bytecode === onChanBytecode;
    if (!isValid) throw new BytecodeMismatchError(sourceCode != null ? 'source code' : 'bytecode');
  }

  /**
   * Compile contract
   * @returns bytecode
   */
  instance.$compile = async (options = {}): Promise<Encoded.ContractBytearray> => {
    if (instance.$options.bytecode != null) throw new IllegalArgumentError('Contract already compiled');
    if (instance.$options.sourceCode == null) throw new IllegalArgumentError('Can\'t compile without source code');
    instance.$options.bytecode = (await onCompiler.compileContract({
      code: instance.$options.sourceCode, options: { ...instance.$options, ...options },
    })).bytecode as Encoded.ContractBytearray;
    return instance.$options.bytecode;
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
        message = instance._calldata.decodeFateString(returnValue);
        break;
      case 'error':
        message = decode(returnValue).toString();
        break;
      default:
        throw new InternalError(`Unknown return type: ${returnType}`);
    }
    throw new NodeInvocationError(message, transaction);
  };

  const sendAndProcess = async (
    tx: Encoded.Transaction,
    options: any,
  ): Promise<SendAndProcessReturnType> => {
    options = { ...instance.$options, ...options };
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

  interface SendAndProcessReturnType {
    result?: TransformNodeType<ContractCallObject>;
    hash: TxData['hash'];
    tx: Awaited<ReturnType<typeof unpackTx<Tag.ContractCallTx | Tag.ContractCreateTx>>>;
    txData: TxData;
    rawTx: Encoded.Transaction;
  }

  instance._estimateGas = async (name: string, params: any[], options: object): Promise<number> => {
    const { result: { gasUsed } } = await instance
      .$call(name, params, { ...options, callStatic: true });
    // taken from https://github.com/aeternity/aepp-sdk-js/issues/1286#issuecomment-977814771
    return Math.floor(gasUsed * 1.25);
  };

  /**
   * Deploy contract
   * @param params - Contract init function arguments array
   * @param options - Options
   * @returns deploy info
   */
  instance.$deploy = async (
    params = [],
    options?:
    Parameters<typeof instance.$compile>[0] &
    Parameters<typeof instance.$call>[2] &
    Parameters<typeof sendAndProcess>[1],
  ): Promise<Omit<SendAndProcessReturnType, 'hash'> & {
    transaction: SendAndProcessReturnType['hash'];
    owner: Encoded.AccountAddress;
    address: Encoded.ContractAddress;
  }> => {
    const opt = { ...instance.$options, ...options };
    if (instance.$options.bytecode == null) await instance.$compile(opt);
    // @ts-expect-error TODO: need to fix compatibility between return types of `$deploy`, `$call`
    if (opt.callStatic === true) return instance.$call('init', params, opt);
    if (instance.$options.address != null) throw new DuplicateContractError();

    const ownerId = opt.onAccount.address;
    const tx = await _buildTx(Tag.ContractCreateTx, {
      ...opt,
      gasLimit: opt.gasLimit ?? await instance._estimateGas('init', params, opt),
      callData: instance._calldata.encode(instance._name, 'init', params),
      code: instance.$options.bytecode,
      ownerId,
      onNode,
    });
    instance.$options.address = buildContractIdByContractTx(tx);
    const { hash, ...other } = await sendAndProcess(tx, opt);
    return {
      ...other,
      owner: ownerId,
      transaction: hash,
      address: instance.$options.address,
    };
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
  instance.$call = async (fn: string, params: any[] = [], options: object = {}) => {
    const opt = { ...instance.$options, ...options };
    const fnACI = getFunctionACI(fn);
    const contractId = instance.$options.address;

    if (fn == null) throw new MissingFunctionNameError();
    if (fn === 'init' && opt.callStatic === false) throw new InvalidMethodInvocationError('"init" can be called only via dryRun');
    if (fn !== 'init' && opt.amount > 0 && fnACI.payable === false) throw new NotPayableFunctionError(opt.amount, fn);

    let callerId;
    try {
      callerId = opt.onAccount.address;
    } catch (error) {
      const messageToSwallow = 'Account should be an address (ak-prefixed string), or instance of AccountBase, got undefined instead';
      if (
        opt.callStatic !== true || !(error instanceof TypeError)
        || error.message !== messageToSwallow
      ) throw error;
      callerId = DRY_RUN_ACCOUNT.pub;
    }
    const callData = instance._calldata.encode(instance._name, fn, params);

    let res: any;
    if (opt.callStatic === true) {
      if (typeof opt.top === 'number') {
        opt.top = (await getKeyBlock(opt.top, { onNode })).hash;
      }
      const txOpt = { ...opt, onNode, callData };
      if (opt.nonce == null && opt.top != null) {
        opt.nonce = (await getAccount(callerId, { hash: opt.top, onNode })).nonce + 1;
      }
      let tx;
      if (fn === 'init') {
        if (instance.$options.bytecode == null) throw new IllegalArgumentError('Can\'t dry-run "init" without bytecode');
        tx = await _buildTx(
          Tag.ContractCreateTx,
          { ...txOpt, code: instance.$options.bytecode, ownerId: callerId },
        );
      } else {
        if (contractId == null) throw new MissingContractAddressError('Can\'t dry-run contract without address');
        tx = await _buildTx(Tag.ContractCallTx, { ...txOpt, callerId, contractId });
      }

      const { callObj, ...dryRunOther } = await txDryRun(tx, callerId, opt);
      if (callObj == null) throw new UnexpectedTsError();
      handleCallError({
        returnType: callObj.returnType as ContractCallReturnType,
        returnValue: callObj.returnValue as Encoded.ContractBytearray,
      }, tx);
      res = { ...dryRunOther, tx: unpackTx(tx), result: callObj };
    } else {
      if (contractId == null) throw new MissingContractAddressError('Can\'t call contract without address');
      const tx = await _buildTx(Tag.ContractCallTx, {
        ...opt,
        gasLimit: opt.gasLimit ?? await instance._estimateGas(fn, params, opt),
        callerId,
        contractId,
        callData,
      });
      res = await sendAndProcess(tx, opt);
    }
    if (opt.callStatic === true || res.txData.blockHeight != null) {
      res.decodedResult = fnACI.returns != null && fnACI.returns !== 'unit' && fn !== 'init'
        && instance._calldata.decode(instance._name, fn, res.result.returnValue);
      res.decodedEvents = instance.$decodeEvents(res.result.log, opt);
    }
    return res;
  };

  /**
   * @param ctAddress - Contract address that emitted event
   * @param nameHash - Hash of emitted event name
   * @param options - Options
   * @returns Contract name
   * @throws {@link MissingEventDefinitionError}
   * @throws {@link AmbiguousEventDefinitionError}
   */
  function getContractNameByEvent(
    ctAddress: Encoded.ContractAddress,
    nameHash: BigInt,
    { contractAddressToName }: {
      contractAddressToName?: { [key: Encoded.ContractAddress]: string };
    },
  ): string {
    const addressToName = { ...instance.$options.contractAddressToName, ...contractAddressToName };
    if (addressToName[ctAddress] != null) return addressToName[ctAddress];

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
      case 0: throw new MissingEventDefinitionError(nameHash.toString(), ctAddress);
      case 1: return matchedEvents[0][0];
      default: throw new AmbiguousEventDefinitionError(ctAddress, matchedEvents);
    }
  }

  /**
   * Decode Events
   * @param events - Array of encoded events (callRes.result.log)
   * @param options - Options
   * @returns DecodedEvents
   */
  instance.$decodeEvents = (
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
      const decoded = instance._calldata.decodeEvent(contractName, event.data, topics);
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
        if (name === 'init') return instance.$deploy(args, { callStatic, ...options });
        return instance.$call(name, args, { callStatic, ...options });
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
