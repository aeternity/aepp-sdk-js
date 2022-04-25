/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
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
 * @example import { Node } from '@aeternity/aepp-sdk'
 */

import AsyncInit from './utils/async-init'
import genSwaggerClient from './utils/swagger'
import semverSatisfies from './utils/semver-satisfies'
import { MissingParamError, UnsupportedVersionError } from './utils/errors'

/**
 * Obtain networkId from account or node
 * @instance
 * @category async
 * @rtype () => networkId: String
 * @return {String} NetworkId
 */
export function getNetworkId ({ networkId, force = false } = {}) {
  const res = networkId || this.networkId || this.selectedNode?.networkId
  if (!force && !res) throw new MissingParamError('networkId is not provided')
  if (force && !res) return null
  return res
}

/**
 * {@link genSwaggerClient} based Node remote API Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/node
 * @rtype Stamp
 * @param {Object} [options={}] - Options
 * @param {String} options.url - Base URL for Node
 * @param {Object} options.axiosConfig - Object with axios configuration
 * @param {Object} options.axiosConfig.config
 * @param {Function} options.axiosConfig.errorHandler - (err) => throw err
 * @return {Object} Node client
 * @example Node({url: 'https://testnet.aeternity.io'})
 */
const Node = AsyncInit.compose({
  async init ({ url, ignoreVersion }) {
    if (!url) throw new MissingParamError('"url" required')
    this.url = url.replace(/\/$/, '')
    const client = await genSwaggerClient(`${this.url}/api?oas3`, {
      responseInterceptor: response => {
        if (response.ok) return
        return Object.assign(response, {
          statusText: `${new URL(response.url).pathname.slice(1)} error: ` + response.body.reason
        })
      }
    })
    this.version = client.spec.info.version
    if (
      !semverSatisfies(this.version, NODE_GE_VERSION, NODE_LT_VERSION) &&
      !ignoreVersion
    ) {
      throw new UnsupportedVersionError('node', this.version, NODE_GE_VERSION, NODE_LT_VERSION)
    }
    this.api = client.api

    const {
      nodeRevision: revision, genesisKeyBlockHash: genesisHash, networkId,
      protocols, topBlockHeight
    } = await this.api.getStatus()
    this.consensusProtocolVersion = protocols
      .filter(({ effectiveAtHeight }) => topBlockHeight >= effectiveAtHeight)
      .reduce(
        (acc, p) => p.effectiveAtHeight > acc.effectiveAtHeight ? p : acc,
        { effectiveAtHeight: -1, version: 0 }
      )
      .version
    this.nodeNetworkId = networkId
    return Object.assign(this, { revision, genesisHash })
  },
  methods: {
    getNodeInfo () {
      return {
        url: this.url,
        nodeNetworkId: this.nodeNetworkId,
        version: this.version,
        consensusProtocolVersion: this.consensusProtocolVersion
      }
    }
  },
  props: {
    version: null,
    consensusProtocolVersion: null,
    nodeNetworkId: null
  }
})

const NODE_GE_VERSION = '6.2.0'
const NODE_LT_VERSION = '7.0.0'

export default Node
