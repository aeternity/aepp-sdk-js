import * as chainMethods from './chain';
import * as txMethods from './tx';
import * as aensMethods from './aens';
import * as spendMethods from './spend';
import * as oracleMethods from './oracle';
import * as contractMethods from './contract/methods';
import * as contractGaMethods from './contract/ga';
import * as deprecatedMethods from './deprecated/methods';
import { _buildTx } from './tx';
import { mapObject } from './utils/other';
import Node, { getNetworkId } from './Node';
import { AE_AMOUNT_FORMATS } from './utils/amount-formatter';
import { AMOUNT } from './tx/builder/schema';
import { Tag } from './tx/builder/constants';
import MemoryAccount, { Keypair } from './account/Memory';
import AccountBase, { isAccountBase } from './account/Base';
import {
  CompilerError,
  DuplicateNodeError,
  NodeNotFoundError,
  NotImplementedError,
  TypeError,
} from './utils/errors';
import { Encoded } from './utils/encoder';
import Compiler from './contract/Compiler';

export type Account = Keypair | AccountBase | any;

type NodeInfo = Awaited<ReturnType<Node['getNodeInfo']>> & { name: string };

function getValueOrErrorProxy<Value extends object>(valueCb: () => Value): Value {
  try {
    return valueCb();
  } catch (error) {
    return new Proxy(
      {},
      Object.fromEntries(['get', 'set', 'has'].map((name) => [name, () => { throw error; }])),
    ) as Value;
  }
}

/**
 * Basic AeSdk class
 *
 * AeSdkBase objects are the composition of:
 * - chain methods
 * - tx methods
 * - aens methods
 * - spend methods
 * - oracle methods
 * - contract methods
 * - contract ga methods
 * Only by providing the joint functionality of them, most more advanced
 * operations, i.e. the ones with actual use value on the chain, become
 * available.
 */
class AeSdkBase {
  _options: {
    denomination: AE_AMOUNT_FORMATS;
    amount: number;
    [key: string]: any;
  } = { denomination: AE_AMOUNT_FORMATS.AETTOS, amount: AMOUNT };

  pool: Map<string, Node> = new Map();

  selectedNodeName?: string;

  compilerApi: Compiler;

  /**
   * @param options - Options
   * @param options.nodes - Array of nodes
   * @param options.compilerUrl - Url for compiler API
   * @param options.ignoreVersion - Don't check node or compiler version
   */
  constructor(
    {
      nodes = [], compilerUrl, ignoreVersion = false, ...options
    }:
    {
      nodes?: Array<{ name: string; instance: Node }>;
      compilerUrl?: string;
      ignoreVersion?: boolean;
      [key: string]: any; // TODO: consider combining all possible options instead
    } = {},
  ) {
    Object.assign(this._options, options);

    nodes.forEach(({ name, instance }, i) => this.addNode(name, instance, i === 0));

    if (compilerUrl == null) {
      this.compilerApi = getValueOrErrorProxy(() => {
        throw new CompilerError('You can\'t use Compiler API. Compiler is not ready!');
      });
    } else this.setCompilerUrl(compilerUrl, { ignoreVersion });
  }

  setCompilerUrl(
    compilerUrl: string,
    { ignoreVersion = false }: { ignoreVersion?: boolean } = {},
  ): void {
    this.compilerApi = new Compiler(compilerUrl, { ignoreVersion });
  }

  get api(): Node {
    this.ensureNodeConnected();
    return this.pool.get(this.selectedNodeName) as Node;
  }

  /**
   * Add Node
   * @param name - Node name
   * @param node - Node instance
   * @param select - Select this node as current
   * @example
   * ```js
   * // add and select new node with name 'testNode'
   * aeSdkBase.addNode('testNode', new Node({ url }), true)
   * ```
   */
  addNode(name: string, node: Node, select = false): void {
    if (this.pool.has(name)) throw new DuplicateNodeError(name);

    this.pool.set(name, node);
    if (select || this.selectedNodeName == null) {
      this.selectNode(name);
    }
  }

  /**
   * Select Node
   * @param name - Node name
   * @example
   * nodePool.selectNode('testNode')
   */
  selectNode(name: string): void {
    if (!this.pool.has(name)) throw new NodeNotFoundError(`Node with name ${name} not in pool`);
    this.selectedNodeName = name;
  }

  /**
   * Get NetworkId of current Node
   * @example
   * nodePool.getNetworkId()
   */
  readonly getNetworkId = getNetworkId;

  /**
   * Check if you have selected node
   * @example
   * nodePool.isNodeConnected()
   */
  isNodeConnected(): this is AeSdkBase & { selectedNodeName: string } {
    return this.selectedNodeName != null;
  }

  protected ensureNodeConnected(): asserts this is AeSdkBase & { selectedNodeName: string } {
    if (!this.isNodeConnected()) {
      throw new NodeNotFoundError('You can\'t use Node API. Node is not connected or not defined!');
    }
  }

  /**
   * Get information about node
   * @example
   * ```js
   * nodePool.getNodeInfo() // { name, version, networkId, protocol, ... }
   * ```
   */
  async getNodeInfo(): Promise<NodeInfo> {
    this.ensureNodeConnected();
    return {
      name: this.selectedNodeName,
      ...await this.api.getNodeInfo(),
    };
  }

  /**
   * Get array of available nodes
   * @example
   * nodePool.getNodesInPool()
   */
  async getNodesInPool(): Promise<NodeInfo[]> {
    return Promise.all(
      Array.from(this.pool.entries()).map(async ([name, node]) => ({
        name,
        ...await node.getNodeInfo(),
      })),
    );
  }

  // eslint-disable-next-line class-methods-use-this
  addresses(): Encoded.AccountAddress[] {
    return [];
  }

  async address({ onAccount }: { onAccount?: Account } = {}): Promise<Encoded.AccountAddress> {
    return this._resolveAccount(onAccount).address();
  }

  async sign(
    data: string | Uint8Array,
    { onAccount, ...options }: { onAccount?: Account } = {},
  ): Promise<Uint8Array> {
    return this._resolveAccount(onAccount).sign(data, options);
  }

  async signTransaction(
    tx: Encoded.Transaction,
    { onAccount, ...options }: { onAccount?: Account } & Parameters<AccountBase['signTransaction']>[1] = {},
  ): Promise<Encoded.Transaction> {
    return this._resolveAccount(onAccount)
      .signTransaction(tx, { ...options, networkId: await this.getNetworkId(options) });
  }

  async signMessage(
    message: string,
    { onAccount, ...options }: { onAccount?: Account } & Parameters<AccountBase['signMessage']>[1] = {},
  ): Promise<string | Uint8Array> {
    return this._resolveAccount(onAccount).signMessage(message, options);
  }

  async verifyMessage(
    message: string,
    signature: string | Uint8Array,
    { onAccount, ...options }: { onAccount?: Account } & Parameters<AccountBase['verifyMessage']>[2] = {},
  ): Promise<boolean> {
    return this._resolveAccount(onAccount).verifyMessage(message, signature, options);
  }

  /**
   * Resolves an account
   * @param account - ak-address, instance of AccountBase, or keypair
   */
  // eslint-disable-next-line class-methods-use-this
  _resolveAccount(account?: Account): AccountBase {
    switch (account !== null && typeof account) {
      case 'string':
        throw new NotImplementedError('Address in AccountResolver');
      case 'object':
        return isAccountBase(account) ? account : new MemoryAccount({ keypair: account });
      default:
        throw new TypeError(
          'Account should be an address (ak-prefixed string), '
          + `keypair, or instance of AccountBase, got ${String(account)} instead`,
        );
    }
  }

  _getOptions(): {
    onNode: Node;
    onAccount: AccountBase;
    onCompiler: Compiler;
  } {
    return {
      ...this._options,
      onNode: getValueOrErrorProxy(() => this.api),
      onAccount: getValueOrErrorProxy(() => this._resolveAccount()),
      onCompiler: getValueOrErrorProxy(() => this.compilerApi),
    };
  }

  async buildTx<TxType extends Tag>(
    txType: TxType,
    options: Omit<Parameters<typeof _buildTx<TxType>>[1], 'onNode'> & { onNode?: Node },
  ): Promise<Encoded.Transaction> {
    // @ts-expect-error TODO: need to figure out what's wrong here
    return _buildTx<TxType>(txType, {
      ...this._getOptions(),
      ...options,
    });
  }
}

const { _buildTx: _, ...txMethodsOther } = txMethods;
const { InvalidTxError: _2, ...chainMethodsOther } = chainMethods;

const methods = {
  ...chainMethodsOther,
  ...txMethodsOther,
  ...aensMethods,
  ...spendMethods,
  ...oracleMethods,
  ...contractMethods,
  ...contractGaMethods,
  ...deprecatedMethods,
} as const;

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T];

type OptionalIfNotRequired<T extends [any]> = RequiredKeys<T[0]> extends never ? T | [] : T;

type MakeOptional<Args extends any[]> = Args extends [infer Head, ...infer Tail]
  ? Tail extends []
    ? Head extends object
      ? OptionalIfNotRequired<[Omit<Head, 'onNode' | 'onCompiler' | 'onAccount'>
      & {
        onNode?: Node;
        onCompiler?: Compiler;
        onAccount?: AccountBase | Encoded.AccountAddress | Keypair;
      }]>
      : [Head]
    : [Head, ...MakeOptional<Tail>]
  : never;

type TransformMethods <Methods extends { [key: string]: Function }> =
  {
    [Name in keyof Methods]:
    Methods[Name] extends (...args: infer Args) => infer Ret
      ? (...args: MakeOptional<Args>) => Ret
      : never
  };

interface AeSdkBaseMethods extends TransformMethods<typeof methods> {}

Object.assign(AeSdkBase.prototype, mapObject<Function, Function>(
  methods,
  ([name, handler]) => [
    name,
    function methodWrapper(...args: any[]) {
      const instanceOptions = this._getOptions();
      const lastArg = args[args.length - 1];
      if (lastArg != null && typeof lastArg === 'object' && lastArg.constructor === Object) {
        args[args.length - 1] = {
          ...instanceOptions,
          ...lastArg,
          ...lastArg.onAccount != null && { onAccount: this._resolveAccount(lastArg.onAccount) },
        };
      } else args.push(instanceOptions);
      return handler(...args);
    },
  ],
));

export default AeSdkBase as new (options?: ConstructorParameters<typeof AeSdkBase>[0]) =>
AeSdkBase & AeSdkBaseMethods;
