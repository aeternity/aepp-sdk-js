import * as R from 'ramda'

/**
 * Get function schema from contract ACI object
 * @param {Object} aci Contract ACI object
 * @param {String} name Function name
 * @return {Object} function ACI
 */
export function getFunctionACI (aci, name) {
  const fn = aci.functions.find(f => f.name === name)
  if (!fn && name !== 'init') throw new Error(`Function ${name} doesn't exist in contract`)

  return {
    ...fn,
    bindings: {
      state: aci.state,
      typedef: aci.type_defs,
      contractName: aci.name
    }
  }
}

/**
 * Build contract methods base on ACI
 * @return {Object} Contract instance methods
 */
export const buildContractMethods = (instance) => () => instance.aci
  ? instance
    .aci
    .functions
    .reduce(
      (acc, { name, arguments: args, stateful }) => ({
        ...acc,
        [name]: Object.assign(
          function () {
            const opt = arguments.length > args.length ? R.last(arguments) : {}
            if (name === 'init') return instance.deploy(Object.values(arguments), opt)
            return instance.call(name, Object.values(arguments), { ...opt, callStatic: !stateful })
          },
          {
            get () {
              const opt = arguments.length > args.length ? R.last(arguments) : {}
              console.log(opt)
              return instance.call(name, Object.values(arguments), { ...opt, callStatic: true })
            },
            send () {
              const opt = arguments.length > args.length ? R.last(arguments) : {}
              console.log(opt)
              return instance.call(name, Object.values(arguments), opt)
            }
          }
        )
      }),
      {}
    )
  : {}
