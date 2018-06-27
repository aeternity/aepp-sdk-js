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

import stampit from '@stamp/it'
import axios from 'axios'
import * as R from 'ramda'
import urlparse from 'url'
import Swagger from './utils/swagger'

async function remoteSwag (url) {
  return (await axios.get(urlparse.resolve(url, 'api'))).data
}

const loader = ({url, internalUrl}) => (path, definition) => {
  const {tags, operationId} = definition

  if (R.contains('external', tags)) {
    return urlparse.resolve(url, path)
  } else if (!R.isNil(internalUrl) && R.contains('internal', tags)) {
    return urlparse.resolve(internalUrl.replace(/\/?$/, '/'), path)
  } else {
    return () => {
      throw Error(`Method ${operationId} is unsupported. No interface for ${R.toString(tags)}`)
    }
  }
}

const Epoch = stampit({
  async init ({url = this.url, internalUrl = this.internalUrl}) {
    url = url.replace(/\/?$/, '/')

    return Object.assign(this, {
      swag: await remoteSwag(url),
      urlFor: loader({url, internalUrl})
    })
  }
}, Swagger, {
  async init () {
    const {version, revision} = await this.api.getVersion()
    return Object.assign(this, {version, revision})
  }
})

export default Epoch
