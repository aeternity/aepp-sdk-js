/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Generalized Account module - routines to use generalized account
 *
 * @module @aeternity/aepp-sdk/es/contract/ga
 * @export GeneralizedAccount
 * @example import { GeneralizedAccount } from '@aeternity/aepp-sdk'
 */

// @ts-expect-error TODO: remove me
import { TX_TYPE } from '../../tx/builder/schema'
// @ts-expect-error TODO: remove me
import { buildContractIdByContractTx, buildTx, unpackTx } from '../../tx/builder'
import { prepareGaParams } from './helpers'
import { hash } from '../../utils/crypto'
import { decode, EncodedData } from '../../utils/encoder'
// @ts-expect-error TODO remove
import { getNetworkId } from '../../node'
import { IllegalArgumentError, MissingParamError } from '../../utils/errors'
import { concatBuffers } from '../../utils/other'
import { Account } from '../../account/resolver'
import getContractInstance, { ContractInstance } from '../aci'
import { _AccountBase } from '../../account/base'
import { _ContractCompilerHttp } from '../compiler'
import NodeApi from '../../nodeApi'

export interface AuthData {
  gasLimit: number
  callData: EncodedData<'cb'>
  source?: string
  args?: object
}

interface GAObject {
  owner: string
  transaction: string
  rawTx: string
  gaContractId: string
}

// Duplicate in Chain.ts
interface Node {
  api: InstanceType<typeof NodeApi>
}

/**
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * Check if account is GA
 * @param address - Account address
 * @returns if account is GA
 */
export async function isGA (
  { onAccount }: {onAccount: Account}, address: string): Promise<boolean> {
  const { contractId } = await onAccount.getAccount(address)
  return contractId != null
}

/**
 * Convert current account to GA
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * @param authFnName - Authorization function name
 * @param source - Auth contract source code
 * @param args - init arguments
 * @param options - Options
 * @returns General Account Object
 */
export async function createGeneralizedAccount (
  { onAccount, onCompiler, onNode }: {
    onAccount: Account
    onCompiler: _ContractCompilerHttp & { api: any }
    onNode: Node},
  authFnName: string,
  source: string,
  args: any[] = [],
  options: Parameters<_AccountBase['address']>[0] &
  Parameters<ContractInstance['_estimateGas']>[2] &
  Parameters<buildTx>[2]
  = {}):
  Promise<Readonly<GAObject>> {
  const opt = { ...onAccount.Ae.defaults, ...options }
  const ownerId: string = await onAccount.address(opt)
  if (await isGA({ onAccount }, ownerId)) throw new IllegalArgumentError(`Account ${ownerId} is already GA`)

  const contract = await getContractInstance({ onAccount, onCompiler, onNode, source })

  await contract.compile()
  const tx = await onAccount.buildTx(TX_TYPE.gaAttach, {
    ...opt,
    gasLimit: opt.gasLimit ?? await contract._estimateGas('init', args, opt),
    ownerId,
    code: contract.bytecode,
    callData: contract.calldata.encode(contract._name, 'init', args),
    authFun: hash(authFnName)
  })
  const contractId = buildContractIdByContractTx(tx)
  const { hash: transaction, rawTx } = await onAccount.send(tx, opt)

  return Object.freeze({
    owner: ownerId,
    transaction,
    rawTx,
    gaContractId: contractId
  })
}

/**
 * Create a metaTx transaction
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * @param rawTransaction Inner transaction
 * @param authData Object with gaMeta params
 * @param authFnName - Authorization function name
 * @param options - Options
 * @returns Transaction string
 */
export async function createMetaTx (
  { onAccount }: { onAccount: Account },
  rawTransaction: string,
  authData: AuthData,
  authFnName: string,
  options: Parameters<_AccountBase['address']>[0] = {}): Promise<string> {
  if (Object.keys(authData).length <= 0) throw new MissingParamError('authData is required')
  // Check if authData is callData or if it's an object prepare a callData from source and args
  const { authCallData, gasLimit } = await prepareGaParams(onAccount)(authData, authFnName)
  const opt = { ...onAccount.Ae.defaults, ...options }
  const { abiVersion } = onAccount.getVmVersion(TX_TYPE.contractCall)
  const wrappedTx = wrapInEmptySignedTx(unpackTx(rawTransaction))
  const params = {
    ...opt,
    tx: {
      ...wrappedTx,
      tx: wrappedTx.txObject
    },
    gaId: await onAccount.address(opt),
    abiVersion,
    authData: authCallData,
    gasLimit,
    vsn: 2
  }
  const { fee }: {fee: number | string} = await onAccount.prepareTxParams(TX_TYPE.gaMeta, params)
  const { rlpEncoded: metaTxRlp } = buildTx(
    { ...params, fee: `${fee}` },
    TX_TYPE.gaMeta,
    { vsn: 2 }
  )
  return wrapInEmptySignedTx(metaTxRlp).tx
}

/**
 * Build a transaction hash the same as `Auth.tx_hash`
 * @alias module:@aeternity/aepp-sdk/es/contract/ga
 * @param transaction tx-encoded transaction
 * @param options Options
 * @return Transaction hash
 */

export function buildAuthTxHash (
  { onAccount }: { onAccount: Account },
  transaction: string,
  options?: {
    innerTx?: boolean
    networkId?: string
  }): Uint8Array {
  return new Uint8Array(hash(
    concatBuffers([Buffer.from(getNetworkId(onAccount, options)), decode(transaction as EncodedData<'tx'>)])
  ))
}

const wrapInEmptySignedTx = (tx: string): {
  tx: string
  rlpEncoded: Uint8Array
  binary: any[]
  txObject: object
} => buildTx({ encodedTx: tx, signatures: [] }, TX_TYPE.signed)
