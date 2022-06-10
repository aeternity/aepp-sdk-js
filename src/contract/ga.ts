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
 */

import { TX_TYPE, MAX_AUTH_FUN_GAS, TxSchema } from '../tx/builder/schema'
import { buildContractIdByContractTx, buildTx, BuiltTx, TxUnpacked, unpackTx } from '../tx/builder'
import { hash } from '../utils/crypto'
import { decode, EncodedData } from '../utils/encoder'
import { IllegalArgumentError, MissingParamError, InvalidAuthDataError } from '../utils/errors'
import { concatBuffers } from '../utils/other'
import { _AccountBase } from '../account/base'
import { getContractInstance } from '../ae/contract'
import { getAccount, Node } from '../chain'

/**
 * Check if account is GA
 * @param address - Account address
 * @param options
 * @returns if account is GA
 */
export async function isGA (
  address: EncodedData<'ak'>, options: Parameters<typeof getAccount>[1]
): Promise<boolean> {
  const { contractId } = await getAccount(address, options)
  return contractId != null
}

/**
 * Convert current account to GA
 * @param authFnName - Authorization function name
 * @param source - Auth contract source code
 * @param args - init arguments
 * @param options - Options
 * @returns General Account Object
 */
export async function createGeneralizedAccount (
  authFnName: string,
  source: string,
  args: any[],
  { onAccount, onCompiler, onNode, ...options }:
  { onAccount: _AccountBase & { send: any, buildTx: any, Ae: any }, onCompiler: any, onNode: Node }
  & Parameters<_AccountBase['address']>[0] & Parameters<typeof buildTx>[2]
): Promise<Readonly<{
    owner: EncodedData<'ak'>
    transaction: EncodedData<'th'>
    rawTx: EncodedData<'tx'>
    gaContractId: EncodedData<'ct'>
  }>> {
  const opt = { ...onAccount.Ae.defaults, ...options }
  const ownerId = await onAccount.address(opt)
  if (await isGA(ownerId, { onNode })) throw new IllegalArgumentError(`Account ${ownerId} is already GA`)

  const contract = await getContractInstance({ onAccount, source })

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
 * @param rawTransaction Inner transaction
 * @param authData Object with gaMeta params
 * @param authFnName - Authorization function name
 * @param options - Options
 * @param options.onAccount Account to use
 * @returns Transaction string
 */
export async function createMetaTx (
  rawTransaction: EncodedData<'tx'>,
  authData: {
    gasLimit?: number
    callData?: EncodedData<'cb'>
    source?: string
    args?: any[]
  },
  authFnName: string,
  { onAccount, ...options }: { onAccount: any } & Parameters<_AccountBase['address']>[0]
): Promise<EncodedData<'tx'>> {
  const wrapInEmptySignedTx = (
    tx: EncodedData<'tx'> | Uint8Array | TxUnpacked<TxSchema>
  ): BuiltTx<TxSchema, 'tx'> => buildTx({ encodedTx: tx, signatures: [] }, TX_TYPE.signed)

  if (Object.keys(authData).length <= 0) throw new MissingParamError('authData is required')

  const gasLimit = authData.gasLimit ?? MAX_AUTH_FUN_GAS
  if (gasLimit > MAX_AUTH_FUN_GAS) {
    throw new InvalidAuthDataError(`the maximum gasLimit value for ga authFun is ${MAX_AUTH_FUN_GAS}, got ${gasLimit}`)
  }

  const authCallData = authData.callData ?? await (async () => {
    if (authData.source == null || authData.args == null) throw new InvalidAuthDataError('Auth data must contain source code and arguments.')
    const contract = await getContractInstance({ onAccount, source: authData.source })
    return contract.calldata.encode(contract._name, authFnName, authData.args)
  })()

  const opt = { ...onAccount.Ae.defaults, ...options }
  const { abiVersion } = onAccount.getVmVersion(TX_TYPE.contractCall)
  const wrappedTx = wrapInEmptySignedTx(unpackTx(rawTransaction, { txType: TX_TYPE.signed }))
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
  const { fee }: { fee: number | string } = await onAccount.prepareTxParams(TX_TYPE.gaMeta, params)
  const { rlpEncoded: metaTxRlp } = buildTx(
    { ...params, fee: `${fee}` },
    TX_TYPE.gaMeta,
    { vsn: 2 }
  )
  return wrapInEmptySignedTx(metaTxRlp).tx
}

/**
 * Build a transaction hash the same as `Auth.tx_hash`
 * @param transaction tx-encoded transaction
 * @param options Options
 * @param options.onNode Node to use
 * @return Transaction hash
 */
export function buildAuthTxHash (
  transaction: EncodedData<'tx'>,
  { onNode }: { onNode: Node }
): Uint8Array {
  return new Uint8Array(hash(
    concatBuffers([Buffer.from(onNode.nodeNetworkId), decode(transaction)])
  ))
}
