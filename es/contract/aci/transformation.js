import Joi from 'joi-browser'
import { toBytes } from '../../utils/bytes'
import { addressFromDecimal, hash } from '../../utils/crypto'
import { decode } from '../../tx/builder/helpers'

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
].reduce((acc, type) => ({ ...acc, [type]: type }), {})

export function injectVars (t, aciType) {
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
export function linkTypeDefs (t, bindings) {
  const [, typeDef] = typeof t === 'object' ? Object.keys(t)[0].split('.') : t.split('.')
  const aciType = [
    ...bindings.typedef,
    { name: 'state', typedef: bindings.state, vars: [] }
  ].find(({ name }) => name === typeDef)
  if (aciType.vars.length) {
    aciType.typedef = injectVars(t, aciType)
  }

  return aciType.typedef
}

/**
 * Parse sophia type
 * @param type
 * @param returnType
 * @return {Object}
 */
export function readType (type, { bindings } = {}) {
  let [t] = Array.isArray(type) ? type : [type]

  // Link State and typeDef
  if (
    (typeof t === 'string' && t.indexOf(bindings.contractName) !== -1) ||
    (typeof t === 'object' && Object.keys(t)[0] && Object.keys(t)[0].indexOf(bindings.contractName) !== -1)
  ) {
    t = linkTypeDefs(t, bindings)
  }

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
export function transform (type, value, { bindings } = {}) {
  const { t, generic } = readType(type, { bindings })

  switch (t) {
    case SOPHIA_TYPES.string:
      return `"${value}"`
    case SOPHIA_TYPES.list:
      return `[${value.map(el => transform(generic, el, { bindings }))}]`
    case SOPHIA_TYPES.tuple:
      return `(${value.map((el, i) => transform(generic[i], el, {
        bindings
      }))})`
    case SOPHIA_TYPES.option: {
      return value === undefined ? 'None' : `Some(${transform(generic, value, {
        bindings
      })})`
    }
    case SOPHIA_TYPES.hash:
    case SOPHIA_TYPES.bytes:
    case SOPHIA_TYPES.signature:
      return `#${typeof value === 'string' ? value : Buffer.from(value).toString('hex')}`
    case SOPHIA_TYPES.record:
      return `{${generic.reduce(
        (acc, { name, type }, i) => {
          acc += `${i !== 0 ? ',' : ''}${name} = ${transform(type, value[name], {
            bindings
          })}`
          return acc
        },
        ''
      )}}`
    case SOPHIA_TYPES.map:
      return transformMap(value, generic, { bindings })
    case SOPHIA_TYPES.variant:
      return transformVariant(value, generic, { bindings })
  }

  return `${value}`
}

function transformVariant (value, generic, { bindings }) {
  const [[variant, variantArgs]] = typeof value === 'string' ? [[value, []]] : Object.entries(value)
  const [[v, type]] = Object.entries(generic.find(o => Object.keys(o)[0].toLowerCase() === variant.toLowerCase()))
  return `${v}${!type.length
    ? ''
    : `(${variantArgs.slice(0, type.length).map((el, i) => transform(type[i], el, {
      bindings
    }))})`
  }`
}

export function transformMap (value, generic, { bindings }) {
  if (value instanceof Map) {
    value = Array.from(value.entries())
  }
  if (!Array.isArray(value) && value instanceof Object) {
    value = Object.entries(value)
  }

  return `{${value
    .reduce(
      (acc, [key, value], i) => {
        if (i !== 0) acc += ','
        acc += `[${transform(generic[0], key, {
          bindings
        })}] = ${transform(generic[1], value, { bindings })}`
        return acc
      },
      ''
    )
  }}`
}

// FUNCTION RETURN VALUE TRANSFORMATION ↓↓↓

/**
 * Transform decoded event to JS type
 * @param events
 * @param fnACI
 * @return {*}
 */
export function transformDecodedEvents (events, fnACI) {
  if (!events.length) return []

  const eventsSchema = fnACI.event.map(e => {
    const name = Object.keys(e)[0]
    return { name, value: e[name], nameHash: hash(name).toString('hex') }
  })

  return events.map(l => {
    const [eName, ...eParams] = l.topics
    const hexHash = toBytes(eName, true).toString('hex')
    const { schema, isHasNonIndexed } = eventsSchema
      .reduce(
        (acc, el) => {
          if (el.nameHash === hexHash) {
            return { schema: el.value.filter(e => e !== 'string'), isHasNonIndexed: el.value.includes('string') }
          }
          return acc
        },
        { schema: [], isHasNonIndexed: false }
      )
    return {
      ...l,
      decoded: [
        ...isHasNonIndexed ? [decode(l.data).toString('utf-8')] : [],
        ...eParams.map((event, i) => transformEvent(event, schema[i]))
      ]
    }
  })
}

function transformEvent (event, type) {
  switch (type) {
    case SOPHIA_TYPES.bool:
      return !!event
    case SOPHIA_TYPES.string:
      return toBytes(event, true).toString()
    case SOPHIA_TYPES.hash:
      return toBytes(event, true).toString('hex')
    case SOPHIA_TYPES.address:
      return addressFromDecimal(event)
    default:
      return event
  }
}

/**
 * Transform decoded data to JS type
 * @param aci
 * @param result
 * @param transformDecodedData
 * @return {*}
 */
export function transformDecodedData (aci, result, { skipTransformDecoded = false, addressPrefix = 'ak', bindings } = {}) {
  if (skipTransformDecoded) return result
  const { t, generic } = readType(aci, { bindings })

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
            key = transformDecodedData(keyT, key, { bindings })
            val = transformDecodedData(valueT, val, { bindings })
            acc.push([key, val])
            return acc
          },
          []
        )
    }
    case SOPHIA_TYPES.option: {
      if (result === 'None') return undefined
      const [[variantType, [value]]] = Object.entries(result)
      return variantType === 'Some' ? transformDecodedData(generic, value, { bindings }) : undefined
    }
    case SOPHIA_TYPES.list:
      return result.map((value) => transformDecodedData(generic, value, { bindings }))
    case SOPHIA_TYPES.tuple:
      return result.map((value, i) => { return transformDecodedData(generic[i], value, { bindings }) })
    case SOPHIA_TYPES.record: {
      const genericMap = generic.reduce((acc, val) => ({ ...acc, [val.name]: { type: val.type } }), {})
      return Object.entries(result).reduce(
        (acc, [name, value]) =>
          ({
            ...acc,
            [name]: transformDecodedData(genericMap[name].type, value, { bindings })
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
export function prepareSchema (type, { bindings } = {}) {
  let { t, generic } = readType(type, { bindings })

  if (!Object.keys(SOPHIA_TYPES).includes(t)) t = SOPHIA_TYPES.address // Handle Contract address transformation
  switch (t) {
    case SOPHIA_TYPES.int:
      return Joi.number().error(getJoiErrorMsg)
    case SOPHIA_TYPES.variant:
      return Joi.alternatives().try([
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
      ])
    case SOPHIA_TYPES.string:
      return Joi.string().error(getJoiErrorMsg)
    case SOPHIA_TYPES.address:
      return Joi.string().regex(/^(ak_|ct_|ok_|oq_)/).error(getJoiErrorMsg)
    case SOPHIA_TYPES.bool:
      return Joi.boolean().error(getJoiErrorMsg)
    case SOPHIA_TYPES.list:
      return Joi.array().items(prepareSchema(generic, { bindings })).error(getJoiErrorMsg)
    case SOPHIA_TYPES.tuple:
      return Joi.array().ordered(generic.map(type => prepareSchema(type, { bindings }).required())).label('Tuple argument').error(getJoiErrorMsg)
    case SOPHIA_TYPES.record:
      return Joi.object(
        generic.reduce((acc, { name, type }) => ({ ...acc, [name]: prepareSchema(type, { bindings }) }), {})
      ).error(getJoiErrorMsg)
    case SOPHIA_TYPES.hash:
      return JoiBinary.binary().bufferCheck(32).error(getJoiErrorMsg)
    case SOPHIA_TYPES.bytes:
      return JoiBinary.binary().bufferCheck(generic).error(getJoiErrorMsg)
    case SOPHIA_TYPES.signature:
      return JoiBinary.binary().bufferCheck(64).error(getJoiErrorMsg)
    case SOPHIA_TYPES.option:
      return prepareSchema(generic, { bindings }).optional().error(getJoiErrorMsg)
    // @Todo Need to transform Map to Array of arrays before validating it
    // case SOPHIA_TYPES.map:
    //   return Joi.array().items(Joi.array().ordered(generic.map(type => prepareSchema(type))))
    default:
      return Joi.any()
  }
}

/**
 * Parse Joi validation error message
 * @param errors
 * @return {Object} JoiError
 */
export function getJoiErrorMsg (errors) {
  return errors.map(err => {
    const { path, type, context } = err
    let value = Object.prototype.hasOwnProperty.call(context, 'value') ? context.value : context.label
    value = typeof value === 'object' ? JSON.stringify(value).slice(1).slice(0, -1) : value
    switch (type) {
      case 'string.base':
        return ({ ...err, message: `Value "${value}" at path: [${path}] not a string` })
      case 'number.base':
        return ({ ...err, message: `Value "${value}" at path: [${path}] not a number` })
      case 'boolean.base':
        return ({ ...err, message: `Value "${value}" at path: [${path}] not a boolean` })
      case 'array.base':
        return ({ ...err, message: `Value "${value}" at path: [${path}] not a array` })
      case 'object.base':
        return ({ ...err, message: `Value '${value}' at path: [${path}] not a object` })
      case 'object.type':
        return ({ ...err, message: `Value '${value}' at path: [${path}] not a ${context.type}` })
      case 'binary.bufferCheck':
        return ({
          ...err,
          message: `Value '${Buffer.from(value).toString('hex')}' at path: [${path}] not a ${context.size} bytes`
        })
      default:
        return err
    }
  })
}

/**
 * Custom Joi Validator for binary type
 */
const JoiBinary = Joi.extend((joi) => ({
  name: 'binary',
  base: joi.any(),
  pre (value, state, options) {
    if (options.convert && typeof value === 'string') {
      try {
        return Buffer.from(value, 'hex')
      } catch (e) { return undefined }
    }

    return Buffer.from(value)
  },
  rules: [
    {
      name: 'bufferCheck',
      params: {
        size: joi.number().required()
      },
      validate (params, value, state, options) {
        value = value === 'string' ? Buffer.from(value, 'hex') : Buffer.from(value)
        if (!Buffer.isBuffer(value)) {
          return this.createError('binary.base', { value }, state, options)
        }
        if (value.length !== params.size) {
          return this.createError('binary.bufferCheck', { value, size: params.size }, state, options)
        }

        return value
      }
    }
  ]
}))

/**
 * Validation contract function arguments
 * @param aci
 * @param params
 */
export function validateArguments (aci, params) {
  const validationSchema = Joi.array().ordered(
    aci.arguments
      .map(({ type }, i) => prepareSchema(type, { bindings: aci.bindings }).label(`[${params[i]}]`))
  ).sparse(true).label('Argument')
  const { error } = Joi.validate(params, validationSchema, { abortEarly: false })
  if (error) {
    throw error
  }
}
