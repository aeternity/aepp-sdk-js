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
 * Swagger module
 * @module @aeternity/aepp-sdk/es/utils/swagger
 * @export Swagger
 * @example import Swagger from '@aeternity/aepp-sdk/es/utils/swagger'
 */

import JsonBig from './json-big'
import stampit from '@stamp/it'
import axios from 'axios'
import * as R from 'ramda'
import { snakeToPascal, pascalToSnake } from './string'
import BigNumber from 'bignumber.js'

/**
 * Perform path string interpolation
 * @static
 * @rtype (path: String, replacements: Object) => String
 * @param {String} s - String to convert
 * @return {String} Converted string
 */
function expandPath (path, replacements) {
  return R.toPairs(replacements).reduce((path, [key, value]) => path.replace(`{${key}}`, value), path)
}

/**
 * Lookup type
 * @rtype (path: [String...], spec: Object, types: Object) => Object
 * @param {String[]} path - Path to look up
 * @param {Object} spec
 * @param {Object} types
 * @return {Object} Looked up type definition
 */
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

/**
 * Intercept errors thrown by `fn()`, extending them with information from `key`
 * @rtype (key: String, fn: Function) => Any
 * @param {String} key - Information to attach
 * @param {Function} fn - Thunk
 * @return {Any} Execution result
 */
function extendingErrorPath (key, fn) {
  try {
    return fn()
  } catch (e) {
    throw Object.assign(e, { path: [key].concat(e.path || []) })
  }
}

/**
 * Construct Error with additional type information (not thrown)
 * @rtype (msg: String, spec: String, value: String) => Error
 * @param {String} msg - Error message
 * @param {String} spec
 * @param {String} value
 * @return {Error} Enhanced Error
 */
function TypeError (msg, spec, value) {
  const e = Error(msg)
  return Object.assign(e, { spec, value })
}

/**
 * Per-type {@link conform} dispatcher
 * @rtype [(dispatch(value: String, spec: Object, types: Object) => Any, throws: Error)...]
 */
const conformTypes = {
  integer (value, spec, types) {
    if (R.type(value) === 'Number' || BigNumber(value).toString(10) === value) {
      return R.type(value) === 'Number' ? Math.floor(value) : value
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
      const required = (spec.required || []).map(snakeToPascal)
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
      return value.map(o => conform(o, spec.items, types))
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
    return R.mergeAll(spec.allOf.map(spec => conform(value, spec, types)))
  }
}

/**
 * {@link conform} dispatcher
 * @rtype (spec: Object) => String, throws: Error
 * @param {Object} spec
 * @return {String} Value to dispatch on
 */
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

/**
 * Conform `value` against its `spec`
 * @static
 * @rtype (value: Any, spec: Object, types: Object) => Any, throws: Error
 * @param {Object} value - Value to conform (validate and transform)
 * @param {Object} spec - Specification object
 * @param {Object} types - Types specification
 * @return {Object} Conformed value
 */
function conform (value, spec, types) {
  return (conformTypes[conformDispatch(spec)] || (() => {
    throw Object.assign(Error('Unsupported type'), { spec })
  }))(value, spec, types)
}

const httpConfig = {
  headers: { 'Content-Type': 'application/json' },
  transformResponse: [(data) => {
    try {
      return JsonBig.parse(data)
    } catch (e) {
      return data
    }
  }],
  transformRequest: [(data) => {
    try {
      return JsonBig.stringify(data)
    } catch (e) {
      return data
    }
  }]
}

const httpClients = {
  get: (config) => (url, params) => axios.get(url, [httpConfig, config, params].reduce(R.mergeDeepRight)),
  post: (config) => (url, params) => axios.post(url, params, R.mergeDeepRight(httpConfig, config))
}

/**
 * Classify given `parameters`
 * @rtype (parameters: [{required: Boolean, in: String}...]) => {pathArgs: [...Object], queryArgs: [...Object], bodyArgs: [...Object], req: [...Object], opts: [...Object]}
 * @param {Object[]} parameters - Parameters to classify
 * @return {Object[]} Classified parameters
 */
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

/**
 * Convert `name` attributes in `parameters` from snake_case to PascalCase
 * @rtype (parameters: [{name: String}...]) => [{name: String}...]
 * @param {Object[]} parameters - Parameters to pascalize
 * @return {Object[]} Pascalized parameters
 */
function pascalizeParameters (parameters) {
  return parameters.map(o => R.assoc('name', snakeToPascal(o.name), o))
}

/**
 * Key traversal metafunction
 * @static
 * @function
 * @rtype (fn: (s: String) => String) => (o: Object) => Object
 * @param {Function} fn - Key transformation function
 * @param {Object} o - Object to traverse
 * @return {Object} Transformed object
 */
const traverseKeys = R.curry((fn, o) => {
  const dispatch = {
    Object: o => R.fromPairs(R.toPairs(o).map(function (arr) {
      const k = arr[0]
      const v = arr[1]
      return [fn(k), traverseKeys(fn, v)]
    })),
    Array: o => o.map(traverseKeys(fn))
  }

  return (dispatch[R.type(o)] || R.identity)(o)
})

/**
 * snake_case key traversal
 * @static
 * @rtype (o: Object) => Object
 * @param {Object} o - Object to traverse
 * @return {Object} Transformed object
 * @see pascalToSnake
 */
function snakizeKeys (o) {
  return traverseKeys(pascalToSnake, o)
}

/**
 * PascalCase key traversal
 * @static
 * @rtype (o: Object) => Object
 * @param {Object} o - Object to traverse
 * @return {Object} Transformed object
 * @see snakeToPascal
 */
function pascalizeKeys (o) {
  return traverseKeys(snakeToPascal, o)
}

/**
 * Obtain readable signature for operation
 * @rtype (name: String, req: [...Object], opts: [...Object]) => Object
 * @param {String} name - Name of operation
 * @param {Object[]} req - Required parameters to operation
 * @param {Object[]} opts - Optional parameters to operation
 * @return {String} Signature
 */
function operationSignature (name, req, opts) {
  const args = req.length ? `${R.join(', ', R.pluck('name', req))}` : null
  const opt = opts.length ? `{${R.join(', ', R.pluck('name', opts))}}` : null

  return `${name} (${R.join(', ', [args, opt].filter(R.identity))})`
}

/**
 * Assert that `coll` is a sequence with a length of 1 and extract the only element
 * @static
 * @rtype (coll: [...Any]) => Any, throws: Error
 * @param {Object[]} coll
 * @return {Object}
 */
function assertOne (coll) {
  if (coll.length === 1) {
    return R.head(coll)
  } else {
    throw Error(`Expected exactly one element in ${coll}`)
  }
}

/**
 * Destructure HTTP client `error`
 * @rtype (error: Error) => String
 * @param {Error} error
 * @return {String}
 */
function destructureClientError (error) {
  const { method, url } = error.config
  const { status, data } = error.response
  const reason = R.has('reason', data) ? data.reason : R.toString(data)

  return `${method.toUpperCase()} to ${url} failed with ${status}: ${reason}`
}

/**
 * Generate callable operation
 * @function
 * @static
 * @rtype (path: String, method: String, definition: Object, types: Object) => (instance: Swagger, url: String) => Promise[Any], throws: Error
 * @param {String} path - Path to call in URL
 * @param {String} method - HTTP method
 * @param {Object} definition - Complex definition
 * @param {Object} types - Swagger types
 * @return {Function}
 */
const operation = (path, method, definition, types, { config, errorHandler } = {}) => {
  config = config || {}
  delete config.transformResponse // Prevent of overwriting transform response
  const { operationId, description } = definition
  let { parameters } = definition
  const name = `${R.head(operationId).toLowerCase()}${R.drop(1, operationId)}`
  const pascalized = pascalizeParameters(parameters)

  const { pathArgs, queryArgs, bodyArgs, req, opts } = classifyParameters(pascalized)
  const optNames = R.pluck('name', opts)
  const indexedParameters = R.indexBy(R.prop('name'), pascalized)

  const signature = operationSignature(name, req, opts)
  const client = httpClients[method](config)

  return (instance, url) => {
    const fn = async function () {
      const { defaults } = this.Swagger

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
          console.log(`Going to ${method.toUpperCase()} ${url}${expandedPath} with ${R.toString(params)}`)
        }

        try {
          const response = await client(`${url}${expandedPath}`, params).catch(this.axiosError(errorHandler))
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
    }.bind(instance)

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
}

/**
 * Swagger Stamp
 * @function
 * @alias module:@aeternity/aepp-sdk/es/utils/swagger
 * @rtype Stamp
 * @param {Object} options - Initializer object
 * @param {Object} options.swag - Swagger definition
 * @param {Object} options.axiosConfig - Object with axios configuration. Example { config: {}, errorHandler: (err) => throw err }
 * @return {Object} Account instance
 * @example Swagger({swag})
 */
const Swagger = stampit({
  init ({ swag = this.swag, axiosConfig }, { stamp }) {
    const { paths, definitions } = swag
    const methods = R.indexBy(
      R.prop('name'),
      R.flatten(
        R.values(
          R.mapObjIndexed(
            (methods, path) => R.values(
              R.mapObjIndexed((definition, method) => {
                const op = operation(path, method, definition, definitions, axiosConfig)
                return op(this, this.urlFor(swag.basePath, definition))
              }, methods)),
            paths
          )
        )
      )
    )

    return Object.assign(this, {
      methods: R.keys(methods),
      api: methods
    })
  },
  deepProps: {
    Swagger: {
      defaults: {
        debug: false,
        txEncoding: 'json'
      }
    }
  },
  statics: { debugSwagger (bool) { return this.deepProps({ Swagger: { defaults: { debug: bool } } }) } }
})

/**
 * Reconfigure Swagger to (not) spill debugging logs
 * @function debugSwagger
 * @static
 * @rtype (bool: Boolean) => Stamp
 * @param {boolean} bool - Whether to debug
 * @return {Stamp} Reconfigured Swagger Stamp
 */

export default Swagger

export {
  conform,
  operation,
  expandPath,
  assertOne,
  snakeToPascal,
  pascalToSnake,
  traverseKeys
}
