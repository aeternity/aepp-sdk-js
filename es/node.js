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
import urlparse from 'url'
import Swagger from './utils/swagger'
import semverSatisfies from './utils/semver-satisfies'

/**
 * Obtain Swagger configuration from Node node
 * @category async
 * @rtype (url: String) => swagger: Object
 * @param {String} url - Node base URL
 * @return {Object} Swagger configuration
 */
async function remoteSwag (url) {
  return (await axios.get(urlparse.resolve(url, 'api'))).data
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
    return urlparse.resolve(url, path)
  } else if (!R.isNil(internalUrl) && R.contains('internal', tags)) {
    return urlparse.resolve(internalUrl.replace(/\/?$/, '/'), path)
  } else {
    throw Error(`Method ${operationId} is unsupported. No interface for ${R.toString(tags)}`)
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
 * @return {Object} Node client
 * @example Node({url: 'https://sdk-testnet.aepps.com'})
 */
const Node = stampit({
  async init ({ url = this.url, internalUrl = this.internalUrl }) {
    url = url.replace(/\/?$/, '/')
    // Get swagger schema
    const swag = await remoteSwag(url)
    this.version = swag.info.version
    return Object.assign(this, {
      url,
      internalUrl,
      swag: swag,
      urlFor: loader({ url, internalUrl })
    })
  },
  methods: {
    getNodeInfo () {
      return {
        url: this.url,
        internalUrl: this.internalUrl,
        nodeNetworkId: this.nodeNetworkId,
        version: this.version
      }
    }
  },
  props: {
    version: null,
    nodeNetworkId: null
  }
}, Swagger, {
  async init ({ forceCompatibility = false }) {
    const { nodeRevision: revision, genesisKeyBlockHash: genesisHash, networkId } = await this.api.getStatus()
    if (
      !semverSatisfies(this.version.split('-')[0], NODE_GE_VERSION, NODE_LT_VERSION) &&
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

const NODE_GE_VERSION = '1.4.0'
const NODE_LT_VERSION = '3.0.0'

export default Node
