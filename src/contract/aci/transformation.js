import Joi from 'joi'
import { isHex } from '../../utils/string'
import { toBytes } from '../../utils/bytes'
import { decode } from '../../tx/builder/helpers'
import { parseBigNumber } from '../../utils/bignumber'
import { addressFromDecimal, hash } from '../../utils/crypto'

export const SOPHIA_TYPES = [
  'int',
  'string',
  'tuple',
  'address',
  'bool',
  'list',
  'map',
  'record',
  'option',
  'oracle',
  'oracleQuery',
  'hash',
  'signature',
  'bytes',
  'variant'
].reduce((acc, type) => ({ ...acc, [type]: type }), { ChainTtl: 'Chain.ttl' })

/**
 * Transform decoded event to JS type
 * @param {Object[]} events Array of events
 * @param {Object} [options={}] Options
 * @param {Object} [options.schema=[]] SC function ACI schema
 * @return {Object}
 */
export function decodeEvents (events, options = { schema: [] }) {
  if (!events.length) return []

  return events.map(l => {
    const [eName, ...eParams] = l.topics
    const hexHash = toBytes(eName, true).toString('hex')
    const { schema } = options.schema
      .reduce(
        (acc, el) => {
          if (hash(el.name).toString('hex') === hexHash) {
            l.name = el.name
            return {
              schema: el.types,
              name: el.name
            }
          }
          return acc
        },
        { schema: [] }
      )
    const { decoded } = schema.reduce((acc, el) => {
      if (el === SOPHIA_TYPES.string) {
        return { decoded: [...acc.decoded, transformEvent(l.data, el)], params: acc.params }
      }
      const [event, ...tail] = acc.params
      return { decoded: [...acc.decoded, transformEvent(event, el)], params: tail }
    }, { decoded: [], params: eParams })

    return {
      ...l,
      decoded
    }
  })
}

/**
 * Transform Event based on type
 * @param {String|Number} event Event data
 * @param {String} type Event type from schema
 * @return {*}
 */
function transformEvent (event, type) {
  switch (type) {
    case SOPHIA_TYPES.int:
      return parseBigNumber(event)
    case SOPHIA_TYPES.bool:
      return !!event
    case SOPHIA_TYPES.hash:
      return toBytes(event, true).toString('hex')
    case SOPHIA_TYPES.address:
      return addressFromDecimal(event).split('_')[1]
    case SOPHIA_TYPES.string:
      return decode(event).toString('utf-8')
    default:
      return toBytes(event, true)
  }
}

function injectVars (t, aciType) {
  const [[baseType, generic]] = Object.entries(aciType.typedef)
  const [[, varianValue]] = Object.entries(t)
  switch (baseType) {
    case SOPHIA_TYPES.variant:
      return {
        [baseType]: generic.map(el => {
          const [tag, gen] = Object.entries(el)[0]
          return {
            [tag]: gen.map(type => {
              const index = aciType.vars.map(e => e.name).indexOf(type)
              return index === -1
                ? type
                : varianValue[index]
            })
          }
        })
      }
  }
}

/**
 * Ling Type Defs
 * @param t
 * @param bindings
 * @return {Object}
 */
function linkTypeDefs (t, bindings) {
  const [root, typeDef] = typeof t === 'object' ? Object.keys(t)[0].split('.') : t.split('.')
  const contractTypeDefs = bindings.find(c => c.name === root)
  const aciType = [
    ...contractTypeDefs.type_defs,
    { name: 'state', typedef: contractTypeDefs.state, vars: [] }
  ].find(({ name }) => name === typeDef)
  if (aciType.vars.length) {
    aciType.typedef = injectVars(t, aciType)
  }
  return isTypedDefOrState(aciType.typedef, bindings) ? linkTypeDefs(aciType.typedef, bindings) : aciType.typedef
}

const isTypedDefOrState = (t, bindings) => {
  if (!['string', 'object'].includes(typeof t)) return false

  t = typeof t === 'object' ? Object.keys(t)[0] : t
  const [root, ...path] = t.split('.')
  // Remote Contract Address
  if (!path.length) return false
  return bindings.map(c => c.name).includes(root)
}

const isRemoteAddress = (t) => {
  if (typeof t !== 'string') return false
  const [root, ...path] = t.split('.')
  return !path.length && !Object.values(SOPHIA_TYPES).includes(root)
}

/**
 * Parse sophia type
 * @param type
 * @param bindings
 * @return {Object}
 */
export function readType (type, bindings) {
  let [t] = Array.isArray(type) ? type : [type]

  // If remote address
  if (isRemoteAddress(t)) return { t: SOPHIA_TYPES.address }
  // Link State and typeDef
  if (isTypedDefOrState(t, bindings)) t = linkTypeDefs(t, bindings)
  // Map, Tuple, List, Record, Bytes
  if (typeof t === 'object') {
    const [[baseType, generic]] = Object.entries(t)
    return { t: baseType, generic }
  }
  // Base types
  if (typeof t === 'string') return { t }
}

// FUNCTION ARGUMENTS TRANSFORMATION ↓↓↓

/**
 * Transform JS type to Sophia-type
 * @param type
 * @param value
 * @param bindings
 * @return {string}
 */
export function transform (type, value, bindings) {
  const { t, generic } = readType(type, bindings)

  switch (t) {
    case SOPHIA_TYPES.ChainTtl:
      return `${value}`
    case SOPHIA_TYPES.string:
      return `"${value}"`
    case SOPHIA_TYPES.list:
      return `[${value.map(el => transform(generic, el, bindings))}]`
    case SOPHIA_TYPES.tuple:
      return `(${value.map((el, i) => transform(generic[i], el, bindings))})`
    case SOPHIA_TYPES.option: {
      return value === undefined ? 'None' : `Some(${transform(generic, value, bindings)})`
    }
    case SOPHIA_TYPES.hash:
    case SOPHIA_TYPES.bytes:
    case SOPHIA_TYPES.signature:
      if (typeof value === 'string') {
        if (isHex(value)) return `#${value}`
      }
      return `#${Buffer.from(value).toString('hex')}`
    case SOPHIA_TYPES.record:
      return `{${generic.reduce(
        (acc, { name, type }, i) => {
          acc += `${i !== 0 ? ',' : ''}${name} = ${transform(type, value[name], bindings)}`
          return acc
        },
        ''
      )}}`
    case SOPHIA_TYPES.map:
      return transformMap(value, generic, bindings)
    case SOPHIA_TYPES.variant:
      return transformVariant(value, generic, bindings)
  }

  return `${value}`
}

function transformVariant (value, generic, bindings) {
  const [[variant, variantArgs]] = typeof value === 'string' ? [[value, []]] : Object.entries(value)
  const [[v, type]] = Object.entries(generic.find(o => Object.keys(o)[0].toLowerCase() === variant.toLowerCase()))
  return `${v}${!type.length
    ? ''
    : `(${variantArgs.slice(0, type.length).map((el, i) => transform(type[i], el, bindings))})`
  }`
}

function transformMap (value, generic, bindings) {
  if (!Array.isArray(value)) {
    if (value.entries) value = Array.from(value.entries())
    else if (value instanceof Object) value = Object.entries(value)
  }

  return [
    '{',
    value
      .map(([key, value]) => [
        `[${transform(generic[0], key, bindings)}]`,
        transform(generic[1], value, bindings)
      ].join(' = '))
      .join(),
    '}'
  ].join('')
}

// FUNCTION RETURN VALUE TRANSFORMATION ↓↓↓

/**
 * Transform decoded data to JS type
 * @param aci
 * @param result
 * @param bindings
 * @return {*}
 */
export function transformDecodedData (aci, result, bindings) {
  const { t, generic } = readType(aci, bindings)

  switch (t) {
    case SOPHIA_TYPES.bool:
      return !!result
    case SOPHIA_TYPES.address:
      return result === 0
        ? 0
        : result
    case SOPHIA_TYPES.hash:
    case SOPHIA_TYPES.bytes:
    case SOPHIA_TYPES.signature:
      return result.split('#')[1]
    case SOPHIA_TYPES.map: {
      const [keyT, valueT] = generic
      return result
        .reduce(
          (acc, [key, val]) => {
            key = transformDecodedData(keyT, key, bindings)
            val = transformDecodedData(valueT, val, bindings)
            acc.push([key, val])
            return acc
          },
          []
        )
    }
    case SOPHIA_TYPES.option: {
      if (result === 'None') return undefined
      const [[variantType, [value]]] = Object.entries(result)
      return variantType === 'Some' ? transformDecodedData(generic, value, bindings) : undefined
    }
    case SOPHIA_TYPES.list:
      return result.map((value) => transformDecodedData(generic, value, bindings))
    case SOPHIA_TYPES.tuple:
      return result.map((value, i) => { return transformDecodedData(generic[i], value, bindings) })
    case SOPHIA_TYPES.record: {
      const genericMap = generic.reduce((acc, val) => ({ ...acc, [val.name]: { type: val.type } }), {})
      return Object.entries(result).reduce(
        (acc, [name, value]) =>
          ({
            ...acc,
            [name]: transformDecodedData(genericMap[name].type, value, bindings)
          }),
        {}
      )
    }
  }
  return result
}

// FUNCTION ARGUMENTS VALIDATION ↓↓↓

/**
 * Prepare Joi validation schema for sophia types
 * @param type
 * @param bindings
 * @return {Object} JoiSchema
 */
function prepareSchema (type, bindings) {
  const { t, generic } = readType(type, bindings)

  switch (t) {
    case SOPHIA_TYPES.int:
      return Joi.number().unsafe()
    case SOPHIA_TYPES.variant:
      return Joi.alternatives().try(
        Joi.string().valid(
          ...generic.reduce((acc, el) => {
            const [[t, g]] = Object.entries(el)
            if (!g || !g.length) acc.push(t)
            return acc
          }, [])
        ),
        Joi.object(generic
          .reduce(
            (acc, el) => {
              const variant = Object.keys(el)[0]
              return { ...acc, [variant]: Joi.array() }
            },
            {})
        ).or(...generic.map(e => Object.keys(e)[0]))
      )
    case SOPHIA_TYPES.ChainTtl:
      return Joi.string()
    case SOPHIA_TYPES.string:
      return Joi.string()
    case SOPHIA_TYPES.address:
      return Joi.string().regex(/^(ak_|ct_|ok_|oq_)/)
    case SOPHIA_TYPES.bool:
      return Joi.boolean()
    case SOPHIA_TYPES.list:
      return Joi.array().items(prepareSchema(generic, bindings))
    case SOPHIA_TYPES.tuple:
      return Joi.array().ordered(...generic.map(type => prepareSchema(type, bindings).required())).label('Tuple argument')
    case SOPHIA_TYPES.record:
      return Joi.object(
        generic.reduce((acc, { name, type }) => ({ ...acc, [name]: prepareSchema(type, bindings) }), {})
      )
    case SOPHIA_TYPES.hash:
      return JoiBinary.binary().encoding('hex').length(32)
    case SOPHIA_TYPES.bytes:
      return JoiBinary.binary().encoding('hex').length(generic)
    case SOPHIA_TYPES.signature:
      return JoiBinary.binary().encoding('hex').length(64)
    case SOPHIA_TYPES.option:
      return prepareSchema(generic, bindings).optional()
    // @Todo Need to transform Map to Array of arrays before validating it
    // case SOPHIA_TYPES.map:
    //   return Joi.array().items(Joi.array().ordered(...generic.map(type => prepareSchema(type))))
    default:
      return Joi.any()
  }
}

/**
 * Custom Joi Validator for binary type
 */
const JoiBinary = Joi.extend((joi) => ({
  type: 'binary',
  base: joi.binary(),
  coerce (value) {
    if (typeof value !== 'string') return { value: Buffer.from(value) }
  }
}))

/**
 * Validation contract function arguments
 * @param aci
 * @param params
 */
export function validateArguments (aci, params) {
  const validationSchema = Joi.array().ordered(
    ...aci.arguments
      .map(({ type }, i) => prepareSchema(type, aci.bindings).label(`[${params[i]}]`))
  ).sparse(true).label('Argument')
  const { error } = validationSchema.validate(params, { abortEarly: false })
  if (error) {
    throw error
  }
}
