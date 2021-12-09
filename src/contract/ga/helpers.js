import BigNumber from 'bignumber.js'
import { MAX_AUTH_FUN_GAS } from '../../tx/builder/schema'
import { InvalidAuthDataError } from '../../utils/errors'

export const prepareGaParams = (ins) => async (authData, authFnName) => {
  if (typeof authData !== 'object') throw new InvalidAuthDataError('AuthData must be an object')
  if (authData.gas && BigNumber(authData.gas).gt(MAX_AUTH_FUN_GAS)) { throw new InvalidAuthDataError(`the maximum gas value for ga authFun is ${MAX_AUTH_FUN_GAS}, got ${authData.gas}`) }
  const gas = authData.gas || MAX_AUTH_FUN_GAS
  if (authData.callData) {
    if (authData.callData.split('_')[0] !== 'cb') throw new InvalidAuthDataError('Auth data must be a string with "cb" prefix.')
    return { authCallData: authData.callData, gas }
  }
  if (!authData.source || !authData.args) throw new InvalidAuthDataError('Auth data must contain source code and arguments.')
  const contract = await ins.getContractInstance({ source: authData.source })
  return {
    authCallData: contract.calldata.encode(contract.aci.name, authFnName, authData.args),
    gas
  }
}
