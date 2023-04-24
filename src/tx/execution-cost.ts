import { Encoded } from '../utils/encoder';
import { buildTx, buildTxHash, unpackTx } from './builder';
import { Tag } from './builder/constants';
import { verify } from '../utils/crypto';
import { getBufferToSign } from '../account/Memory';
import { IllegalArgumentError, InternalError, TransactionError } from '../utils/errors';
import Node from '../Node';
import getTransactionSignerAddress from './transaction-signer';

/**
 * Calculates the cost of transaction execution
 * Provides an upper cost of contract-call-related transactions because of `gasLimit`.
 * Also assumes that oracle query fee is 0 unless it is provided in options.
 *
 * The idea is that if you need to show transaction details with some accuracy you can define
 * expense fields that you want to show separately. And to show `getExecutionCost` result as a fee,
 * subtracting all fields shown separately.
 *
 * @example
 * ```vue
 * <template>
 * Amount: {{ txUnpacked.amount }}
 * Name fee: {{ txUnpacked.nameFee }}
 * Other fees: {{ getExecutionCost(txEncoded) - txUnpacked.amount - txUnpacked.nameFee }}
 * </template>
 * ```
 *
 * Doing this way you won't worry to show wrong fee for a transaction you may not support. Because
 * the SDK calculates the overall price of any transaction on its side.
 *
 * @param transaction - Transaction to calculate the cost of
 * @param innerTx - Should be provided if transaction wrapped with Tag.PayingForTx
 * @param gasUsed - Amount of gas actually used to make calculation more accurate
 * @param queryFee - Oracle query fee
 * @param isInitiator - Is transaction signer an initiator of state channel
 */
export function getExecutionCost(
  transaction: Encoded.Transaction,
  {
    innerTx, gasUsed, queryFee, isInitiator,
  }: {
    innerTx?: 'fee-payer' | 'freeloader';
    gasUsed?: number;
    queryFee?: string;
    isInitiator?: boolean;
  } = {},
): bigint {
  const params = unpackTx(transaction);
  if (params.tag === Tag.SignedTx) {
    throw new IllegalArgumentError('Transaction shouldn\'t be a SignedTx, use `getExecutionCostBySignedTx` instead');
  }

  let res = 0n;
  if ('fee' in params && innerTx !== 'freeloader') {
    res += BigInt(params.fee);
  }
  if (params.tag === Tag.NameClaimTx) {
    res += BigInt(params.nameFee);
  }
  if (params.tag === Tag.OracleQueryTx) {
    res += BigInt(params.queryFee);
  }
  if (params.tag === Tag.OracleResponseTx) {
    res -= BigInt(queryFee ?? 0);
  }
  if (params.tag === Tag.ChannelSettleTx) {
    if (isInitiator === true) res -= BigInt(params.initiatorAmountFinal);
    if (isInitiator === false) res -= BigInt(params.responderAmountFinal);
  }
  if (
    ((params.tag === Tag.SpendTx && params.senderId !== params.recipientId)
    || params.tag === Tag.ContractCreateTx || params.tag === Tag.ContractCallTx
    || params.tag === Tag.ChannelDepositTx) && innerTx !== 'fee-payer'
  ) {
    res += BigInt(params.amount);
  }
  if (params.tag === Tag.ContractCreateTx) res += BigInt(params.deposit);
  if (
    (params.tag === Tag.ContractCreateTx || params.tag === Tag.ContractCallTx
      || params.tag === Tag.GaAttachTx || params.tag === Tag.GaMetaTx)
    && innerTx !== 'freeloader'
  ) {
    res += BigInt(params.gasPrice) * BigInt(gasUsed ?? params.gasLimit);
  }
  if (params.tag === Tag.GaMetaTx || params.tag === Tag.PayingForTx) {
    res += getExecutionCost(
      buildTx(params.tx.encodedTx),
      params.tag === Tag.PayingForTx ? { innerTx: 'fee-payer' } : {},
    );
  }
  return res;
}

/**
 * Calculates the cost of signed transaction execution
 * @param transaction - Transaction to calculate the cost of
 * @param networkId - Network id used to sign the transaction
 * @param options - Options
 */
export function getExecutionCostBySignedTx(
  transaction: Encoded.Transaction,
  networkId: string,
  options?: Omit<Parameters<typeof getExecutionCost>[1], 'innerTx'>,
): bigint {
  const params = unpackTx(transaction, Tag.SignedTx);
  if (params.encodedTx.tag === Tag.GaMetaTx) {
    return getExecutionCost(buildTx(params.encodedTx), options);
  }

  const tx = buildTx(params.encodedTx);
  const address = getTransactionSignerAddress(tx);
  const [isInnerTx, isNotInnerTx] = [true, false]
    .map((f) => verify(getBufferToSign(tx, networkId, f), params.signatures[0], address));
  if (!isInnerTx && !isNotInnerTx) throw new TransactionError('Can\'t verify signature');
  return getExecutionCost(
    buildTx(params.encodedTx),
    { ...isInnerTx && { innerTx: 'freeloader' }, ...options },
  );
}

/**
 * Calculates the cost of signed and not signed transaction execution using node
 * @param transaction - Transaction to calculate the cost of
 * @param node - Node to use
 * @param isMined - Is transaction already mined or not
 * @param options - Options
 */
export async function getExecutionCostUsingNode(
  transaction: Encoded.Transaction,
  node: Node,
  { isMined, ...options }: { isMined?: boolean } & Parameters<typeof getExecutionCost>[1] = {},
): Promise<bigint> {
  let params = unpackTx(transaction);
  const isSignedTx = params.tag === Tag.SignedTx;
  const txHash = isSignedTx && isMined === true && buildTxHash(transaction);
  if (params.tag === Tag.SignedTx) params = params.encodedTx;

  // TODO: set gasUsed for PayingForTx after solving https://github.com/aeternity/aeternity/issues/4087
  if (
    options.gasUsed == null && txHash !== false
    && [Tag.ContractCreateTx, Tag.ContractCallTx, Tag.GaAttachTx, Tag.GaMetaTx].includes(params.tag)
  ) {
    const { callInfo, gaInfo } = await node.getTransactionInfoByHash(txHash);
    const combinedInfo = callInfo ?? gaInfo;
    if (combinedInfo == null) {
      throw new InternalError(`callInfo and gaInfo is not available for transaction ${txHash}`);
    }
    options.gasUsed = combinedInfo.gasUsed;
  }

  if (options.queryFee == null && Tag.OracleResponseTx === params.tag) {
    options.queryFee = (await node.getOracleByPubkey(params.oracleId)).queryFee.toString();
  }

  if (options.isInitiator == null && Tag.ChannelSettleTx === params.tag && isMined !== true) {
    const { initiatorId } = await node.getChannelByPubkey(params.channelId);
    options.isInitiator = params.fromId === initiatorId;
  }

  return isSignedTx
    ? getExecutionCostBySignedTx(transaction, await node.getNetworkId(), options)
    : getExecutionCost(transaction, options);
}
