/**
 * Contract module - routines to interact with the æternity contract
 *
 * High level documentation of the contracts are available at
 * https://github.com/aeternity/protocol/tree/master/contracts and
 */

import { Encoder as Calldata } from '@aeternity/aepp-calldata';
import { DRY_RUN_ACCOUNT } from '../tx/builder/schema';
import { Tag, AensName } from '../tx/builder/constants';
import {
  buildContractIdByContractTx, unpackTx, buildTxAsync, BuildTxOptions, buildTxHash,
} from '../tx/builder';
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
  NoWalletConnectedError,
  ContractError,
} from '../utils/errors';
import { hash as calcHash } from '../utils/crypto';
import {
  ContractCallObject as NodeContractCallObject, Event as NodeEvent,
} from '../apis/node';
import CompilerBase, { Aci } from './compiler/Base';
import Node, { TransformNodeType } from '../Node';
import {
  getAccount, getContract, getContractByteCode, resolveName, txDryRun, sendTransaction,
  SendTransactionOptions,
} from '../chain';
import AccountBase from '../account/Base';
import { TxUnpacked } from '../tx/builder/schema.generated';
import { isAccountNotFoundError } from '../utils/other';

type ContractAci = NonNullable<Aci[0]['contract']>;
type FunctionAci = ContractAci['functions'][0];

interface Event extends NodeEvent {
  address: Encoded.ContractAddress;
  data: Encoded.ContractBytearray;
}

export interface ContractCallObject extends TransformNodeType<NodeContractCallObject> {
  returnValue: Encoded.ContractBytearray;
  log: Event[];
}

interface DecodedEvent {
  name: string;
  args: unknown[];
  contract: {
    name: string;
    address: Encoded.ContractAddress;
  };
}

type TxData = Awaited<ReturnType<typeof sendTransaction>>;

interface SendAndProcessReturnType {
  result?: ContractCallObject;
  hash: TxData['hash'];
  tx: TxUnpacked & { tag: Tag.SignedTx | Tag.ContractCallTx | Tag.ContractCreateTx };
  txData: TxData;
  rawTx: Encoded.Transaction;
}

export interface ContractMethodsBase { [key: string]: (...args: any[]) => any }

type MethodsToContractApi<M extends ContractMethodsBase> = {
  [Name in keyof M]:
  M[Name] extends (...args: infer Args) => any
    ? (...args: [
      ...Args,
      ...[] | [Name extends 'init'
        ? Parameters<Contract<M>['$deploy']>[1] : Parameters<Contract<M>['$call']>[2]],
    ]) => ReturnType<Contract<M>['$call']>
    : never
};

type ContractWithMethods<M extends ContractMethodsBase> = Contract<M> & MethodsToContractApi<M>;

type MethodNames<M extends ContractMethodsBase> = keyof M & string | 'init';

type MethodParameters<M extends ContractMethodsBase, Fn extends MethodNames<M>> =
  Fn extends 'init'
    ? M extends { init: any } ? Parameters<M['init']> : []
    : Parameters<M[Fn]>;

interface GetContractNameByEventOptions {
  contractAddressToName?: { [key: Encoded.ContractAddress]: string };
}

interface GetCallResultByHashReturnType<M extends ContractMethodsBase, Fn extends MethodNames<M>> {
  decodedResult: ReturnType<M[Fn]>;
  decodedEvents?: ReturnType<Contract<M>['$decodeEvents']>;
}

/**
 * Generate contract ACI object with predefined js methods for contract usage - can be used for
 * creating a reference to already deployed contracts
 * @category contract
 * @param options - Options object
 * @returns JS Contract API
 * @example
 * ```js
 * const contractIns = await aeSdk.initializeContract({ sourceCode })
 * await contractIns.$deploy([321]) or await contractIns.init(321)
 * const callResult = await contractIns.$call('setState', [123])
 * const staticCallResult = await contractIns.$call('setState', [123], { callStatic: true })
 * ```
 * Also you can call contract like: `await contractIns.setState(123, options)`
 * Then sdk decide to make on-chain or static call (dry-run API) transaction based on function is
 * stateful or not
 */
class Contract<M extends ContractMethodsBase> {
  /**
   * Compile contract
   * @returns bytecode
   */
  async $compile(): Promise<Encoded.ContractBytearray> {
    if (this.$options.bytecode != null) return this.$options.bytecode;
    if (this.$options.onCompiler == null) throw new IllegalArgumentError('Can\'t compile without compiler');
    if (this.$options.sourceCode != null) {
      const { bytecode } = await this.$options.onCompiler
        .compileBySourceCode(this.$options.sourceCode, this.$options.fileSystem);
      this.$options.bytecode = bytecode;
    }
    if (this.$options.sourceCodePath != null) {
      const { bytecode } = await this.$options.onCompiler.compile(this.$options.sourceCodePath);
      this.$options.bytecode = bytecode;
    }
    if (this.$options.bytecode == null) {
      throw new IllegalArgumentError('Can\'t compile without sourceCode and sourceCodePath');
    }
    return this.$options.bytecode;
  }

  #getCallResult<Fn extends MethodNames<M>>(
    { returnType, returnValue, log }: ContractCallObject,
    fnName: Fn,
    transaction: Encoded.Transaction | undefined,
    options: Parameters<Contract<M>['$decodeEvents']>[1],
  ): GetCallResultByHashReturnType<M, Fn> {
    let message: string;
    switch (returnType) {
      case 'ok': {
        const fnAci = this.#getFunctionAci(fnName);
        return {
          decodedResult: this._calldata.decode(this._name, fnAci.name, returnValue),
          decodedEvents: this.$decodeEvents(log, options),
        };
      }
      case 'revert':
        message = this._calldata.decodeFateString(returnValue);
        break;
      case 'error':
        message = decode(returnValue).toString();
        break;
      default:
        throw new InternalError(`Unknown return type: ${returnType}`);
    }
    throw new NodeInvocationError(message, transaction);
  }

  async #sendAndProcess<Fn extends MethodNames<M>>(
    tx: Encoded.Transaction,
    fnName: Fn,
    options: SendTransactionOptions & Parameters<Contract<M>['$getCallResultByTxHash']>[2],
  ): Promise<SendAndProcessReturnType & Partial<GetCallResultByHashReturnType<M, Fn>>> {
    const txData = await sendTransaction(tx, { ...this.$options, ...options });
    return {
      hash: txData.hash,
      tx: unpackTx<Tag.ContractCallTx | Tag.ContractCreateTx>(txData.rawTx),
      txData,
      rawTx: txData.rawTx,
      ...txData.blockHeight != null && (
        await this.$getCallResultByTxHash(txData.hash, fnName, options)
      ),
    };
  }

  async $getCallResultByTxHash<Fn extends MethodNames<M>>(
    hash: Encoded.TxHash,
    fnName: Fn,
    options?: Parameters<Contract<M>['$decodeEvents']>[1],
  ): Promise<GetCallResultByHashReturnType<M, Fn> & { result: ContractCallObject }> {
    const { callInfo } = await this.$options.onNode.getTransactionInfoByHash(hash);
    if (callInfo == null) {
      throw new ContractError(`callInfo is not available for transaction ${hash}`);
    }
    const callInfoTyped = callInfo as ContractCallObject;
    return {
      ...this.#getCallResult(callInfoTyped, fnName, undefined, options),
      result: callInfoTyped,
    };
  }

  async _estimateGas<Fn extends MethodNames<M>>(
    name: Fn,
    params: MethodParameters<M, Fn>,
    options: Omit<Parameters<Contract<M>['$call']>[2], 'callStatic'> = {},
  ): Promise<number> {
    const { result } = await this.$call(name, params, { ...options, callStatic: true });
    if (result == null) throw new UnexpectedTsError();
    const { gasUsed } = result;
    // taken from https://github.com/aeternity/aepp-sdk-js/issues/1286#issuecomment-977814771
    return Math.floor(gasUsed * 1.25);
  }

  /**
   * Deploy contract
   * @param params - Contract init function arguments array
   * @param options - Options
   * @returns deploy info
   */
  async $deploy(
    params: MethodParameters<M, 'init'>,
    options?: Parameters<Contract<M>['$call']>[2]
    & Partial<BuildTxOptions<Tag.ContractCreateTx, 'ownerId' | 'code' | 'callData'>>,
  ): Promise<Omit<SendAndProcessReturnType, 'hash'> & {
      transaction?: Encoded.TxHash;
      owner?: Encoded.AccountAddress;
      address?: Encoded.ContractAddress;
      decodedEvents?: ReturnType<Contract<M>['$decodeEvents']>;
    }> {
    const { callStatic, ...opt } = { ...this.$options, ...options };
    if (this.$options.bytecode == null) await this.$compile();
    if (callStatic === true) return this.$call('init', params, { ...opt, callStatic });
    if (this.$options.address != null) throw new DuplicateContractError();

    if (opt.onAccount == null) throw new IllegalArgumentError('Can\'t deploy without account');
    const ownerId = opt.onAccount.address;
    if (this.$options.bytecode == null) throw new IllegalArgumentError('Can\'t deploy without bytecode');
    const tx = await buildTxAsync({
      ...opt,
      tag: Tag.ContractCreateTx,
      gasLimit: opt.gasLimit ?? await this._estimateGas('init', params, opt),
      callData: this._calldata.encode(this._name, 'init', params),
      code: this.$options.bytecode,
      ownerId,
    });
    const { hash, ...other } = await this.#sendAndProcess(
      tx,
      'init',
      { ...opt, onAccount: opt.onAccount },
    );
    this.$options.address = buildContractIdByContractTx(tx);
    return {
      ...other,
      ...other.result?.log != null && {
        decodedEvents: this.$decodeEvents(other.result.log, opt),
      },
      owner: ownerId,
      transaction: hash,
      address: this.$options.address,
    };
  }

  /**
   * Get function schema from contract ACI object
   * @param name - Function name
   * @returns function ACI
   */
  #getFunctionAci(name: string): FunctionAci {
    const fn = this.#aciContract.functions.find(
      (f: { name: string }) => f.name === name,
    );
    if (fn != null) {
      return fn;
    }
    if (name === 'init') {
      return {
        arguments: [], name: 'init', payable: false, returns: 'unit', stateful: true,
      };
    }
    throw new NoSuchContractFunctionError(`Function ${name} doesn't exist in contract`);
  }

  /**
   * Call contract function
   * @param fn - Function name
   * @param params - Array of function arguments
   * @param options - Array of function arguments
   * @returns CallResult
   */
  async $call<Fn extends MethodNames<M>>(
    fn: Fn,
    params: MethodParameters<M, Fn>,
    options: Partial<BuildTxOptions<Tag.ContractCallTx, 'callerId' | 'contractId' | 'callData'>>
    & Parameters<Contract<M>['$decodeEvents']>[1]
    & Omit<SendTransactionOptions, 'onAccount' | 'onNode'>
    & Omit<Parameters<typeof txDryRun>[2], 'onNode'>
    & { onAccount?: AccountBase; onNode?: Node; callStatic?: boolean } = {},
  ): Promise<SendAndProcessReturnType & Partial<GetCallResultByHashReturnType<M, Fn>>> {
    const { callStatic, top, ...opt } = { ...this.$options, ...options };
    const fnAci = this.#getFunctionAci(fn);
    const contractId = this.$options.address;
    const { onNode } = opt;

    if (fn == null) throw new MissingFunctionNameError();
    if (fn === 'init' && callStatic !== true) throw new InvalidMethodInvocationError('"init" can be called only via dryRun');
    if (fn !== 'init' && opt.amount != null && Number(opt.amount) > 0 && !fnAci.payable) {
      throw new NotPayableFunctionError(opt.amount, fn);
    }

    let callerId;
    try {
      if (opt.onAccount == null) throw new InternalError('Use fallback account');
      callerId = opt.onAccount.address;
    } catch (error) {
      const useFallbackAccount = callStatic === true && (
        (error instanceof TypeError && error.message === 'Account should be an address (ak-prefixed string), or instance of AccountBase, got undefined instead')
        || (error instanceof NoWalletConnectedError)
        || (error instanceof InternalError && error.message === 'Use fallback account')
      );
      if (!useFallbackAccount) throw error;
      callerId = DRY_RUN_ACCOUNT.pub;
    }
    const callData = this._calldata.encode(this._name, fn, params);

    if (callStatic === true) {
      if (opt.nonce == null) {
        const topOption = top != null && { [typeof top === 'number' ? 'height' : 'hash']: top };
        const account = await getAccount(callerId, { ...topOption, onNode }).catch((error) => {
          if (!isAccountNotFoundError(error)) throw error;
          return { kind: 'basic', nonce: 0 };
        });
        opt.nonce = account.kind === 'generalized' ? 0 : account.nonce + 1;
      }

      const txOpt = { ...opt, onNode, callData };
      let tx;
      if (fn === 'init') {
        if (this.$options.bytecode == null) throw new IllegalArgumentError('Can\'t dry-run "init" without bytecode');
        tx = await buildTxAsync({
          ...txOpt, tag: Tag.ContractCreateTx, code: this.$options.bytecode, ownerId: callerId,
        });
      } else {
        if (contractId == null) throw new MissingContractAddressError('Can\'t dry-run contract without address');
        tx = await buildTxAsync({
          ...txOpt, tag: Tag.ContractCallTx, callerId, contractId,
        });
      }

      const { callObj, ...dryRunOther } = await txDryRun(tx, callerId, { ...opt, top });
      if (callObj == null) {
        throw new InternalError(`callObj is not available for transaction ${tx}`);
      }
      const callInfoTyped = callObj as ContractCallObject;
      return {
        ...dryRunOther,
        ...this.#getCallResult(callInfoTyped, fn, tx, opt),
        tx: unpackTx(tx),
        result: callInfoTyped,
        rawTx: tx,
        hash: buildTxHash(tx),
        txData: undefined as any,
      };
    }

    if (top != null) throw new IllegalArgumentError('Can\'t handle `top` option in on-chain contract call');
    if (contractId == null) throw new MissingContractAddressError('Can\'t call contract without address');
    const tx = await buildTxAsync({
      ...opt,
      tag: Tag.ContractCallTx,
      gasLimit: opt.gasLimit ?? await this._estimateGas(fn, params, opt),
      callerId,
      contractId,
      callData,
    });
    if (opt.onAccount == null) throw new IllegalArgumentError('Can\'t call contract on chain without account');
    return this.#sendAndProcess(tx, fn, { ...opt, onAccount: opt.onAccount });
  }

  /**
   * @param ctAddress - Contract address that emitted event
   * @param nameHash - Hash of emitted event name
   * @param options - Options
   * @returns Contract name
   * @throws {@link MissingEventDefinitionError}
   * @throws {@link AmbiguousEventDefinitionError}
   */
  #getContractNameByEvent(
    ctAddress: Encoded.ContractAddress,
    nameHash: BigInt,
    { contractAddressToName }: GetContractNameByEventOptions,
  ): string {
    const addressToName = { ...this.$options.contractAddressToName, ...contractAddressToName };
    if (addressToName[ctAddress] != null) return addressToName[ctAddress];

    // TODO: consider using a third-party library
    const isEqual = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

    const contracts = this._aci
      .map(({ contract }) => contract)
      .filter((contract) => contract?.event) as ContractAci[];
    const matchedEvents = contracts
      .map((contract) => [contract.name, contract.event.variant])
      .map(([name, events]) => events.map((event: {}) => (
        [name, Object.keys(event)[0], Object.values(event)[0]]
      )))
      .flat()
      .filter(([, eventName]) => BigInt(`0x${calcHash(eventName).toString('hex')}`) === nameHash)
      .filter(([, , type], idx, arr) => !arr.slice(0, idx).some((el) => isEqual(el[2], type)));
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
  $decodeEvents(
    events: Event[],
    { omitUnknown, ...opt }: { omitUnknown?: boolean } & GetContractNameByEventOptions = {},
  ): DecodedEvent[] {
    return events
      .map((event) => {
        const topics = event.topics.map((t: string | number) => BigInt(t));
        let contractName;
        try {
          contractName = this.#getContractNameByEvent(event.address, topics[0], opt);
        } catch (error) {
          if ((omitUnknown ?? false) && error instanceof MissingEventDefinitionError) return null;
          throw error;
        }
        const decoded = this._calldata.decodeEvent(contractName, event.data, topics);
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
  }

  static async initialize<M extends ContractMethodsBase>(
    {
      onCompiler,
      onNode,
      bytecode,
      aci,
      address,
      sourceCodePath,
      sourceCode,
      fileSystem,
      validateBytecode,
      ...otherOptions
    }: Omit<ConstructorParameters<typeof Contract>[0], 'aci' | 'address'> & {
      validateBytecode?: boolean;
      aci?: Aci;
      address?: Encoded.ContractAddress | AensName;
    },
  ): Promise<ContractWithMethods<M>> {
    if (aci == null && onCompiler != null) {
      let res;
      if (sourceCodePath != null) res = await onCompiler.compile(sourceCodePath);
      if (sourceCode != null) res = await onCompiler.compileBySourceCode(sourceCode, fileSystem);
      if (res != null) {
        aci = res.aci;
        bytecode ??= res.bytecode;
      }
    }
    if (aci == null) throw new MissingContractDefError();

    if (address != null) {
      address = await resolveName(
        address,
        'contract_pubkey',
        { resolveByNode: true, onNode },
      ) as Encoded.ContractAddress;
    }

    if (address == null && sourceCode == null && sourceCodePath == null && bytecode == null) {
      throw new MissingContractAddressError('Can\'t create instance by ACI without address');
    }

    if (address != null) {
      const contract = await getContract(address, { onNode });
      if (contract.active == null) throw new InactiveContractError(address);
    }

    if (validateBytecode === true) {
      if (address == null) throw new MissingContractAddressError('Can\'t validate bytecode without contract address');
      const onChanBytecode = (await getContractByteCode(address, { onNode })).bytecode;
      let isValid = false;
      if (bytecode != null) isValid = bytecode === onChanBytecode;
      else if (sourceCode != null) {
        if (onCompiler == null) throw new IllegalArgumentError('Can\'t validate bytecode without compiler');
        isValid = await onCompiler.validateBySourceCode(onChanBytecode, sourceCode, fileSystem);
      } else if (sourceCodePath != null) {
        if (onCompiler == null) throw new IllegalArgumentError('Can\'t validate bytecode without compiler');
        isValid = await onCompiler.validate(onChanBytecode, sourceCodePath);
      }
      if (!isValid) {
        throw new BytecodeMismatchError((sourceCode ?? sourceCodePath) != null ? 'source code' : 'bytecode');
      }
    }

    return new ContractWithMethods<M>({
      onCompiler,
      onNode,
      sourceCode,
      sourceCodePath,
      bytecode,
      aci,
      address,
      fileSystem,
      ...otherOptions,
    });
  }

  _aci: Aci;

  #aciContract: ContractAci;

  _name: string;

  _calldata: Calldata;

  $options: Omit<ConstructorParameters<typeof Contract>[0], 'aci'>;

  constructor({ aci, ...otherOptions }: {
    onCompiler?: CompilerBase;
    onNode: Node;
    bytecode?: Encoded.ContractBytearray;
    aci: Aci;
    address?: Encoded.ContractAddress;
    sourceCodePath?: Parameters<CompilerBase['compile']>[0];
    sourceCode?: Parameters<CompilerBase['compileBySourceCode']>[0];
    fileSystem?: Parameters<CompilerBase['compileBySourceCode']>[1];
  } & Parameters<Contract<M>['$deploy']>[1]) {
    this._aci = aci;
    const aciLast = aci[aci.length - 1];
    if (aciLast.contract == null) {
      throw new IllegalArgumentError(`The last 'aci' item should have 'contract' key, got ${Object.keys(aciLast)} keys instead`);
    }
    this.#aciContract = aciLast.contract;
    this._name = this.#aciContract.name;
    this._calldata = new Calldata(aci);
    this.$options = otherOptions;

    /**
     * Generate proto function based on contract function using Contract ACI schema
     * All function can be called like:
     * ```js
     * await contract.testFunction()
     * ```
     * then sdk will decide to use dry-run or send tx
     * on-chain base on if function stateful or not.
     * Also, you can manually do that:
     * ```js
     * await contract.testFunction({ callStatic: true }) // use call-static (dry-run)
     * await contract.testFunction({ callStatic: false }) // send tx on-chain
     * ```
     */
    Object.assign(
      this,
      Object.fromEntries(this.#aciContract.functions
        .map(({ name, arguments: aciArgs, stateful }: FunctionAci) => {
          const callStatic = name !== 'init' && !stateful;
          return [
            name,
            async (...args: any) => {
              const options = args.length === aciArgs.length + 1 ? args.pop() : {};
              if (typeof options !== 'object') throw new TypeError(`Options should be an object: ${options}`);
              if (name === 'init') return this.$deploy(args, { callStatic, ...options });
              return this.$call(name, args, { callStatic, ...options });
            },
          ];
        })),
    );
  }
}

interface ContractWithMethodsClass {
  new <M extends ContractMethodsBase>(
    options: ConstructorParameters<typeof Contract>[0],
  ): ContractWithMethods<M>;
  initialize: typeof Contract['initialize'];
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
const ContractWithMethods: ContractWithMethodsClass = Contract as any;

export default ContractWithMethods;
