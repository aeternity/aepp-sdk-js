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
 * Epoch module
 * @module @aeternity/aepp-sdk/es/epoch
 * @export Epoch
 * @example import Epoch from '@aeternity/aepp-sdk/es/epoch'
 */

import stampit from '@stamp/it'
import axios from 'axios'
import * as R from 'ramda'
import urlparse from 'url'
import Swagger from './utils/swagger'

/**
 * Obtain Swagger configuration from Epoch node
 * @category async
 * @rtype (url: String) => swagger: Object
 * @param {String} url - Epoch base URL
 * @return {Object} Swagger configuration
 */
async function remoteSwag (url) {
  return (await axios.get(urlparse.resolve(url, 'api'))).data
}

/**
 * Epoch specific loader for `urlFor`
 * @rtype ({url: String, internalUrl?: String}) => (path: String, definition: Object) => tx: String
 * @param {Object} options
 * @param {String} options.url - Base URL for Epoch
 * @param {String} [options.internalUrl] - Base URL for internal requests
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
 * {@link Swagger} based Epoch remote API Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/epoch
 * @rtype Stamp
 * @param {Object} options
 * @param {String} options.url - Base URL for Epoch
 * @param {String} [options.internalUrl] - Base URL for internal requests
 * @return {Object} Epoch client
 * @example Epoch({url: 'https://sdk-testnet.aepps.com'})
 */
const Epoch = stampit({
  async init ({ url = this.url, internalUrl = this.internalUrl }) {
    url = url.replace(/\/?$/, '/')

    return Object.assign(this, {
      swag: await remoteSwag(url),
      urlFor: loader({ url, internalUrl })
    })
  }
}, Swagger, {
  async init ({ forceCompatibility }) {
    const { nodeVersion: version, nodeRevision: revision, genesisKeyBlockHash: genesisHash } = await this.api.getStatus()
    if (!R.contains(version)(COMPATIBILITY) && !forceCompatibility) throw new Error(`Unsupported epoch version ${version}`)
    // TODO:
    // getStatus fails with an Error 500 (and crashes everything)
    // core team says:
    // Hans 2:27 PM
    // > Looks to me like `GetStatus` will crash horribly if the top block is a micro block. So stop sending transactions to the node 😉
    // > @juraj.hlista and @fabian is this the expected behavior?
    // juraj.hlista 2:29 PM
    // > it doesn't look like it's expected
    // FIX:
    // because of this: https://github.com/aeternity/epoch/pull/1546/files
    return Object.assign(this, { version, revision, genesisHash })
  }
})

// Array with compatible epoch node versions
export const COMPATIBILITY = ['1.0.0']

export default Epoch
