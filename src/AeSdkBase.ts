import Node from './Node';
import AccountBase from './account/Base';
import { CompilerError, DuplicateNodeError, NodeNotFoundError } from './utils/errors';
import { Encoded } from './utils/encoder';
import Compiler from './contract/Compiler';
import AeSdkMethods, { OnAccount, getValueOrErrorProxy } from './AeSdkMethods';

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
    { nodes = [], ...options }: ConstructorParameters<typeof AeSdkMethods>[0] & {
      nodes?: Array<{ name: string; instance: Node }>;
    } = {},
  ) {
    super(options);

    nodes.forEach(({ name, instance }, i) => this.addNode(name, instance, i === 0));
  }

  get compilerApi(): Compiler {
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

  override _getOptions(): {
    onNode: Node;
    onAccount: AccountBase;
    onCompiler: Compiler;
  } {
    return {
      ...super._getOptions(),
      onNode: getValueOrErrorProxy(() => this.api),
      onCompiler: getValueOrErrorProxy(() => this.compilerApi),
    };
  }
}
