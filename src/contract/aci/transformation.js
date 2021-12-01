import { toBytes } from '../../utils/bytes'
import { decode } from '../../tx/builder/helpers'
import { parseBigNumber } from '../../utils/bignumber'
import { addressFromDecimal, hash } from '../../utils/crypto'
import {
  InvalidSchemaError
} from '../../utils/error'

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
 * Decode events fields
 * @param {Object[]} events Array of events with encoded fields
 * @param {Array} schemas Smart contract event ACI schemas
 * @return {Object}
 */
export const decodeEvents = (events, schemas = []) => events.reduce((acc, event) => {
  const [nameHash, ...params] = event.topics
  const schema = schemas.find((s) => hash(s.name).equals(toBytes(nameHash, true)))
  if (!schema) return acc
  const stringCount = schema.types.filter(t => t === SOPHIA_TYPES.string).length
  if (stringCount > 1) throw new InvalidSchemaError(`Event schema contains more than one string: ${schema.types}`)
  const topicsCount = schema.types.length - stringCount
  if (topicsCount !== params.length) {
    throw new InvalidSchemaError(`Schema defines ${topicsCount} types, but ${params.length} topics present`)
  }

  acc.push({
    ...event,
    name: schema.name,
    decoded: schema.types.map((type) =>
      decodeEventField(type === SOPHIA_TYPES.string ? event.data : params.shift(), type))
  })

  return acc
}, [])

/**
 * Transform Event based on type
 * @param {String|Number} field Event data
 * @param {String} type Event type from schema
 * @return {*}
 */
function decodeEventField (field, type) {
  switch (type) {
    case SOPHIA_TYPES.int:
      return parseBigNumber(field)
    case SOPHIA_TYPES.bool:
      return !!field
    case SOPHIA_TYPES.hash:
      return toBytes(field, true).toString('hex')
    case SOPHIA_TYPES.address:
      return addressFromDecimal(field)
    case SOPHIA_TYPES.string:
      return decode(field).toString('utf-8')
    default:
      return toBytes(field, true)
  }
}
