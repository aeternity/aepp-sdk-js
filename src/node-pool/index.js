/**
 * NodePool module
 * @module @aeternity/aepp-sdk/es/node-pool
 * @export NodePool
 * @example import { NodePool } from '@aeternity/aepp-sdk'
 */
import stampit from '@stamp/it'
import Joi from 'joi'
import { getNetworkId } from '../node'

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
          throw new Error('You can\'t use Node API. Node is not connected or not defined!')
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
     * nodePool.addNode('testNode', awaitNode({ url, internalUrl }), true) // add and select new node with name 'testNode'
     */
    addNode (name, node, select = false) {
      if (this.pool.has(name)) throw new Error(`Node with name ${name} already exist`)

      this.validateNodes([{ name, instance: node }])

      this.pool.set(name, {
        name,
        instance: node,
        url: node.url,
        internalUrl: node.internalUrl,
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
      const { error } = Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          instance: Joi.object({
            api: Joi.object().required(),
            consensusProtocolVersion: Joi.number().required(),
            genesisHash: Joi.string().required()
          }).unknown()
        })
      ).label('node').validate(nodes)
      if (error) throw error
    }
  },
  props: {
    selectedNode: {}
  }
})
