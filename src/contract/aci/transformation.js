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
 * Decode events fields
 * @param {Object[]} events Array of events with encoded fields
 * @param {Object} eventAci Smart contract event ACI schemas
 * @return {Object}
 */
export const decodeEvents = (events, eventAci) => events.map((event) => {
  if (!eventAci?.variant) throw new Error('Event ACI should have a variant key')
  const [nameHash, ...params] = event.topics
  const [name, types] = eventAci.variant
    .map(s => Object.entries(s)[0])
    .find(([name]) => hash(name).equals(toBytes(nameHash, true))) || []
  if (!name) return null
  const stringCount = types.filter(t => t === SOPHIA_TYPES.string).length
  if (stringCount > 1) throw new Error(`Event schema contains more than one string: ${types}`)
  const topicsCount = types.length - stringCount
  if (topicsCount !== params.length) {
    throw new Error(`Schema defines ${topicsCount} types, but ${params.length} topics present`)
  }

  return {
    address: event.address,
    name: name,
    decoded: types.map((type) =>
      decodeEventField(type === SOPHIA_TYPES.string ? event.data : params.shift(), type))
  }
})
  .filter(e => e)

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
