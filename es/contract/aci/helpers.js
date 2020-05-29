import * as R from 'ramda'
import { unpackTx } from '../../tx/builder'
import { decodeEvents as unpackEvents, transform, transformDecodedData, validateArguments } from './transformation'

/**
 * Get function schema from contract ACI object
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @return {Object} function ACI
 */
export function getFunctionACI (aci, name) {
  if (!aci) throw new Error('ACI required')
  const fn = aci.functions.find(f => f.name === name)
  if (!fn && name !== 'init') throw new Error(`Function ${name} doesn't exist in contract`)

  return {
    ...fn,
    bindings: {
      state: aci.state,
      typedef: aci.type_defs,
      contractName: aci.name
    },
    event: aci.event ? aci.event.variant : []
  }
}

/**
 * Build contract methods base on ACI
 * @return {Object} Contract instance methods
 */
export const buildContractMethods = (instance) => () => ({
  ...instance.aci
    ? instance
      .aci
      .functions
      .reduce(
        (acc, { name, arguments: aciArgs, stateful }) => ({
          ...acc,
          [name]: Object.assign(
            function () {
              const { opt, args } = parseArguments(aciArgs)(arguments)
              if (name === 'init') return instance.deploy(args, opt)
              return instance.call(name, args, { callStatic: !stateful, ...opt })
            },
            {
              get () {
                const { opt, args } = parseArguments(aciArgs)(arguments)
                return instance.call(name, args, { ...opt, callStatic: true })
              },
              send () {
                const { opt, args } = parseArguments(aciArgs)(arguments)
                if (name === 'init') return instance.deploy(args, opt)
                return instance.call(name, args, { ...opt, callStatic: false })
              },
              decodeEvents (events) {
                return instance.decodeEvents(name, events)
              }
            }
          )
        }),
        {}
      )
    : {},
  ...instance.aci ? {
    init: Object.assign(
      function () {
        const { arguments: aciArgs } = getFunctionACI(instance.aci, 'init')
        const { opt, args } = parseArguments(aciArgs)(arguments)
        return instance.deploy(args, opt)
      },
      {
        get () {
          const { arguments: aciArgs } = getFunctionACI(instance.aci, 'init')
          const { opt, args } = parseArguments(aciArgs)(arguments)
          return instance.deploy(args, { ...opt, callStatic: true })
        },
        send () {
          const { arguments: aciArgs } = getFunctionACI(instance.aci, 'init')
          const { opt, args } = parseArguments(aciArgs)(arguments)
          return instance.deploy(args, { ...opt, callStatic: false })
        }
      }
    )
  } : {}
})

export const parseArguments = (aciArgs = []) => (args) => ({
  opt: args.length > aciArgs.length ? R.last(args) : {},
  args: Object.values(args).slice(0, aciArgs.length)
})

export const unpackByteCode = (bytecode) => unpackTx(bytecode, false, 'cb').tx

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
  return Promise.all(aci.arguments.map(async ({ type }, i) => transform(type, params[i], {
    bindings
  })))
}

export const decodeEvents = (events, fnACI) => {
  if (!fnACI || !fnACI.event || !fnACI.event.length) return []

  const eventsSchema = fnACI.event.map(e => {
    const name = Object.keys(e)[0]
    return { name, types: e[name] }
  })
  return unpackEvents(events, { schema: eventsSchema })
}

export const decodeCallResult = async (result, fnACI, opt) => {
  return {
    decodedResult: await transformDecodedData(
      fnACI.returns,
      await result.decode(),
      { ...opt, bindings: fnACI.bindings }
    ),
    decodedEvents: decodeEvents(result.result.log, fnACI)
  }
}
