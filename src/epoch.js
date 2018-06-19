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

import axios from 'axios'
import * as R from 'ramda'
import urlparse from 'url'
import Swagger from './utils/swagger'

async function remoteSwag (url) {
  return (await axios.get(urlparse.resolve(url, 'api'))).data
}

/**
 * Epoch node factory
 *
 * @param {string} url - URL to connect to
 * @param {{ internalUrl: string, websocketUrl: string, debug: boolean, defaults: Object }} [options={}]
 * @return {Promise<Object>}
 */
export default async function Epoch (url, { internalUrl, websocketUrl, debug = false, defaults = {} } = {}) {
  const baseUrl = url.replace(/\/?$/, '/')
  const methodFn = basePath => {
    const trimmedBasePath = basePath.replace(/^\//, '')
    return (op, definition) => {
      const { tags, operationId } = definition

      if (R.contains('external', tags)) {
        return op(urlparse.resolve(baseUrl, trimmedBasePath), { debug })
      } else if (internalUrl !== void 0 && R.contains('internal', tags)) {
        return op(urlparse.resolve(internalUrl.replace(/\/?$/, '/'), trimmedBasePath), { debug })
      } else {
        return () => {
          throw Error(`Method ${operationId} is unsupported. No interface for ${R.toString(tags)}`)
        }
      }
    }
  }

  const swag = await remoteSwag(url)
  const { methods, api } = Swagger(swag, methodFn)
  const { version, revision } = await api.getVersion()

  return Object.freeze({
    defaults,
    version,
    revision,
    methods,
    api
  })
}
