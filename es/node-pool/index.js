import stampit from '@stamp/it'
import Swagger from '../utils/swagger'

const DEFAULT_NETWORK_ID = 'ae_mainnet'
const pool = new Map()
const getterForCurrentNode = (currentNode) => (obj, prop) => {
  if (typeof prop !== 'string' || prop.indexOf('_') !== -1) return


  if (!currentNode) throw new Error(`You can't call ${prop} API. Node is not connected!`)
  if (!prop in currentNode.instance.api) throw new Error(`API method ${prop} not found`)

  return currentNode.instance.api[prop]
}

export const NodePool = stampit({
  async init ({ nodes = [] } = {}) {
    this.validateNodes(nodes)

    nodes.forEach(node => {
      const { name, instance } = node
      pool.set(name, { name, instance: instance, networkId: instance.nodeNetworkId, url: instance.url })
    })
    if (nodes.length) {
      this.selectNode(nodes[0].name)
    } else {
      // Add proxy object here to prevent BREAKING CHANGES
      // Proxy will check if method key exist in `this.currentNode`, throw error if not
      this.api = new Proxy({}, {
        get: getterForCurrentNode(this.selectedNode)
      })
    }
  },
  methods: {
    addNode (name, nodeInstance, select = false) {
      if (pool.has(name)) throw new Error(`Node with name ${name} already exist`)

      const nodeProps = ['Swagger', 'api', 'consensusProtocolVersion', 'genesisHash', 'methods']
      if (!nodeInstance || typeof nodeInstance !== 'object' || nodeProps.find(prop => !prop in nodeInstance)) {
        throw new Error('Invalid node object')
      }

      pool.set(name, { name, instance: nodeInstance, networkId: nodeInstance.nodeNetworkId, url: nodeInstance.url })
      if (select || !this.selectedNode) {
        this.selectNode(name)
      }
    },
    selectNode (name) {
      if (!pool.has(name)) throw new Error(`Node with name ${name} not in pool`)
      const node = pool.get(name)

      this.selectedNode = node
      this.selectedNodeNetworkId = node.networkId
      this.api = new Proxy({}, {
        get: getterForCurrentNode(node)
      })
    },
    getNetworkId () {
      return this.networkId || this.selectedNodeNetworkId || DEFAULT_NETWORK_ID
    },
    validateNodes (nodes) {
      nodes.forEach((node, index) => {
        if (['name', 'instance'].find(k => !node[k])) throw new Error(`Node object on index ${index} must contain node "name" and "ins"`)
      })
    }
  },
  props: {
    selectedNode: {},
    selectedNodeNetworkId: null
  }
})
