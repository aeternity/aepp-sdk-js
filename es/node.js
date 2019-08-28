/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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

import stampit from '@stamp/it'
import axios from 'axios'
import * as R from 'ramda'
import AsyncInit from './utils/async-init'
import Swagger from './utils/swagger'
import semverSatisfies from './utils/semver-satisfies'

/**
 * Obtain Swagger configuration from Node node
 * @category async
 * @rtype (url: String) => swagger: Object
 * @param {String} url - Node base URL
 * @param {Object} axiosConfig Axios configuration object
 * @return {Object} Swagger configuration
 */
async function remoteSwag (url, axiosConfig) {
  return (await axios.get(`${url}/api`, axiosConfig)).data
}

/**
 * Node specific loader for `urlFor`
 * @rtype ({url: String, internalUrl?: String}) => (path: String, definition: Object) => tx: String
 * @param {Object} options
 * @param {String} options.url - Base URL for Node
 * @param {String} options.internalUrl - Base URL for internal requests
 * @return {Function} Implementation for {@link urlFor}
 */
const loader = ({ url, internalUrl }) => (path, definition) => {
  const { tags, operationId } = definition

  if (R.contains('external', tags)) {
    return `${url}${path}`
  } else if (!R.isNil(internalUrl) && R.contains('internal', tags)) {
    return `${internalUrl}${path}`
  } else {
    throw Error(`Method ${operationId} is unsupported. No interface for ${R.toString(tags)}`)
  }
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

function axiosError (handler) {
  return (error) => {
    handler && typeof handler === 'function' && handler(error)
    throw error
  }
}

/**
 * {@link Swagger} based Node remote API Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/node
 * @rtype Stamp
 * @param {Object} [options={}] - Options
 * @param {String} options.url - Base URL for Node
 * @param {String} options.internalUrl - Base URL for internal requests
 * @param {String} options.axiosConfig - Object with axios configuration. Example { config: {}, errorHandler: (err) => throw err }
 * @return {Object} Node client
 * @example Node({url: 'https://sdk-testnet.aepps.com'})
 */
const Node = stampit(AsyncInit, {
  async init ({ name, url = this.url, internalUrl = this.internalUrl, axiosConfig: { config, errorHandler } = {} }) {
    if (!url) throw new Error('"url" required')
    url = url.replace(/\/?$/, '')
    internalUrl = internalUrl ? internalUrl.replace(/\/?$/, '') : url
    // Get swagger schema
    const swag = await remoteSwag(url, config).catch(this.axiosError(errorHandler))
    this.version = swag.info.version
    return Object.assign(this, {
      url,
      internalUrl,
      swag: swag,
      urlFor: loader({ url, internalUrl })
    })
  },
  methods: {
    axiosError,
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
}, Swagger, {
  async init ({ forceCompatibility = false }) {
    const { nodeRevision: revision, genesisKeyBlockHash: genesisHash, networkId, protocols } = await this.api.getStatus()
    this.consensusProtocolVersion = await this.getConsensusProtocolVersion(protocols)
    if (
      !(this.version === '5.0.0-rc.1' || semverSatisfies(this.version.split('-')[0], NODE_GE_VERSION, NODE_LT_VERSION)) &&
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

const NODE_GE_VERSION = '3.0.1'
const NODE_LT_VERSION = '5.0.0-rc.2'

export default Node
