/**
 * NodePool module
 * @module @aeternity/aepp-sdk/es/node-pool
 * @export NodePool
 * @example import { NodePool } from '@aeternity/aepp-sdk'
 */
// @ts-expect-error TODO remove
import { getNetworkId } from '../node'
import { DisconnectedError, DuplicateNodeError, NodeNotFoundError } from '../utils/errors'

// TODO: Update me when node module is migrated to TS
type Node = any

interface NodeInfo {
  name: string
  version: string
  networkId: string
  consensusProtocolVersion: string
}

export default class NodePool {
  pool: Map<string, Node>
  selectedNode?: Node

  constructor (options: {nodes: Node[]} = { nodes: [] }) {
    const { nodes = [] } = options
    this.pool = new Map()
    nodes.forEach((node, i: number) => {
      const { name, instance } = node
      this.addNode(name, instance, i === 0)
    })
    if (nodes.length > 0) this.selectNode(nodes[0].name)
  }

  public get api (): Node['api'] {
    if (this.selectedNode == null || this.selectedNode.instance == null) {
      throw new NodeNotFoundError('You can\'t use Node API. Node is not connected or not defined!')
    }
    return this.selectedNode.instance.api
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

    this.pool.set(name, {
      name,
      instance: node,
      url: node.url,
      networkId: node.nodeNetworkId,
      version: node.version,
      consensusProtocolVersion: node.consensusProtocolVersion
    })
    if (select || this.selectedNode == null) {
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
    this.selectedNode = this.pool.get(name)
  }

  /**
   * Get NetworkId of current Node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.getNetworkId()
   */
  getNetworkId: (node?: any) => string = getNetworkId

  /**
   * Check if you have selected node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.isNodeConnected()
   */
  isNodeConnected (): boolean {
    return this.selectedNode.instance != null
  }

  /**
   * Get information about node
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.getNodeInfo() // { name, version, networkId, protocol, ... }
   */
  getNodeInfo (): NodeInfo {
    if (!this.isNodeConnected()) throw new DisconnectedError()
    return {
      name: this.selectedNode.name,
      ...this.selectedNode.instance.getNodeInfo()
    }
  }

  /**
   * Get array of available nodes
   * @alias module:@aeternity/aepp-sdk/es/node-pool
   * @example
   * nodePool.getNodesInPool()
   */
  getNodesInPool (): NodeInfo[] {
    return Array.from(this.pool.entries()).map(([name, node]) => ({
      name,
      ...node.instance.getNodeInfo()
    }))
  }
}
