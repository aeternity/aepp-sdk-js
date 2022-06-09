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
 * Transaction methods
 *
 * This is implementation of [Tx](api/tx.md) relays
 * the creation of transactions to {@link module:@aeternity/aepp-sdk/es/Node}.
 * These methods provide ability to create native transaction's,
 * or transaction's using Node API.
 * As there is no built-in security between Node and client communication,
 * creating transaction using {@link module:@aeternity/aepp-sdk/es/Node} API
 * must never be used for production but can be very useful to verify other
 * implementations.
 */
import {
  ABI_VERSIONS,
  PROTOCOL_VM_ABI,
  TX_TYPE,
  TX_TTL,
  TxType,
  TxParamsCommon
} from './builder/schema'
import {
  ArgumentError,
  UnsupportedProtocolError,
  UnknownTxError,
  UnexpectedTsError
} from '../utils/errors'
import { BigNumber } from 'bignumber.js'
import Node from '../node'
import { EncodedData } from '../utils/encoder'
import { buildTx as syncBuildTx, calculateFee, unpackTx } from './builder/index'

export interface VmVersion {
  vmVersion: number | string | BigNumber
  abiVersion: number | string | BigNumber
}

// TODO: find a better name or rearrange methods
export async function _buildTx (
  txType: TxType,
  params: TxParamsCommon & Partial<VmVersion> & { onNode: Node }
): Promise<EncodedData<'tx'>> {
  let senderKey: keyof TxParamsCommon
  switch (txType) {
    case TX_TYPE.spend:
    case TX_TYPE.oracleQuery:
      senderKey = 'senderId'
      break
    case TX_TYPE.nameClaim:
    case TX_TYPE.nameUpdate:
    case TX_TYPE.nameRevoke:
    case TX_TYPE.nameTransfer:
    case TX_TYPE.namePreClaim:
    case TX_TYPE.oracleRegister:
      senderKey = 'accountId'
      break
    case TX_TYPE.contractCreate:
    case TX_TYPE.gaAttach:
      senderKey = 'ownerId'
      break
    case TX_TYPE.contractCall:
    case TX_TYPE.oracleExtend:
    case TX_TYPE.oracleResponse:
      senderKey = 'callerId'
      break
    case TX_TYPE.channelCloseSolo:
    case TX_TYPE.channelSlash:
    case TX_TYPE.channelSettle:
    case TX_TYPE.channelSnapshotSolo:
      senderKey = 'fromId'
      break
    case TX_TYPE.payingFor:
      senderKey = 'payerId'
      break
    default:
      throw new ArgumentError('txType', 'valid transaction type', txType)
  }
  // TODO: move specific cases to field-types
  if ([TX_TYPE.contractCreate, TX_TYPE.gaAttach].includes(txType as any)) {
    params.ctVersion = await getVmVersion(TX_TYPE.contractCreate, params)
  }
  if (txType === TX_TYPE.contractCall) {
    params.abiVersion = (await getVmVersion(TX_TYPE.contractCall, params)).abiVersion
  }
  if (txType === TX_TYPE.oracleRegister) {
    params.abiVersion ??= ABI_VERSIONS.NO_ABI
  }
  if (txType === TX_TYPE.payingFor) {
    params.tx = unpackTx(params.tx)
  }
  const extraParams = await prepareTxParams(txType, { ...params, senderId: params[senderKey] })
  return syncBuildTx({ ...params, ...extraParams }, txType).tx
}

/**
 * Validated vm/abi version or get default based on transaction type and NODE version
 *
 * @param txType Type of transaction
 * @param vmAbi Object with vm and abi version fields
 *  @return Object with vm/abi version
 */
export async function getVmVersion (
  txType: TxType,
  { vmVersion, abiVersion, onNode }: Partial<VmVersion> & {
    onNode: Node
  }
): Promise<VmVersion> {
  if (onNode == null) throw new UnexpectedTsError('onNode')
  const { consensusProtocolVersion } = await onNode.getNodeInfo()
  const supportedProtocol = PROTOCOL_VM_ABI[
    +consensusProtocolVersion as keyof typeof PROTOCOL_VM_ABI
  ]
  if (supportedProtocol == null) throw new UnsupportedProtocolError('Not supported consensus protocol version')
  const protocolForTX = supportedProtocol[txType as keyof typeof supportedProtocol]
  if (protocolForTX == null) throw new UnknownTxError('Not supported tx type')
  if (abiVersion == null || abiVersion === 0) { abiVersion = protocolForTX.abiVersion[0] }
  if (vmVersion == null || vmVersion === 0) { vmVersion = protocolForTX.vmVersion[0] as number }
  return { vmVersion, abiVersion }
}

/**
 * Compute the absolute ttl by adding the ttl to the current height of the chain
 *
 * @param ttl
 * @param relative ttl is absolute or relative(default: true(relative))
 * @return Absolute Ttl
 */
export async function calculateTtl (
  { ttl = TX_TTL, relative = true, onNode }:
  { ttl?: number, relative?: boolean, onNode: Node }
): Promise<number> {
  if (ttl === 0) return 0
  if (ttl < 0) throw new ArgumentError('ttl', 'greater or equal to 0', ttl)

  if (relative) {
    const { height } = await onNode.getCurrentKeyBlock()
    return +(height) + ttl
  }
  return ttl
}

/**
 * Get the next nonce to be used for a transaction for an account
 *
 * @param accountId
 * @param nonce
 * @return Next Nonce
 */
export async function getAccountNonce (
  accountId: string,
  { nonce, onNode }:
  { nonce: number, onNode: Node }
): Promise<number> {
  if (nonce != null) return nonce
  const { nonce: accountNonce } = await onNode.getAccountByPubkey(accountId)
    .catch(() => ({ nonce: 0 }))
  return accountNonce + 1
}

/**
 * Calculate fee, get absolute ttl (ttl + height), get account nonce
 *
 * @param txType Type of transaction
 * @param params Object which contains all tx data
 * @return Object with account nonce, absolute ttl and transaction fee
 */
export async function prepareTxParams (
  txType: TxType,
  {
    senderId,
    nonce: n,
    ttl: t,
    fee: f,
    gasLimit,
    absoluteTtl,
    vsn,
    strategy,
    showWarning = false,
    onNode
  }: TxParamsCommon & {
    vsn?: number
    gasLimit?: number | string | BigNumber
    absoluteTtl?: number
    strategy?: 'continuity' | 'max'
    showWarning?: boolean
    onNode: Node
  }
): Promise<{
    fee: number | string | BigNumber
    ttl: number
    nonce: number | string | BigNumber
  }> {
  if (onNode == null) throw new UnexpectedTsError('onNode')
  n = n ?? (
    await onNode.getAccountNextNonce(senderId, { strategy }).catch(() => ({ nextNonce: 1 }))
  ).nextNonce as number
  const ttl = await calculateTtl({
    ttl: t as number,
    relative: absoluteTtl == null,
    onNode
  })
  const fee = calculateFee(
    f,
    txType,
    { showWarning, gasLimit, params: { ...arguments[1], nonce: n, ttl }, vsn }
  )
  return { fee, ttl, nonce: n }
}
