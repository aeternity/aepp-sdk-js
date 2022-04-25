/**
 * NodePool module
 * @module @aeternity/aepp-sdk/es/node-pool
 * @export NodePool
 * @example import { NodePool } from '@aeternity/aepp-sdk'
 */
import stampit from '@stamp/it'
import { getNetworkId } from '../node'
import { DisconnectedError, DuplicateNodeError, NodeNotFoundError, TypeError } from '../utils/errors'

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
export default stampit({
  init ({ nodes = [] } = {}) {
    this.pool = new Map()
    this.validateNodes(nodes)

    nodes.forEach((node, i) => {
      const { name, instance } = node
      this.addNode(name, instance, i === 0)
    })
    if (nodes.length) this.selectNode(nodes[0].name)
  },
  propertyDescriptors: {
    api: {
      enumerable: true,
      configurable: false,
      get () {
        if (!this.selectedNode || !this.selectedNode.instance) {
          throw new NodeNotFoundError('You can\'t use Node API. Node is not connected or not defined!')
        }
        return this.selectedNode.instance.api
      }
    }
  },
  methods: {
    /**
     * Add Node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype (name: String, nodeInstance: Object, select: Boolean) => void
     * @param {String} name - Node name
     * @param {Object} node - Node instance
     * @param {Boolean} select - Select this node as current
     * @return {void}
     * @example
     * // add and select new node with name 'testNode'
     * nodePool.addNode('testNode', awaitNode({ url }), true)
     */
    addNode (name, node, select = false) {
      if (this.pool.has(name)) throw new DuplicateNodeError(name)

      this.validateNodes([{ name, instance: node }])

      this.pool.set(name, {
        name,
        instance: node,
        url: node.url,
        networkId: node.nodeNetworkId,
        version: node.version,
        consensusProtocolVersion: node.consensusProtocolVersion
      })
      if (select || !this.selectedNode) {
        this.selectNode(name)
      }
    },
    /**
     * Select Node
     * @function
     * @alias module:@aeternity/aepp-sdk/es/node-pool
     * @rtype (name: String) => void
     * @param {String} name - Node name
     * @return {void}
     * @example
     * nodePool.selectNode('testNode')
     */
    selectNode (name) {
      if (!this.pool.has(name)) throw new NodeNotFoundError(`Node with name ${name} not in pool`)

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
    getNetworkId,
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
      if (!this.isNodeConnected()) throw new DisconnectedError()
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
      // TODO: validate it on TypeScript level instead
      // (to speedup development, save runtime resources)
      if (!Array.isArray(nodes)) throw new TypeError('"nodes" should be an array')
      const notObject = nodes.map(n => typeof n).find(t => t !== 'object')
      if (notObject) throw new TypeError(`Each node should be an object, got ${notObject} instead`)
      const wrongFields = nodes.find(n => typeof n.name !== 'string' || typeof n.instance !== 'object')
      if (notObject) {
        throw new TypeError(
          'Each node should have name (string), instance (object) ' +
          `fields, got ${JSON.stringify(wrongFields)} instead`
        )
      }
      const wrongInstanceFields = nodes
        .map(n => n.instance)
        .find(i => typeof i.api !== 'object' || typeof i.genesisHash !== 'string' ||
          typeof i.consensusProtocolVersion !== 'number')
      if (wrongInstanceFields) {
        throw new TypeError(
          'Each node instance should have api (object), consensusProtocolVersion (number), ' +
          `genesisHash (string) fields, got ${JSON.stringify(wrongInstanceFields)} instead`
        )
      }
    }
  },
  props: {
    selectedNode: {}
  }
})
