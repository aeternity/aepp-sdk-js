/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Node module
 * @module @aeternity/aepp-sdk/es/node
 * @export Node
 * @example import Node from '@aeternity/aepp-sdk/es/node'
 */

import AsyncInit from './utils/async-init'
import genSwaggerClient from './utils/swagger'
import semverSatisfies from './utils/semver-satisfies'

/**
 * Obtain networkId from account or node
 * @instance
 * @category async
 * @rtype () => networkId: String
 * @return {String} NetworkId
 */
export function getNetworkId ({ networkId, force = false } = {}) {
  if (!force && !networkId && !this.networkId && (!this.selectedNode || !this.selectedNode.networkId)) throw new Error('networkId is not provided')
  if (force && !networkId && !this.networkId && (!this.selectedNode || !this.selectedNode.networkId)) return null
  return networkId || this.networkId || this.selectedNode.networkId
}

/**
 * get consensus protocol version
 * @param {Array} protocols Array of protocols
 * @param {Number} height Height
 * @return {Number} version Protocol version
 */
async function getConsensusProtocolVersion (protocols = [], height) {
  if (!protocols) throw new Error('Protocols must be an array')
  if (!height) height = (await this.api.getCurrentKeyBlock()).height
  if (height < 0) throw new Error('height must be a number >= 0')

  const { version } = protocols
    .reduce(
      ({ effectiveAtHeight, version }, p) => height >= p.effectiveAtHeight && p.effectiveAtHeight > effectiveAtHeight
        ? { effectiveAtHeight: p.effectiveAtHeight, version: p.version }
        : { effectiveAtHeight, version },
      { effectiveAtHeight: -1, version: 0 }
    )
  return version
}

/**
 * {@link genSwaggerClient} based Node remote API Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/node
 * @rtype Stamp
 * @param {Object} [options={}] - Options
 * @param {String} options.url - Base URL for Node
 * @param {String} options.internalUrl - Base URL for internal requests
 * @param {String} options.axiosConfig - Object with axios configuration. Example { config: {}, errorHandler: (err) => throw err }
 * @return {Object} Node client
 * @example Node({url: 'https://testnet.aeternity.io'})
 */
const Node = AsyncInit.compose({
  async init ({ url = this.url, internalUrl = this.internalUrl }) {
    if (!url) throw new Error('"url" required')
    url = url.replace(/\/?$/, '')
    internalUrl = internalUrl ? internalUrl.replace(/\/?$/, '') : url
    const client = await genSwaggerClient(`${url}/api`, internalUrl)
    this.version = client.spec.info.version
    this.api = client.api
  },
  methods: {
    getNodeInfo () {
      return {
        url: this.url,
        internalUrl: this.internalUrl,
        nodeNetworkId: this.nodeNetworkId,
        version: this.version,
        consensusProtocolVersion: this.consensusProtocolVersion
      }
    },
    getConsensusProtocolVersion
  },
  props: {
    version: null,
    consensusProtocolVersion: null,
    nodeNetworkId: null
  }
}, {
  async init ({ forceCompatibility = false }) {
    const { nodeRevision: revision, genesisKeyBlockHash: genesisHash, networkId, protocols } = await this.api.getStatus()
    this.consensusProtocolVersion = await this.getConsensusProtocolVersion(protocols)
    if (
      (
        !semverSatisfies(this.version.split('-')[0], NODE_GE_VERSION, NODE_LT_VERSION) ||
        this.version === '5.0.0-rc1'
      ) &&
      // Todo implement 'rc' version comparision in semverSatisfies
      !forceCompatibility
    ) {
      throw new Error(
        `Unsupported node version ${this.version}. ` +
        `Supported: >= ${NODE_GE_VERSION} < ${NODE_LT_VERSION}`
      )
    }

    this.nodeNetworkId = networkId
    return Object.assign(this, { revision, genesisHash })
  }
})

const NODE_GE_VERSION = '5.0.0'
const NODE_LT_VERSION = '6.0.0'

export default Node
