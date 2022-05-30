import BigNumber from 'bignumber.js'
// @ts-expect-error TODO: remove me
import { MAX_AUTH_FUN_GAS } from '../../tx/builder/schema'
import { InvalidAuthDataError } from '../../utils/errors'
import { AuthData } from './index'
// @ts-expect-error TODO: remove me
import Ae from '../../ae/index'

export const prepareGaParams = (ins: Ae) => async (
  authData: AuthData,
  authFnName: string): Promise<{authCallData: string, gasLimit: number}> => {
  const gasLimit = authData.gasLimit ?? MAX_AUTH_FUN_GAS
  if (new BigNumber(gasLimit).gt(MAX_AUTH_FUN_GAS)) {
    throw new InvalidAuthDataError(`the maximum gasLimit value for ga authFun is ${MAX_AUTH_FUN_GAS}, got ${gasLimit}`)
  }
  if (authData.callData != null) return { authCallData: authData.callData, gasLimit }
  if ((authData.source == null) || (authData.args == null)) throw new InvalidAuthDataError('Auth data must contain source code and arguments.')
  const contract = await ins.getContractInstance({ source: authData.source })
  return {
    authCallData: contract.calldata.encode(contract._name, authFnName, authData.args),
    gasLimit
  }
}
