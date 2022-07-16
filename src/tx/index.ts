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
 * the creation of transactions to {@link Node}.
 * These methods provide ability to create native transactions.
 */
import BigNumber from 'bignumber.js';
import {
  ABI_VERSIONS, CtVersion, PROTOCOL_VM_ABI, TX_TYPE, TX_TTL, TxParamsCommon,
} from './builder/schema';
import {
  ArgumentError, UnsupportedProtocolError, UnknownTxError, InvalidTxParamsError,
} from '../utils/errors';
import Node from '../Node';
import { EncodedData } from '../utils/encoder';
import { buildTx as syncBuildTx, unpackTx } from './builder/index';
import calculateMinFee from './min-fee';
import { isKeyOfObject } from '../utils/other';
import { AE_AMOUNT_FORMATS } from '../utils/amount-formatter';

type Int = number | string | BigNumber;

export type BuildTxOptions <TxType extends TX_TYPE, OmitFields extends string> =
  Omit<Parameters<typeof _buildTx<TxType>>[1], OmitFields>;

/**
 * Validated vm/abi version or get default based on transaction type and NODE version
 * @category transaction builder
 * @param txType - Type of transaction
 * @param ctVersion - Object with vm and abi version fields
 * @returns Object with vm/abi version
 */
export async function getVmVersion(
  txType: TX_TYPE.contractCreate, ctVersion: Partial<CtVersion> & { onNode: Node }
): Promise<CtVersion>;
export async function getVmVersion(
  txType: TX_TYPE, ctVersion: Partial<Pick<CtVersion, 'abiVersion'>> & { onNode: Node }
): Promise<Pick<CtVersion, 'abiVersion'>>;
export async function getVmVersion(
  txType: TX_TYPE,
  { vmVersion, abiVersion, onNode }: Partial<CtVersion> & { onNode: Node },
): Promise<Partial<CtVersion>> {
  const { consensusProtocolVersion } = await onNode.getNodeInfo();
  if (!isKeyOfObject(consensusProtocolVersion, PROTOCOL_VM_ABI)) {
    throw new UnsupportedProtocolError('Not supported consensus protocol version');
  }
  const supportedProtocol = PROTOCOL_VM_ABI[consensusProtocolVersion];
  if (!isKeyOfObject(txType, supportedProtocol)) {
    throw new UnknownTxError('Not supported tx type');
  }
  const protocolForTX = supportedProtocol[txType];
  abiVersion ??= protocolForTX.abiVersion[0];
  vmVersion ??= protocolForTX.vmVersion[0];
  return { vmVersion, abiVersion };
}

/**
 * Calculate fee, get absolute ttl (ttl + height), get account nonce
 * @category transaction builder
 * @param txType - Type of transaction
 * @param params - Object which contains all tx data
 * @returns Object with account nonce, absolute ttl and transaction fee
 */
export async function prepareTxParams(
  txType: TX_TYPE,
  {
    senderId,
    nonce,
    ttl = TX_TTL,
    fee: f,
    absoluteTtl,
    vsn,
    strategy,
    denomination,
    onNode,
    ...txParams
  }: PrepareTxParamsOptions,
): Promise<{ fee: BigNumber; ttl: number; nonce: number }> {
  nonce ??= (
    await onNode.getAccountNextNonce(senderId, { strategy }).catch(() => ({ nextNonce: 1 }))
  ).nextNonce;

  if (ttl !== 0) {
    if (ttl < 0) throw new ArgumentError('ttl', 'greater or equal to 0', ttl);
    ttl += absoluteTtl === true ? 0 : (await onNode.getCurrentKeyBlock()).height;
  }

  const fee = f != null
    ? new BigNumber(f)
    : calculateMinFee(txType, {
      params: {
        ...txParams, senderId, nonce, ttl,
      },
      vsn,
      denomination,
    });
  return { fee, ttl, nonce };
}

interface PrepareTxParamsOptions extends Pick<TxParamsCommon, 'nonce' | 'ttl' | 'fee'> {
  senderId: EncodedData<'ak'>;
  vsn?: number;
  absoluteTtl?: boolean;
  strategy?: 'continuity' | 'max';
  denomination?: AE_AMOUNT_FORMATS;
  onNode: Node;
}

// TODO: find a better name or rearrange methods
/**
 * @category transaction builder
 */
export async function _buildTx<TxType extends TX_TYPE>(
  txType: TxType,
  { denomination, absoluteTtl, ..._params }:
  Omit<Parameters<typeof syncBuildTx<TxType, 'tx'>>[0], 'fee' | 'nonce' | 'ttl' | 'ctVersion' | 'abiVersion'>
  & {
    onNode: Node;
    fee?: Int;
    nonce?: number;
    ttl?: number;
    denomination?: AE_AMOUNT_FORMATS;
    absoluteTtl?: boolean;
  }
  & (TxType extends TX_TYPE.oracleExtend | TX_TYPE.oracleResponse ? { callerId: EncodedData<'ak'> } : {})
  & (TxType extends TX_TYPE.contractCreate | TX_TYPE.gaAttach ? { ctVersion?: CtVersion } : {})
  & (TxType extends TX_TYPE.contractCall | TX_TYPE.oracleRegister
    ? { abiVersion?: ABI_VERSIONS } : {}),
): Promise<EncodedData<'tx'>> {
  // TODO: avoid this assertion
  const params = _params as unknown as TxParamsCommon & { onNode: Node };
  let senderKey: keyof TxParamsCommon | '<absent>';
  switch (txType) {
    case TX_TYPE.spend:
    case TX_TYPE.oracleQuery:
      senderKey = 'senderId';
      break;
    case TX_TYPE.nameClaim:
    case TX_TYPE.nameUpdate:
    case TX_TYPE.nameRevoke:
    case TX_TYPE.nameTransfer:
    case TX_TYPE.namePreClaim:
    case TX_TYPE.oracleRegister:
      senderKey = 'accountId';
      break;
    case TX_TYPE.contractCreate:
    case TX_TYPE.gaAttach:
      senderKey = 'ownerId';
      break;
    case TX_TYPE.contractCall:
    case TX_TYPE.oracleExtend:
    case TX_TYPE.oracleResponse:
      senderKey = 'callerId';
      break;
    case TX_TYPE.channelCloseSolo:
    case TX_TYPE.channelSlash:
    case TX_TYPE.channelSettle:
    case TX_TYPE.channelSnapshotSolo:
      senderKey = 'fromId';
      break;
    case TX_TYPE.payingFor:
      senderKey = 'payerId';
      break;
    default:
      throw new ArgumentError('txType', 'valid transaction type', txType);
  }
  // TODO: move specific cases to field-types
  if ([TX_TYPE.contractCreate, TX_TYPE.gaAttach].includes(txType)) {
    params.ctVersion = await getVmVersion(
      TX_TYPE.contractCreate,
      { ...params, ...params.ctVersion },
    );
  }
  if (txType === TX_TYPE.contractCall) {
    params.abiVersion = (await getVmVersion(TX_TYPE.contractCall, params)).abiVersion;
  }
  if (txType === TX_TYPE.oracleRegister) {
    params.abiVersion ??= ABI_VERSIONS.NO_ABI;
  }
  if (txType === TX_TYPE.payingFor) {
    params.tx = unpackTx(params.tx);
  }
  const senderId = params[senderKey];
  // TODO: do this check on TypeScript level
  if (senderId == null) throw new InvalidTxParamsError(`Transaction field ${senderKey} is missed`);
  const extraParams = await prepareTxParams(txType, {
    ...params, senderId, denomination, absoluteTtl,
  });
  return syncBuildTx({ ...params, ...extraParams } as any, txType, { denomination }).tx;
}
