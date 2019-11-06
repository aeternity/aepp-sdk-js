/**
 * NodePool module
 * @module @aeternity/aepp-sdk/es/node-pool
 * @export NodePool
 * @example import NodePool from '@aeternity/aepp-sdk/es/node-pool'
 */
import Node from '../node'
import { DEFAULT_NETWORK_ID, getterForCurrentNode, prepareNodeObject } from './helpers'
import AsyncInit from '../utils/async-init'

/**
 * Node Pool Stamp
 * This stamp allow you to make basic manipulation(add, remove, select) on list of nodes
 * @function
 * @alias module:@aeternity/aepp-sdk/es/node-pool
 * @rtype Stamp
 * @param {Object} [options={}] - Initializer object
 * @param {Array} [options.nodes] - Array with Node instances
 * @return {Object} NodePool instance
 */
export const NodePool = AsyncInit.compose({
  async init ({ nodes = [], url = this.url, internalUrl = this.internalUrl, forceCompatibility = false } = {}) {
    this.pool = new Map()
    this.validateNodes(nodes)

    nodes.forEach(node => {
      const { name, instance } = node
      this.pool.set(name, prepareNodeObject(name, instance))
    })
    if (nodes.length) this.selectNode(nodes[0].name)

    // DEPRECATED. TODO Remove deprecated param
    // Prevent BREAKING CHANGES. Support for init params `url`, `internalUrl`
    if (url) {
      this.addNode('default', await Node({ url, internalUrl, forceCompatibility }), true)
    }
  },
  propertyDescriptors: {
    api: {
      enumerable: true,
      configurable: false,
      get () {
        return getterForCurrentNode(this.selectedNode)
      }
    }
  },
  methods: {
    /**
     * Add Node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype (name: String, nodeInstance: Object, select: Boolean) => Void
     * @param {String} name - Node name
     * @param {Object} nodeInstance - Node instance
     * @param {Boolean} select - Select this node as current
     * @return {Void}
     * @example
     * nodePool.addNode('testNode', awaitNode({ url, internalUrl }), true) // add and select new node with name 'testNode'
     */
    addNode (name, nodeInstance, select = false) {
      if (this.pool.has(name)) throw new Error(`Node with name ${name} already exist`)

      this.validateNodes([{ name, instance: nodeInstance }])

      this.pool.set(name, prepareNodeObject(name, nodeInstance))
      if (select || !this.selectedNode) {
        this.selectNode(name)
      }
    },
    /**
     * Select Node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype (name: String) => Void
     * @param {String} name - Node name
     * @return {Void}
     * @example
     * nodePool.selectNode('testNode')
     */
    selectNode (name) {
      if (!this.pool.has(name)) throw new Error(`Node with name ${name} not in pool`)

      this.selectedNode = this.pool.get(name)
    },
    /**
     * Get NetworkId of current Node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype () => String
     * @return {String}
     * @example
     * nodePool.getNetworkId()
     */
    getNetworkId () {
      return this.networkId || this.selectedNode.networkId || DEFAULT_NETWORK_ID
    },
    /**
     * Check if you have selected node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype () => Boolean
     * @return {Boolean}
     * @example
     * nodePool.isNodeConnected()
     */
    isNodeConnected () {
      return !!this.selectedNode.instance
    },
    /**
     * Get information about node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype () => Object
     * @return {Object}
     * @example
     * nodePool.getNodeInfo() // { name, version, networkId, protocol, ... }
     */
    getNodeInfo () {
      if (!this.isNodeConnected()) throw new Error('Can not get node info. Node is not connected')
      return {
        name: this.selectedNode.name,
        ...this.selectedNode.instance.getNodeInfo()
      }
    },
    /**
     * Get array of available nodes
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype () => Object[]
     * @return {Object[]}
     * @example
     * nodePool.getNodesInPool()
     */
    getNodesInPool () {
      return Array.from(this.pool.entries()).map(([name, node]) => ({
        name,
        ...node.instance.getNodeInfo()
      }))
    },
    validateNodes (nodes) {
      const nodeProps = ['Swagger', 'api', 'consensusProtocolVersion', 'genesisHash', 'methods']
      nodes.forEach((node, index) => {
        if (typeof node !== 'object') throw new Error('Node must be an object with "name" and "instance" props')
        if (['name', 'instance'].find(k => !node[k])) throw new Error(`Node object on index ${index} must contain node "name" and "ins"`)
        if (!node.instance || typeof node.instance !== 'object' || nodeProps.find(prop => !(prop in node.instance))) {
          throw new Error('Invalid node instance object')
        }
      })
    }
  },
  props: {
    selectedNode: {}
  }
})

export default NodePool
