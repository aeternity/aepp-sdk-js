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
  ABI_VERSIONS, CtVersion, PROTOCOL_VM_ABI, TX_TTL, TxParamsCommon,
} from './builder/schema';
import { Tag } from './builder/constants';
import {
  ArgumentError, UnsupportedProtocolError, UnknownTxError, InvalidTxParamsError,
} from '../utils/errors';
import Node from '../Node';
import { Encoded } from '../utils/encoder';
import { buildTx as syncBuildTx, unpackTx } from './builder/index';
import { isKeyOfObject } from '../utils/other';
import { AE_AMOUNT_FORMATS } from '../utils/amount-formatter';

type Int = number | string | BigNumber;

export type BuildTxOptions <TxType extends Tag, OmitFields extends string> =
  Omit<Parameters<typeof _buildTx<TxType>>[1], OmitFields>;

/**
 * Validated vm/abi version or get default based on transaction type and NODE version
 * @category transaction builder
 * @param txType - Type of transaction
 * @param ctVersion - Object with vm and abi version fields
 * @returns Object with vm/abi version
 */
export async function getVmVersion(
  txType: Tag.ContractCreateTx, ctVersion: Partial<CtVersion> & { onNode: Node }
): Promise<CtVersion>;
export async function getVmVersion(
  txType: Tag, ctVersion: Partial<Pick<CtVersion, 'abiVersion'>> & { onNode: Node }
): Promise<Pick<CtVersion, 'abiVersion'>>;
export async function getVmVersion(
  txType: Tag,
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
  txType: Tag,
  {
    senderId,
    nonce,
    ttl = TX_TTL,
    absoluteTtl,
    strategy,
    onNode,
  }: PrepareTxParamsOptions,
): Promise<{ ttl: number; nonce: number }> {
  nonce ??= (
    await onNode.getAccountNextNonce(senderId, { strategy }).catch(() => ({ nextNonce: 1 }))
  ).nextNonce;

  if (ttl !== 0) {
    if (ttl < 0) throw new ArgumentError('ttl', 'greater or equal to 0', ttl);
    ttl += absoluteTtl === true ? 0 : (await onNode.getCurrentKeyBlock()).height;
  }

  return { ttl, nonce };
}

interface PrepareTxParamsOptions extends Pick<TxParamsCommon, 'nonce' | 'ttl'> {
  senderId: Encoded.AccountAddress;
  absoluteTtl?: boolean;
  strategy?: 'continuity' | 'max';
  onNode: Node;
}

// TODO: find a better name or rearrange methods
/**
 * @category transaction builder
 */
export async function _buildTx<TxType extends Tag>(
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
  & (TxType extends Tag.OracleExtendTx | Tag.OracleResponseTx
    ? { callerId: Encoded.AccountAddress } : {})
  & (TxType extends Tag.ContractCreateTx | Tag.GaAttachTx ? { ctVersion?: CtVersion } : {})
  & (TxType extends Tag.ContractCallTx | Tag.OracleRegisterTx
    ? { abiVersion?: ABI_VERSIONS } : {}),
): Promise<Encoded.Transaction> {
  // TODO: avoid this assertion
  const params = _params as unknown as TxParamsCommon & { onNode: Node };
  let senderKey: keyof TxParamsCommon | '<absent>';
  switch (txType) {
    case Tag.SpendTx:
    case Tag.OracleQueryTx:
      senderKey = 'senderId';
      break;
    case Tag.NameClaimTx:
    case Tag.NameUpdateTx:
    case Tag.NameRevokeTx:
    case Tag.NameTransferTx:
    case Tag.NamePreclaimTx:
    case Tag.OracleRegisterTx:
      senderKey = 'accountId';
      break;
    case Tag.ContractCreateTx:
    case Tag.GaAttachTx:
      senderKey = 'ownerId';
      break;
    case Tag.ContractCallTx:
    case Tag.OracleExtendTx:
    case Tag.OracleResponseTx:
      senderKey = 'callerId';
      break;
    case Tag.ChannelCloseSoloTx:
    case Tag.ChannelSlashTx:
    case Tag.ChannelSettleTx:
    case Tag.ChannelSnapshotSoloTx:
      senderKey = 'fromId';
      break;
    case Tag.PayingForTx:
      senderKey = 'payerId';
      break;
    default:
      throw new ArgumentError('txType', 'valid transaction type', txType);
  }
  // TODO: move specific cases to field-types
  if ([Tag.ContractCreateTx, Tag.GaAttachTx].includes(txType)) {
    params.ctVersion = await getVmVersion(
      Tag.ContractCreateTx,
      { ...params, ...params.ctVersion },
    );
  }
  if (txType === Tag.ContractCallTx) {
    params.abiVersion = (await getVmVersion(Tag.ContractCallTx, params)).abiVersion;
  }
  if (txType === Tag.OracleRegisterTx) {
    params.abiVersion ??= ABI_VERSIONS.NO_ABI;
  }
  if (txType === Tag.PayingForTx) {
    params.tx = unpackTx(params.tx);
  }
  const senderId = params[senderKey];
  // TODO: do this check on TypeScript level
  if (senderId == null) throw new InvalidTxParamsError(`Transaction field ${senderKey} is missed`);
  const extraParams = await prepareTxParams(txType, { ...params, senderId, absoluteTtl });
  return syncBuildTx({ ...params, ...extraParams } as any, txType, { denomination }).tx;
}
