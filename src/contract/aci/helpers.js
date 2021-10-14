import * as R from 'ramda'
import { decodeEvents as unpackEvents, transform, transformDecodedData, validateArguments } from './transformation'

/**
 * Get function schema from contract ACI object
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @param external
 * @return {Object} function ACI
 */
export function getFunctionACI (aci, name, external) {
  if (!aci) throw new Error('ACI required')
  const fn = aci.functions.find(f => f.name === name)
  if (!fn && name !== 'init') throw new Error(`Function ${name} doesn't exist in contract`)

  return {
    ...fn,
    bindings: [
      {
        state: aci.state,
        type_defs: aci.type_defs,
        name: aci.name
      },
      ...external.map(R.pick(['state', 'type_defs', 'name']))
    ],
    event: aci.event ? aci.event.variant : []
  }
}

/**
 * Build contract methods base on ACI
 * @return {Object} Contract instance methods
 */
export const buildContractMethods = (instance) => Object.fromEntries(instance.aci.functions
  .map(({ name, arguments: aciArgs, stateful }) => {
    const genHandler = callStatic => (...args) => {
      const options = args.length === aciArgs.length + 1 ? args.pop() : {}
      if (typeof options !== 'object') throw new Error(`Options should be an object: ${options}`)
      if (name === 'init') return instance.deploy(args, { callStatic, ...options })
      return instance.call(name, args, { callStatic, ...options })
    }
    return [
      name,
      Object.assign(
        genHandler(name === 'init' ? false : !stateful),
        {
          get: genHandler(true),
          send: genHandler(false),
          decodeEvents: events => instance.decodeEvents(name, events)
        }
      )
    ]
  })
)

/**
 * Validated contract call arguments using contract ACI
 * @function validateCallParams
 * @rtype (aci: Object, params: Array) => Object
 * @param {Object} aci Contract ACI
 * @param {Array} params Contract call arguments
 * @return Promise{Array} Object with validation errors
 */
export const prepareArgsForEncode = async (aci, params) => {
  if (!aci || !aci.arguments) return params
  // Validation
  if (aci.arguments.length > params.length) {
    throw new Error(`Function "${aci.name}" require ${aci.arguments.length} arguments of types [${aci.arguments.map(a => JSON.stringify(a.type))}] but get [${params.map(JSON.stringify)}]`)
  }

  validateArguments(aci, params)
  const bindings = aci.bindings
  // Cast argument from JS to Sophia type
  return Promise.all(aci.arguments.map(async ({ type }, i) => transform(type, params[i], bindings)))
}

export const decodeEvents = (events, fnACI) => {
  if (!fnACI || !fnACI.event || !fnACI.event.length) return []

  const eventsSchema = fnACI.event.map(e => {
    const name = Object.keys(e)[0]
    return { name, types: e[name] }
  })
  return unpackEvents(events, { schema: eventsSchema })
}

export const decodeCallResult = async (result, fnACI) => ({
  decodedResult: await transformDecodedData(
    fnACI.returns,
    await result.decode(),
    fnACI.bindings
  ),
  decodedEvents: decodeEvents(result.result.log, fnACI)
})
