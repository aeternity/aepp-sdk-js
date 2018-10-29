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
import * as R from 'ramda'

function asyncInit (options = {}, { stamp, args, instance }) {
  return stamp.compose.deepConfiguration.AsyncInit.initializers.reduce(async (instance, init) => {
    instance = await Promise.resolve(instance)
    if (typeof init === 'function') {
      const ret = await Promise.resolve(init.call(instance, options, { stamp, args, instance }))
      return ret === undefined ? instance : ret
    }
    return instance
  }, instance)
}

const AsyncInit = stampit({
  deepConf: { AsyncInit: { initializers: [] } },
  composers ({ stamp, composables }) {
    const conf = stamp.compose.deepConfiguration.AsyncInit
    conf.initializers = R.without([asyncInit], R.uniqWith(R.identical, R.flatten(composables.map(c => R.path(['compose', 'deepConfiguration', 'AsyncInit', 'initializers'], c) || (c.compose || c).initializers || []))))
    stamp.compose.initializers = [asyncInit]
  }
})

export default AsyncInit
