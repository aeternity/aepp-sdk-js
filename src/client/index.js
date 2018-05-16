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

function expandPath (path, replacements) {
  return R.reduce((path, [key, value]) => path.replace(`{${key}}`, value), path, R.toPairs(replacements))
}

async function remoteEpochVersion (url) {
  const result = await axios.get(urlparse.resolve(url, '/v2/version'))
  return result.data.version
}

function swag (version) {
  return require(`../../assets/swagger/${version}.json`)
}

function lookupType (path, spec, types) {
  const type = (() => {
    const match = R.path(path, spec).match(/^#\/definitions\/(.+)/)
    if (match !== void 0) {
      return match[1]
    } else {
      throw Error(`Reference path does not meet specification: ${path}`)
    }
  })()

  if (type in types) {
    return types[type]
  } else {
    throw Error(`Couldn't find definition for ${type}`)
  }
}

const conformTypes = {
  integer (value, spec, types) {
    if (typeof value === 'number') {
      return Math.floor(value)
    } else {
      throw Error(`Not an integer: ${value}`)
    }
  },
  enum (value, spec, types) {
    const { enum: values } = spec
    if (R.contains(value, values)) {
      return value
    } else {
      throw Error(`${value} is not one of [${R.join(', ', values)}]`)
    }
  },
  string (value, spec, types) {
    if (typeof value === 'string') {
      return value
    } else {
      throw Error(`Not a string: ${value}`)
    }
  },
  object (value, spec, types) {
    if (typeof value === 'object') {
      const { required, properties } = spec
      const missing = R.difference(required || [], R.keys(value))
      if (missing.length > 0) {
        throw Error(`Required properties missing: ${R.join(', ', missing)}`)
      } else {
        return R.mapObjIndexed((value, key) => conform(value, properties[key], types), R.reject(R.isNil, R.pick(R.keys(properties), value)))
      }
    } else {
      throw Error(`Not an object: ${value}`)
    }
  },
  schema (value, spec, types) {
    return conform(value, lookupType(['schema', '$ref'], spec, types), types)
  },
  $ref (value, spec, types) {
    return conform(value, lookupType(['$ref'], spec, types), types)
  }
}

function conformDispatch (spec) {
  if ('schema' in spec) {
    return 'schema'
  } else if ('$ref' in spec) {
    return '$ref'
  } else if ('enum' in spec) {
    return 'enum'
  } else {
    return spec.type
  }
}

function conform (value, spec, types) {
  return (conformTypes[conformDispatch(spec)] || (() => {
    throw Error(`Unsupported type ${spec.type}`)
  }))(value, spec, types)
}

const httpClients = {
  get: axios.get,
  post: axios.post
}

function classifyParameters (parameters) {
  const { req, opts } = R.groupBy(p => p.required ? 'req' : 'opts', parameters)
  const { path, query, body } = R.groupBy(p => p.in, parameters)

  return {
    pathArgs: R.pluck('name', path || []),
    queryArgs: R.pluck('name', query || []),
    bodyArgs: R.pluck('name', body || []),
    req: req || [],
    opts: opts || []
  }
}

function operationSignature (name, req, opts) {
  const args = req.length ? `${R.join(', ', R.pluck('name', req))}` : null
  const opt = opts.length ? `{${R.join(', ', R.pluck('name', opts))}}` : null

  return `${name} (${R.join(', ', R.filter(R.identity, [args, opt]))})`
}

function assertOne (coll) {
  if (coll.length === 1) {
    return R.head(coll)
  } else {
    throw Error(`Expected exactly one element in ${coll}`)
  }
}

function destructureClientError (error) {
  const { method, url } = error.config
  const { status } = error.response

  return `${R.toUpper(method)} to ${url} failed with ${status}: ${R.toString(error.response.data)}`
}

const operation = R.memoize((path, method, definition, types) => {
  const { operationId, parameters, description } = definition
  const name = `${R.toLower(R.head(operationId))}${R.drop(1, operationId)}`

  const { pathArgs, queryArgs, bodyArgs, req, opts } = classifyParameters(parameters)
  const optNames = R.pluck('name', opts)
  const indexedParameters = R.indexBy(R.prop('name'), parameters)

  const signature = operationSignature(name, req, opts)
  const client = httpClients[method]

  return (url) => {
    const fn = async function () {
      try {
        const [arg, opt] = (() => {
          if (arguments.length === req.length) {
            return [arguments, {}]
          } else if (arguments.length === req.length + 1) {
            return [R.dropLast(1, arguments), R.last(arguments)]
          } else {
            throw Error(`Function call doesn't conform to ${signature}`)
          }
        })()

        if (opt.debug) {
          console.log(`Invoked ${name} with ${R.toString(arg)} ${R.toString(opt)}`)
        }

        const values = R.merge(R.reject(R.isNil, R.pick(optNames, opt)), R.zipObj(R.pluck('name', req), arg))
        const conformed = R.mapObjIndexed((val, key) => {
          try {
            return conform(val, indexedParameters[key], types)
          } catch (e) {
            throw Error(`validating ${key} against ${val}: ${e.message}`)
          }
        }, values)
        const expandedPath = expandPath(path, R.pick(pathArgs, conformed))

        const params = (() => {
          if (method === 'get') {
            return { params: R.pick(queryArgs, conformed) }
          } else if (method === 'post') {
            return conformed[assertOne(bodyArgs)]
          } else {
            throw Error(`Unsupported method ${method}`)
          }
        })()

        if (opt.debug) {
          console.log(`Going to ${R.toUpper(method)} ${url}${expandedPath} with ${R.toString(params)}`)
        }

        try {
          const response = await client(`${url}${expandedPath}`, params, { headers: {'Content-Type': 'application/json'} })
          return opt.fullResponse ? response : response.data
        } catch (error) {
          console.log(destructureClientError(error))
          throw error
        }
      } catch (e) {
        throw Error(`While calling ${signature}, ${e.message}`)
      }
    }

    Object.assign(fn, {
      signature,
      description
    })

    return Object.defineProperties(fn, {
      name: {
        value: name,
        writable: false
      },
      length: {
        value: req.length + (opts.length ? 1 : 0),
        writable: false
      }
    })
  }
})

async function create (url, { internalUrl, websocketUrl } = {}) {
  const version = await remoteEpochVersion(url)
  const { basePath, paths, definitions } = swag(version)

  const methods = R.indexBy(R.prop('name'), R.flatten(R.values(R.mapObjIndexed((methods, path) => R.values(R.mapObjIndexed((definition, method) => {
    const op = operation(path, method, definition, definitions)
    const { tags, operationId } = definition

    if (R.contains('external', tags)) {
      return op(urlparse.resolve(url, basePath))
    } else if (internalUrl !== void 0 && R.contains('internal', tags)) {
      return op(urlparse.resolve(internalUrl, basePath))
    } else {
      return () => {
        throw Error(`Method ${operationId} is unsupported. No interface for ${R.toString(tags)}`)
      }
    }
  }, methods)), paths))))

  return Object.freeze(Object.assign({
    version,
    methods: R.keys(methods)
  }, methods))
}

const internal = {
  conform,
  operation,
  expandPath,
  assertOne
}

export default {
  create
}

export {
  internal
}
