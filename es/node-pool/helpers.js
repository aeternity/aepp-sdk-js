export const DEFAULT_NETWORK_ID = 'ae_mainnet'

export const getterForCurrentNode = (currentNode) => (obj, prop) => {
  if (typeof prop !== 'string' || prop.indexOf('_') !== -1) return

  if (!currentNode || !currentNode.instance) throw new Error(`You can't call ${prop} API. Node is not connected!`)
  if (!prop in currentNode.instance.api) throw new Error(`API method ${prop} not found`)

  return currentNode.instance.api[prop]
}

export const prepareNodeObject = (name, node) => ({
  name,
  instance: node,
  url: node.url,
  internalUrl: node.internalUrl,
  networkId: node.nodeNetworkId,
  version: node.version,
  consensusProtocolVersion: node.consensusProtocolVersion
})
