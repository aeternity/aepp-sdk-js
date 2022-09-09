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
  data: Encoded.ContractBytearray;
  topics: Array<string | number>;
}

interface DecodedEvent {
  name: string;
  args: unknown[];
  contract: {
    name: string;
    address: Encoded.ContractAddress;
  };
}

type TxData = Awaited<ReturnType<typeof send>>;

interface SendAndProcessReturnType {
  result?: TransformNodeType<ContractCallObject>;
  hash: TxData['hash'];
  tx: Awaited<ReturnType<typeof unpackTx<Tag.ContractCallTx | Tag.ContractCreateTx>>>;
  txData: TxData;
  rawTx: Encoded.Transaction;
}

export interface ContractMethodsBase { [key: string]: (...args: any[]) => any }

type MethodsToContractApi<M extends ContractMethodsBase> = {
  [Name in keyof M]:
  M[Name] extends (...args: infer Args) => infer Ret
    ? (...args: [
      ...Args,
      ...[] | [Name extends 'init'
        ? Parameters<Contract<M>['$deploy']>[1] : Parameters<Contract<M>['$call']>[2]],
    ]) => Promise<
    Awaited<ReturnType<Contract<M>['$call']>> &
    { decodedResult?: Ret }
    >
    : never
};

type ContractWithMethods<M extends ContractMethodsBase> = Contract<M> & MethodsToContractApi<M>;

type MethodNames<M extends ContractMethodsBase> = keyof M & string | 'init';

type MethodParameters<M extends ContractMethodsBase, Fn extends MethodNames<M>> =
  Fn extends 'init'
    ? M extends { init: any } ? Parameters<M['init']> : []
    : Parameters<M[Fn]>;

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
 * Then sdk decide to make on-chain or static call(dry-run API) transaction based on function is
 * stateful or not
 */
class Contract<M extends ContractMethodsBase> {
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
   * const contract = await aeSdk.initializeContract({ address: 'ct_asd2ks...' })
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
   * const contract = await aeSdk.initializeContract({ address: 'ct_asd2ks...' })
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
    const options = { ...this.$options, ..._options };
    const contractId = this.$options.address;
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
  }

  /**
   * Compile contract
   * @returns bytecode
   */
  async $compile(): Promise<Encoded.ContractBytearray> {
    if (this.$options.bytecode != null) throw new IllegalArgumentError('Contract already compiled');
    if (this.$options.sourceCode == null) throw new IllegalArgumentError('Can\'t compile without source code');
    this.$options.bytecode = (await this.$options.onCompiler.compileContract({
      code: this.$options.sourceCode, options: { fileSystem: this.$options.fileSystem },
    })).bytecode as Encoded.ContractBytearray;
    return this.$options.bytecode;
  }

  protected _handleCallError(
    { returnType, returnValue }: {
      returnType: ContractCallReturnType;
      returnValue: Encoded.ContractBytearray;
    },
    transaction: string,
  ): void {
    let message: string;
    switch (returnType) {
      case 'ok': return;
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

  protected async _sendAndProcess(
    tx: Encoded.Transaction,
    options: any,
  ): Promise<SendAndProcessReturnType> {
    options = { ...this.$options, ...options };
    const txData = await send(tx, options);
    const result = {
      hash: txData.hash,
      tx: unpackTx<Tag.ContractCallTx | Tag.ContractCreateTx>(txData.rawTx),
      txData,
      rawTx: txData.rawTx,
    };
    if (txData.blockHeight == null) return result;
    const { callInfo } = await this.$options.onNode.getTransactionInfoByHash(txData.hash);
    Object.assign(result.txData, callInfo); // TODO: don't duplicate data in result
    // @ts-expect-error TODO api should be updated to match types
    this._handleCallError(callInfo, tx);
    return { ...result, result: callInfo };
  }

  async _estimateGas<Fn extends MethodNames<M>>(
    name: Fn,
    params: MethodParameters<M, Fn>,
    options: object = {},
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
    options?: Parameters<Contract<M>['$call']>[2] & Parameters<Contract<M>['_sendAndProcess']>[1],
  ): Promise<Omit<SendAndProcessReturnType, 'hash'> & {
      transaction?: Encoded.TxHash;
      owner?: Encoded.AccountAddress;
      address?: Encoded.ContractAddress;
    }> {
    const opt = { ...this.$options, ...options };
    if (this.$options.bytecode == null) await this.$compile();
    if (opt.callStatic === true) return this.$call('init', params, opt);
    if (this.$options.address != null) throw new DuplicateContractError();

    const ownerId = opt.onAccount.address;
    const tx = await _buildTx(Tag.ContractCreateTx, {
      ...opt,
      gasLimit: opt.gasLimit ?? await this._estimateGas('init', params, opt),
      callData: this._calldata.encode(this._name, 'init', params),
      code: this.$options.bytecode,
      ownerId,
    });
    this.$options.address = buildContractIdByContractTx(tx);
    const { hash, ...other } = await this._sendAndProcess(tx, opt);
    return {
      ...other,
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
  protected _getFunctionACI(name: string): Partial<FunctionACI> {
    const fn = this._aci.encodedAci.contract.functions.find(
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
  async $call<Fn extends MethodNames<M>>(
    fn: Fn,
    params: MethodParameters<M, Fn>,
    options: object = {},
  ): Promise<{
      decodedResult?: any;
      decodedEvents?: ReturnType<Contract<M>['$decodeEvents']>;
    } & SendAndProcessReturnType> {
    const opt = { ...this.$options, ...options };
    const fnACI = this._getFunctionACI(fn);
    const contractId = this.$options.address;
    const { onNode } = opt;

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
    const callData = this._calldata.encode(this._name, fn, params);

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
        if (this.$options.bytecode == null) throw new IllegalArgumentError('Can\'t dry-run "init" without bytecode');
        tx = await _buildTx(
          Tag.ContractCreateTx,
          { ...txOpt, code: this.$options.bytecode, ownerId: callerId },
        );
      } else {
        if (contractId == null) throw new MissingContractAddressError('Can\'t dry-run contract without address');
        tx = await _buildTx(Tag.ContractCallTx, { ...txOpt, callerId, contractId });
      }

      const { callObj, ...dryRunOther } = await txDryRun(tx, callerId, opt);
      if (callObj == null) throw new UnexpectedTsError();
      this._handleCallError({
        returnType: callObj.returnType as ContractCallReturnType,
        returnValue: callObj.returnValue as Encoded.ContractBytearray,
      }, tx);
      res = { ...dryRunOther, tx: unpackTx(tx), result: callObj };
    } else {
      if (contractId == null) throw new MissingContractAddressError('Can\'t call contract without address');
      const tx = await _buildTx(Tag.ContractCallTx, {
        ...opt,
        gasLimit: opt.gasLimit ?? await this._estimateGas(fn, params, opt),
        callerId,
        contractId,
        callData,
      });
      res = await this._sendAndProcess(tx, opt);
    }
    if (opt.callStatic === true || res.txData.blockHeight != null) {
      res.decodedResult = fnACI.returns != null && fnACI.returns !== 'unit' && fn !== 'init'
        && this._calldata.decode(this._name, fn, res.result.returnValue);
      res.decodedEvents = this.$decodeEvents(res.result.log, opt);
    }
    return res;
  }

  /**
   * @param ctAddress - Contract address that emitted event
   * @param nameHash - Hash of emitted event name
   * @param options - Options
   * @returns Contract name
   * @throws {@link MissingEventDefinitionError}
   * @throws {@link AmbiguousEventDefinitionError}
   */
  protected _getContractNameByEvent(
    ctAddress: Encoded.ContractAddress,
    nameHash: BigInt,
    { contractAddressToName }: {
      contractAddressToName?: { [key: Encoded.ContractAddress]: string };
    },
  ): string {
    const addressToName = { ...this.$options.contractAddressToName, ...contractAddressToName };
    if (addressToName[ctAddress] != null) return addressToName[ctAddress];

    // TODO: consider using a third-party library
    const isEqual = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

    const matchedEvents = [this._aci.encodedAci, ...this._aci.externalEncodedAci]
      .filter(({ contract }) => contract?.event)
      .map(({ contract }) => [contract.name, contract.event.variant])
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
    { omitUnknown, ...opt }: { omitUnknown?: boolean } &
    Parameters<Contract<M>['_getContractNameByEvent']>[2] = {},
  ): DecodedEvent[] {
    return events
      .map((event) => {
        const topics = event.topics.map((t: string | number) => BigInt(t));
        let contractName;
        try {
          contractName = this._getContractNameByEvent(event.address, topics[0], opt);
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
      sourceCode,
      bytecode,
      aci,
      address,
      fileSystem,
      validateBytecode,
      ...otherOptions
    }: Omit<ConstructorParameters<typeof Contract>[0], 'aci' | 'address'> & {
      validateBytecode?: boolean;
      aci?: Aci;
      address?: Encoded.ContractAddress | AensName;
    },
  ): Promise<ContractWithMethods<M>> {
    if (aci == null && sourceCode != null) {
      // TODO: should be fixed when the compiledAci interface gets updated
      aci = await onCompiler.generateACI({ code: sourceCode, options: { fileSystem } }) as Aci;
    }
    if (aci == null) throw new MissingContractDefError();

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

    if (validateBytecode != null) {
      if (address == null) throw new MissingContractAddressError('Can\'t validate bytecode without contract address');
      const onChanBytecode = (await getContractByteCode(address, { onNode })).bytecode;
      const isValid: boolean = sourceCode != null
        ? await onCompiler.validateByteCode(
          { bytecode: onChanBytecode, source: sourceCode, options: { fileSystem } },
        ).then(() => true, () => false)
        : bytecode === onChanBytecode;
      if (!isValid) throw new BytecodeMismatchError(sourceCode != null ? 'source code' : 'bytecode');
    }

    return new ContractWithMethods<M>({
      onCompiler, onNode, sourceCode, bytecode, aci, address, fileSystem, ...otherOptions,
    });
  }

  _aci: Aci;

  _name: string;

  _calldata: Calldata;

  $options: {
    sourceCode?: string;
    bytecode?: Encoded.ContractBytearray;
    address?: Encoded.ContractAddress;
    onCompiler: Compiler;
    onNode: Node;
    omitUnknown?: boolean;
    contractAddressToName?: { [key: Encoded.ContractAddress]: string };
    [key: string]: any;
  };

  constructor({ aci, ...otherOptions }: {
    onAccount?: AccountBase;
    onCompiler: Compiler;
    onNode: Node;
    sourceCode?: string;
    bytecode?: Encoded.ContractBytearray;
    aci: Aci;
    address?: Encoded.ContractAddress;
    fileSystem?: Record<string, string>;
    [key: string]: any;
  }) {
    this._aci = aci;
    this._name = aci.encodedAci.contract.name;
    this._calldata = new Calldata([aci.encodedAci, ...aci.externalEncodedAci]);
    this.$options = { callStatic: false, ...otherOptions };

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
      Object.fromEntries(this._aci.encodedAci.contract.functions
        .map(({ name, arguments: aciArgs, stateful }: FunctionACI) => {
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
