import * as chainMethods from './chain'
import * as txMethods from './tx'
import * as aensMethods from './ae/aens'
import * as spendMethods from './ae/spend'
import * as oracleMethods from './ae/oracle'
import * as contractMethods from './ae/contract'
import * as contractGaMethods from './contract/ga'
import { mapObject } from './utils/other'
import Node, { getNetworkId } from './node'
import { AE_AMOUNT_FORMATS } from './utils/amount-formatter'
import { AMOUNT } from './tx/builder/schema'
import MemoryAccount, { Keypair } from './account/memory'
import AccountBase, { isAccountBase } from './account/base'
import {
  CompilerError,
  DuplicateNodeError,
  NodeNotFoundError,
  NotImplementedError,
  TypeError
} from './utils/errors'
import { EncodedData } from './utils/encoder'
import Compiler from './contract/compiler'

export type Account = Keypair | AccountBase | any

type NodeInfo = Awaited<ReturnType<Node['getNodeInfo']>> & { name: string }

function getValueOrErrorProxy<Value extends object> (valueCb: () => Value): Value {
  try {
    return valueCb()
  } catch (error) {
    return new Proxy(
      {},
      Object.fromEntries(['get', 'set', 'has'].map(name => [name, () => { throw error }]))
    ) as Value
  }
}

/**
 * Basic Ae Stamp
 *
 * Attempting to create instances from the Stamp without overwriting all
 * abstract methods using composition will result in an exception.
 *
 * Ae objects are the composition of three basic building blocks:
 * * {@link module:@aeternity/aepp-sdk/es/tx--Tx}
 * * {@link module:@aeternity/aepp-sdk/es/account--Account}
 * * {@link module:@aeternity/aepp-sdk/es/chain--Chain}
 * Only by providing the joint functionality of those three, most more advanced
 * operations, i.e. the ones with actual use value on the chain, become
 * available.
 * @alias module:@aeternity/aepp-sdk/es/ae
 * @param options - Initializer object
 * @param options.compilerUrl - compilerUrl - Url for compiler API
 */
class AeSdkBase {
  _options = {
    denomination: AE_AMOUNT_FORMATS.AETTOS,
    amount: AMOUNT
  }

  pool: Map<string, Node> = new Map()
  selectedNodeName?: string
  compilerApi: Compiler

  constructor (
    { nodes = [], compilerUrl, ignoreVersion = false, ...options }:
    {
      nodes?: Array<{ name: string, instance: Node }>
      compilerUrl?: string
      ignoreVersion?: boolean
    } = {}
  ) {
    Object.assign(this._options, options)

    nodes.forEach(({ name, instance }, i) => this.addNode(name, instance, i === 0))

    if (compilerUrl == null) {
      this.compilerApi = getValueOrErrorProxy(() => {
        throw new CompilerError('You can\'t use Compiler API. Compiler is not ready!')
      })
    } else this.setCompilerUrl(compilerUrl, { ignoreVersion })
  }

  setCompilerUrl (
    compilerUrl: string, { ignoreVersion = false }: { ignoreVersion?: boolean } = {}
  ): void {
    this.compilerApi = new Compiler(compilerUrl, { ignoreVersion })
  }

  get api (): Node {
    this.ensureNodeConnected()
    return this.pool.get(this.selectedNodeName) as Node
  }

  /**
   * Add Node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @param name - Node name
   * @param node - Node instance
   * @param select - Select this node as current
   * @example
   * // add and select new node with name 'testNode'
   * nodePool.addNode('testNode', awaitNode({ url }), true)
   */
  addNode (name: string, node: Node, select = false): void {
    if (this.pool.has(name)) throw new DuplicateNodeError(name)

    this.pool.set(name, node)
    if (select || this.selectedNodeName == null) {
      this.selectNode(name)
    }
  }

  /**
   * Select Node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @param name - Node name
   * @example
   * nodePool.selectNode('testNode')
   */
  selectNode (name: string): void {
    if (!this.pool.has(name)) throw new NodeNotFoundError(`Node with name ${name} not in pool`)
    this.selectedNodeName = name
  }

  /**
   * Get NetworkId of current Node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.getNetworkId()
   */
  readonly getNetworkId = getNetworkId

  /**
   * Check if you have selected node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.isNodeConnected()
   */
  isNodeConnected (): this is AeSdkBase & { selectedNodeName: string } {
    return this.selectedNodeName != null
  }

  protected ensureNodeConnected (): asserts this is AeSdkBase & { selectedNodeName: string } {
    if (!this.isNodeConnected()) {
      throw new NodeNotFoundError('You can\'t use Node API. Node is not connected or not defined!')
    }
  }

  /**
   * Get information about node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.getNodeInfo() // { name, version, networkId, protocol, ... }
   */
  async getNodeInfo (): Promise<NodeInfo> {
    this.ensureNodeConnected()
    return {
      name: this.selectedNodeName,
      ...await this.api.getNodeInfo()
    }
  }

  /**
   * Get array of available nodes
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.getNodesInPool()
   */
  async getNodesInPool (): Promise<NodeInfo[]> {
    return await Promise.all(
      Array.from(this.pool.entries()).map(async ([name, node]) => ({
        name,
        ...await node.getNodeInfo()
      }))
    )
  }

  addresses (): Array<EncodedData<'ak'>> {
    return []
  }

  async address ({ onAccount }: { onAccount?: Account } = {}): Promise<EncodedData<'ak'>> {
    return await this._resolveAccount(onAccount).address()
  }

  async sign (
    data: string, { onAccount, ...options }: { onAccount?: Account } = {}
  ): Promise<Uint8Array> {
    return await this._resolveAccount(onAccount).sign(data, options)
  }

  async signTransaction (
    tx: EncodedData<'tx'>,
    { onAccount, ...options }: { onAccount?: Account } & Parameters<AccountBase['signTransaction']>[1] = {}
  ): Promise<EncodedData<'tx'>> {
    return await this._resolveAccount(onAccount)
      .signTransaction(tx, { ...options, networkId: await this.getNetworkId(options) })
  }

  async signMessage (
    message: string,
    { onAccount, ...options }: { onAccount?: Account } & Parameters<AccountBase['signMessage']>[1] = {}
  ): Promise<string | Uint8Array> {
    return await this._resolveAccount(onAccount).signMessage(message, options)
  }

  async verifyMessage (
    message: string,
    signature: string | Uint8Array,
    { onAccount, ...options }: { onAccount?: Account } & Parameters<AccountBase['verifyMessage']>[2] = {}
  ): Promise<boolean> {
    return await this._resolveAccount(onAccount).verifyMessage(message, signature, options)
  }

  /**
   * Resolves an account
   * @param account - ak-address, instance of AccountBase, or keypair
   * @private
   */
  _resolveAccount (account?: Account): AccountBase {
    switch (account !== null && typeof account) {
      case 'string':
        throw new NotImplementedError('Address in AccountResolver')
      case 'object':
        return isAccountBase(account) ? account : new MemoryAccount({ keypair: account })
      default:
        throw new TypeError(
          'Account should be an address (ak-prefixed string), ' +
          `keypair, or instance of AccountBase, got ${String(account)} instead`)
    }
  }
}

const { _buildTx, ...txMethodsOther } = txMethods
const methods = {
  ...chainMethods,
  ...txMethodsOther,
  buildTx: _buildTx,
  ...aensMethods,
  ...spendMethods,
  ...oracleMethods,
  ...contractMethods,
  ...contractGaMethods
} as const

type MakeOptional<Args extends any[]> = Args extends [infer Head, ...infer Tail]
  ? Tail extends []
    ? Head extends object
      ? [Omit<Head, 'onNode' | 'onCompiler' | 'onAccount'>
        & { onNode?: Node, onCompiler?: Compiler, onAccount?: AccountBase | EncodedData<'ak'> }]
      : [Head]
    : [Head, ...MakeOptional<Tail>]
  : never

type TransformMethods <Methods extends { [key: string]: Function }> =
  {
    [Name in keyof Methods]:
    Methods[Name] extends (...args: infer Args) => infer Ret
      // ? (...args: Args) => Ret
      ? (...args: MakeOptional<Args>) => Ret
      : never
  }

type AeSdkBaseWithMethods = new (options: ConstructorParameters<typeof AeSdkBase>[0]) =>
AeSdkBase & TransformMethods<typeof methods>

Object.assign(AeSdkBase.prototype, mapObject<Function, Function>(
  methods,
  ([name, handler]) => [
    name,
    async function (...args: any[]) {
      const instanceOptions = {
        ...this._options,
        onNode: getValueOrErrorProxy(() => this.api),
        onAccount: getValueOrErrorProxy(() => this._resolveAccount()),
        onCompiler: getValueOrErrorProxy(() => this.compilerApi),
        // TODO: remove networkId
        networkId: this.networkId ?? (await this.api?.getStatus()).networkId
      }
      const lastArg = args[args.length - 1]
      if (lastArg != null && typeof lastArg === 'object' && lastArg.constructor === Object) {
        Object.assign(lastArg, {
          ...instanceOptions,
          ...lastArg,
          ...lastArg.onAccount != null && { onAccount: this._resolveAccount(lastArg.onAccount) }
        })
      } else args.push(instanceOptions)
      return handler(...args)
    }
  ]
))

export default AeSdkBase as AeSdkBaseWithMethods
