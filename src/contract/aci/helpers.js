import * as R from 'ramda'
import { transform, validateArguments } from './transformation'

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
