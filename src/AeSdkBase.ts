import Node from './Node';
import AccountBase from './account/Base';
import {
  CompilerError, DuplicateNodeError, NodeNotFoundError, NotImplementedError, TypeError,
} from './utils/errors';
import { Encoded } from './utils/encoder';
import CompilerBase from './contract/compiler/Base';
import AeSdkMethods, { OnAccount, getValueOrErrorProxy, AeSdkMethodsOptions } from './AeSdkMethods';
import { AensName } from './tx/builder/constants';

type NodeInfo = Awaited<ReturnType<Node['getNodeInfo']>> & { name: string };

/**
 * Basic AeSdk class implements:
 * - node selector,
 * - integrated compiler support,
 * - wrappers of account methods mapped to the current account.
 */
export default class AeSdkBase extends AeSdkMethods {
  pool: Map<string, Node> = new Map();

  selectedNodeName?: string;

  /**
   * @param options - Options
   * @param options.nodes - Array of nodes
   */
  constructor(
    { nodes = [], ...options }: AeSdkMethodsOptions & {
      nodes?: Array<{ name: string; instance: Node }>;
    } = {},
  ) {
    super(options);

    nodes.forEach(({ name, instance }, i) => this.addNode(name, instance, i === 0));
  }

  // TODO: consider dropping this getter, because:
  // compiler is not intended to be used separately any more (functionality limited to sdk needs)
  // and user creates its instance by himself
  get compilerApi(): CompilerBase {
    if (this._options.onCompiler == null) {
      throw new CompilerError('You can\'t use Compiler API. Compiler is not ready!');
    }
    return this._options.onCompiler;
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

  /**
   * Resolves an account
   * @param account - ak-address, instance of AccountBase, or keypair
   */
  _resolveAccount(account: OnAccount = this._options.onAccount): AccountBase {
    if (typeof account === 'string') throw new NotImplementedError('Address in AccountResolver');
    if (typeof account === 'object') return account;
    throw new TypeError(
      'Account should be an address (ak-prefixed string), '
      + `or instance of AccountBase, got ${String(account)} instead`,
    );
  }

  get address(): Encoded.AccountAddress {
    return this._resolveAccount().address;
  }

  async sign(
    data: string | Uint8Array,
    { onAccount, ...options }: { onAccount?: OnAccount } = {},
  ): Promise<Uint8Array> {
    return this._resolveAccount(onAccount).sign(data, options);
  }

  async signTransaction(
    tx: Encoded.Transaction,
    { onAccount, ...options }: { onAccount?: OnAccount } & Parameters<AccountBase['signTransaction']>[1] = {},
  ): Promise<Encoded.Transaction> {
    const networkId = this.selectedNodeName !== null ? await this.api.getNetworkId() : undefined;
    return this._resolveAccount(onAccount).signTransaction(tx, { networkId, ...options });
  }

  async signMessage(
    message: string,
    { onAccount, ...options }: { onAccount?: OnAccount } & Parameters<AccountBase['signMessage']>[1] = {},
  ): Promise<Uint8Array> {
    return this._resolveAccount(onAccount).signMessage(message, options);
  }

  async signTypedData(
    data: Encoded.ContractBytearray,
    aci: Parameters<AccountBase['signTypedData']>[1],
    { onAccount, ...options }: { onAccount?: OnAccount } & Parameters<AccountBase['signTypedData']>[2] = {},
  ): Promise<Encoded.Signature> {
    return this._resolveAccount(onAccount).signTypedData(data, aci, options);
  }

  async signDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    { onAccount, ...options }: { onAccount?: OnAccount }
    & Parameters<AccountBase['signDelegationToContract']>[1] = {},
  ): Promise<Encoded.Signature> {
    options.networkId ??= this.selectedNodeName !== null
      ? await this.api.getNetworkId() : undefined;
    return this._resolveAccount(onAccount)
      .signDelegationToContract(contractAddress, options);
  }

  async signNameDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    name: AensName,
    { onAccount, ...options }: { onAccount?: OnAccount }
    & Parameters<AccountBase['signNameDelegationToContract']>[2] = {},
  ): Promise<Encoded.Signature> {
    options.networkId ??= this.selectedNodeName !== null
      ? await this.api.getNetworkId() : undefined;
    return this._resolveAccount(onAccount)
      .signNameDelegationToContract(contractAddress, name, options);
  }

  async signOracleQueryDelegationToContract(
    contractAddress: Encoded.ContractAddress,
    oracleQueryId: Encoded.OracleQueryId,
    { onAccount, ...options }: { onAccount?: OnAccount }
    & Parameters<AccountBase['signOracleQueryDelegationToContract']>[2] = {},
  ): Promise<Encoded.Signature> {
    options.networkId ??= this.selectedNodeName !== null
      ? await this.api.getNetworkId() : undefined;
    return this._resolveAccount(onAccount)
      .signOracleQueryDelegationToContract(contractAddress, oracleQueryId, options);
  }

  override _getOptions(callOptions: AeSdkMethodsOptions = {}): {
    onNode: Node;
    onAccount: AccountBase;
    onCompiler: CompilerBase;
  } {
    return {
      ...this._options,
      onNode: getValueOrErrorProxy(() => this.api),
      onCompiler: getValueOrErrorProxy(() => this.compilerApi),
      ...callOptions,
      onAccount: getValueOrErrorProxy(() => this._resolveAccount(callOptions.onAccount)),
    };
  }
}
