/**
 * NodePool module
 * @module @aeternity/aepp-sdk/es/node-pool
 * @export NodePool
 * @example import { NodePool } from '@aeternity/aepp-sdk'
 */
import stampit from '@stamp/it'
import Node, { getNetworkId, NodeInfo } from './node'
import { DisconnectedError, DuplicateNodeError, NodeNotFoundError } from './utils/errors'

export class _NodePool {
  readonly api: Node
  pool: Map<string, Node>
  selectedNodeName?: string

  init ({ nodes = [] }: { nodes: Array<{ name: string, instance: Node }> }): void {
    this.pool = new Map()
    nodes.forEach((node, i: number) => {
      const { name, instance } = node
      this.addNode(name, instance, i === 0)
    })

    if (nodes.length > 0) this.selectNode(nodes[0].name)

    // TODO: rewrite to TypeScript getter after dropping stamp
    Object.defineProperties(this, {
      api: {
        enumerable: true,
        configurable: false,
        get () {
          if (this.selectedNodeName == null) {
            throw new NodeNotFoundError('You can\'t use Node API. Node is not connected or not defined!')
          }
          return this.pool.get(this.selectedNodeName)
        }
      }
    })
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
  isNodeConnected (): this is _NodePool & { selectedNodeName: string } {
    return this.selectedNodeName != null
  }

  /**
   * Get information about node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.getNodeInfo() // { name, version, networkId, protocol, ... }
   */
  async getNodeInfo (): Promise<NodeInfo & { name: string }> {
    if (!this.isNodeConnected()) throw new DisconnectedError()
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
  async getNodesInPool (): Promise<Array<NodeInfo & { name: string }>> {
    return await Promise.all(
      Array.from(this.pool.entries()).map(async ([name, node]) => ({
        name,
        ...await node.getNodeInfo()
      }))
    )
  }
}

/**
 * Node Pool Stamp
 * This stamp allow you to make basic manipulation (add, remove, select) on list of nodes
 * @alias module:@aeternity/aepp-sdk/es/node-pool
 * @param options - Initializer object
 * @param options.nodes - Array with Node instances
 * @return NodePool instance
 */
export default stampit({
  init: _NodePool.prototype.init,
  methods: {
    addNode: _NodePool.prototype.addNode,
    selectNode: _NodePool.prototype.selectNode,
    getNodeInfo: _NodePool.prototype.getNodeInfo,
    isNodeConnected: _NodePool.prototype.isNodeConnected,
    getNetworkId,
    getNodesInPool: _NodePool.prototype.getNodesInPool
  }
}) as (o?: Parameters<_NodePool['init']>[0]) => _NodePool
