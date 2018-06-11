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
import Chain from './chain'

function snakeToPascal (s) {
  return s.replace(/_./g, match => R.toUpper(match[1]))
}

function pascalToSnake (s) {
  return s.replace(/[A-Z]/g, match => `_${R.toLower(match)}`)
}

function expandPath (path, replacements) {
  return R.reduce((path, [key, value]) => path.replace(`{${key}}`, value), path, R.toPairs(replacements))
}

async function remoteSwagger (url) {
  return (await axios.get(urlparse.resolve(url, 'api'))).data
}

async function remoteEpochVersion (url) {
  return (await axios.get(urlparse.resolve(url, 'v2/version'))).data
}

function swag (version) {
  return require(`../../assets/swagger/${version}.json`)
}

async function retrieveSwagger (url, version, revision) {
  try {
    return await remoteSwagger(url)
  } catch (e) {
    try {
      return swag(revision)
    } catch (e) {
      return swag(version)
    }
  }
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

function extendingErrorPath (key, fn) {
  try {
    return fn()
  } catch (e) {
    throw Object.assign(e, { path: [key].concat(e.path || []) })
  }
}

function TypeError (msg, spec, value) {
  const e = Error(msg)
  return Object.assign(e, { spec, value })
}

const conformTypes = {
  integer (value, spec, types) {
    if (R.type(value) === 'Number') {
      return Math.floor(value)
    } else {
      throw TypeError('Not an integer', spec, value)
    }
  },
  enum (value, spec, types) {
    const { enum: values } = spec
    if (R.contains(value, values)) {
      return value
    } else {
      throw TypeError(`Not one of [${R.join(', ', values)}]`, spec, value)
    }
  },
  string (value, spec, types) {
    if (R.type(value) === 'String') {
      return value
    } else {
      throw TypeError(`Not a string`, spec, value)
    }
  },
  object (value, spec, types) {
    if (R.type(value) === 'Object') {
      const required = R.map(snakeToPascal, spec.required || [])
      const properties = pascalizeKeys(spec.properties)
      const missing = R.difference(required, R.keys(value))

      if (missing.length > 0) {
        throw TypeError(`Required properties missing: ${R.join(', ', missing)}`, spec, value)
      } else {
        return R.mapObjIndexed((value, key) => extendingErrorPath(key, () => conform(value, properties[key], types)), R.reject(R.isNil, R.pick(R.keys(properties), value)))
      }
    } else {
      throw TypeError(`Not an object`, spec, value)
    }
  },
  array (value, spec, types) {
    if (R.type(value) === 'Array') {
      return R.map(o => conform(o, spec.items, types), value)
    } else {
      throw TypeError(`Not an array`, spec, value)
    }
  },
  schema (value, spec, types) {
    return conform(value, lookupType(['schema', '$ref'], spec, types), types)
  },
  $ref (value, spec, types) {
    return conform(value, lookupType(['$ref'], spec, types), types)
  },
  allOf (value, spec, types) {
    return R.mergeAll(R.map(spec => conform(value, spec, types), spec.allOf))
  }
}

function conformDispatch (spec) {
  if ('schema' in spec) {
    return 'schema'
  } else if ('$ref' in spec) {
    return '$ref'
  } else if ('enum' in spec) {
    return 'enum'
  } else if ('allOf' in spec) {
    return 'allOf'
  } else if ('type' in spec) {
    return spec.type
  } else {
    throw Object.assign(Error('Could not determine type'), { spec })
  }
}

function conform (value, spec, types) {
  return (conformTypes[conformDispatch(spec)] || (() => {
    throw Object.assign(Error('Unsupported type'), { spec })
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

function pascalizeParameters (parameters) {
  return R.map(o => R.assoc('name', snakeToPascal(o.name), o), parameters)
}

const traverseKeys = R.curry((fn, o) => {
  const dispatch = {
    Object: o => R.fromPairs(R.map(([k, v]) => [fn(k), traverseKeys(fn, v)], R.toPairs(o))),
    Array: o => R.map(traverseKeys(fn), o)
  }

  return (dispatch[R.type(o)] || R.identity)(o)
})

function snakizeKeys (o) {
  return traverseKeys(pascalToSnake, o)
}

function pascalizeKeys (o) {
  return traverseKeys(snakeToPascal, o)
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
  const { status, data } = error.response
  const reason = R.has('reason', data) ? data.reason : R.toString(data)

  return `${R.toUpper(method)} to ${url} failed with ${status}: ${reason}`
}

const operation = R.memoize((path, method, definition, types) => {
  const { operationId, parameters, description } = definition
  const name = `${R.toLower(R.head(operationId))}${R.drop(1, operationId)}`
  const pascalized = pascalizeParameters(parameters)

  const { pathArgs, queryArgs, bodyArgs, req, opts } = classifyParameters(pascalized)
  const optNames = R.pluck('name', opts)
  const indexedParameters = R.indexBy(R.prop('name'), pascalized)

  const signature = operationSignature(name, req, opts)
  const client = httpClients[method]

  return (url, defaults = {}) => {
    const fn = async function () {
      try {
        const [arg, opt] = (() => {
          if (arguments.length === req.length) {
            return [Array.from(arguments), defaults]
          } else if (arguments.length === req.length + 1) {
            return [R.dropLast(1, arguments), R.merge(defaults, R.last(arguments))]
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
            const path = [key].concat(e.path || [])
            throw Object.assign(e, {
              path,
              value: val,
              message: `validating ${R.join(' -> ', path)}: ${e.message}`
            })
          }
        }, values)
        const expandedPath = expandPath(path, snakizeKeys(R.pick(pathArgs, conformed)))
        const params = snakizeKeys((() => {
          if (method === 'get') {
            return { params: R.pick(queryArgs, conformed) }
          } else if (method === 'post') {
            return conformed[assertOne(bodyArgs)]
          } else {
            throw Error(`Unsupported method ${method}`)
          }
        })())

        if (opt.debug) {
          console.log(`Going to ${R.toUpper(method)} ${url}${expandedPath} with ${R.toString(params)}`)
        }

        try {
          const response = await client(`${url}${expandedPath}`, params, { headers: {'Content-Type': 'application/json'} })
          // return opt.fullResponse ? response : conform(pascalizeKeys(response.data), responses['200'], types)
          return opt.fullResponse ? response : pascalizeKeys(response.data)
        } catch (e) {
          if (R.path(['response', 'data'], e)) {
            e.message = destructureClientError(e)
          }
          throw e
        }
      } catch (e) {
        e.message = `While calling ${signature}, ${e.message}`
        throw e
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

async function create (url, { internalUrl, websocketUrl, debug = false } = {}) {
  const baseUrl = url.replace(/\/?$/, '/')
  const baseInternalUrl = internalUrl.replace(/\/?$/, '/')

  const { version, revision } = await remoteEpochVersion(baseUrl)
  const { basePath, paths, definitions } = await retrieveSwagger(baseUrl, version, revision)
  const trimmedBasePath = basePath.replace(/^\//, '')
  const methods = R.indexBy(R.prop('name'), R.flatten(R.values(R.mapObjIndexed((methods, path) => R.values(R.mapObjIndexed((definition, method) => {
    const op = operation(path, method, definition, definitions)
    const { tags, operationId } = definition

    if (R.contains('external', tags)) {
      return op(urlparse.resolve(baseUrl, trimmedBasePath), { debug })
    } else if (internalUrl !== void 0 && R.contains('internal', tags)) {
      return op(urlparse.resolve(baseInternalUrl, trimmedBasePath), { debug })
    } else {
      return () => {
        throw Error(`Method ${operationId} is unsupported. No interface for ${R.toString(tags)}`)
      }
    }
  }, methods)), paths))))

  const o = {
    version,
    revision,
    methods: R.keys(methods),
    api: methods
  }

  return Object.freeze(Object.assign(o, Chain.create(o)))
}

export default {
  create
}

export {
  conform,
  operation,
  expandPath,
  assertOne,
  snakeToPascal,
  pascalToSnake,
  traverseKeys
}
