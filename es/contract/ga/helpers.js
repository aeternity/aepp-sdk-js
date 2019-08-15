import BigNumber from 'bignumber.js'
import { MAX_AUTH_FUN_GAS, TX_TYPE } from '../../tx/builder/schema'
import { buildTx, unpackTx } from '../../tx/builder'

export const prepareGaParams = (ins) => async (authData, authFnName) => {
  if (typeof authData !== 'object') throw new Error('AuthData must be an object')
  if (authData.gas && BigNumber(authData.gas).gt(MAX_AUTH_FUN_GAS)) throw new Error(`the maximum gas value for ga authFun is ${MAX_AUTH_FUN_GAS}, got ${authData.gas}`)
  const gas = authData.gas || MAX_AUTH_FUN_GAS
  if (authData.callData) {
    if (authData.callData.split('_')[0] !== 'cb') throw new Error('Auth data must be a string with "cb" prefix.')
    return { authCallData: authData.callData, gas }
  } else {
    if (!authData.source || !authData.args) throw new Error('Auth data must contain source code and arguments.')
    return { authCallData: await ins.contractEncodeCall(authData.source, authFnName, authData.args), gas }
  }
}

export const getContractAuthFan = (ins) => async (source, fnName) => {
  const { bytecode } = await ins.contractCompile(source)
  const { tx: { typeInfo } } = await unpackTx(bytecode, false, 'cb')
  if (!typeInfo[fnName]) throw new Error(`Can't find authFan for function "${fnName}"`)
  const { funHash: authFun } = typeInfo[fnName]
  return { bytecode, authFun }
}

export const wrapInEmptySignedTx = (rlp) => buildTx({ encodedTx: rlp, signatures: [] }, TX_TYPE.signed)
