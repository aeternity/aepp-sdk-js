import BigNumber from 'bignumber.js'
// @ts-expect-error TODO: remove me
import { MAX_AUTH_FUN_GAS } from '../../tx/builder/schema'
import { InvalidAuthDataError } from '../../utils/errors'
import { AuthData } from './index'
import { _Contract } from '../../ae/contract'

export const prepareGaParams = (ins: _Contract) => async (
  authData: AuthData,
  authFnName: string): Promise<{authCallData: string, gasLimit: number}> => {
  const gasLimit = authData.gasLimit ?? MAX_AUTH_FUN_GAS
  if (new BigNumber(gasLimit).gt(MAX_AUTH_FUN_GAS)) {
    throw new InvalidAuthDataError(`the maximum gasLimit value for ga authFun is ${MAX_AUTH_FUN_GAS}, got ${gasLimit}`)
  }
  if (authData?.callData?.length > 0) {
    if (authData.callData.split('_')[0] !== 'cb') throw new InvalidAuthDataError('Auth data must be a string with "cb" prefix.')
    return { authCallData: authData.callData, gasLimit }
  }
  if ((authData.source == null) || (authData.args == null)) throw new InvalidAuthDataError('Auth data must contain source code and arguments.')
  const contract = await ins.getContractInstance({ source: authData.source })
  return {
    authCallData: contract.calldata.encode(contract._name, authFnName, authData.args),
    gasLimit
  }
}
