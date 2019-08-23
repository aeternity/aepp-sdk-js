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

const parseArguments = (aciArgs = []) => (args) => ({
  opt: args.length > aciArgs.length ? R.last(args) : {},
  args: Object.values(args).slice(0, aciArgs.length)
})
