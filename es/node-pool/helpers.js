export const DEFAULT_NETWORK_ID = 'ae_mainnet'

export const getterForCurrentNode = (currentNode) => {
  if (!currentNode || !currentNode.instance) throw new Error(`You can't call ${prop} API. Node is not connected!`)

  return currentNode.instance.api
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
