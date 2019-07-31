import stampit from '@stamp/it'
import Node from '../node'
import { DEFAULT_NETWORK_ID, getterForCurrentNode, prepareNodeObject } from './helpers'

export const NodePool = stampit({
  async init ({ nodes = [], url = this.url, internalUrl = this.internalUrl } = {}) {
    this.pool = new Map()
    this.validateNodes(nodes)

    nodes.forEach(node => {
      const { name, instance } = node
      this.pool.set(name, prepareNodeObject(name, instance))
    })
    if (nodes.length) this.selectNode(nodes[0].name)

    // Prevent BREAKING CHANGES. Support for init params `url`, `internalUrl`
    if (url) {
      this.addNode('default', await Node({ url, internalUrl }), true)
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
    addNode (name, nodeInstance, select = false) {
      if (this.pool.has(name)) throw new Error(`Node with name ${name} already exist`)

      this.validateNodes([{ name, instance: nodeInstance }])

      this.pool.set(name, prepareNodeObject(name, nodeInstance))
      if (select || !this.selectedNode) {
        this.selectNode(name)
      }
    },
    selectNode (name) {
      if (!this.pool.has(name)) throw new Error(`Node with name ${name} not in pool`)

      this.selectedNode = this.pool.get(name)
    },
    getNetworkId () {
      return this.networkId || this.selectedNode.networkId || DEFAULT_NETWORK_ID
    },
    isNodeConnected () {
      return this.selectedNode.instance
    },
    getNodeInfo () {
      if (!this.isNodeConnected()) throw new Error('Can not get node info. Node is not connected')
      return {
        url: this.selectedNode.url,
        internalUrl: this.selectedNode.internalUrl,
        nodeNetworkId: this.selectedNode.networkId,
        version: this.selectedNode.version,
        consensusProtocolVersion: this.selectedNode.consensusProtocolVersion
      }
    },
    validateNodes (nodes) {
      const nodeProps = ['Swagger', 'api', 'consensusProtocolVersion', 'genesisHash', 'methods']
      nodes.forEach((node, index) => {
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
