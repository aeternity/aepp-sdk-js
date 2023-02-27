import BigNumber from 'bignumber.js';
import { IllegalArgumentError } from '../../../utils/errors';
import { Int, MIN_GAS_PRICE, Tag } from '../constants';
import coinAmount from './coin-amount';
import { isKeyOfObject } from '../../../utils/other';
import { decode, Encoded } from '../../../utils/encoder';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index';

const BASE_GAS = 15000;
const GAS_PER_BYTE = 20;
const KEY_BLOCK_INTERVAL = 3;

/**
 * Calculate the Base fee gas
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @returns The base fee
 * @example
 * ```js
 * TX_FEE_BASE_GAS(Tag.ChannelForceProgressTx) => 30 * 15000
 * ```
 */
const TX_FEE_BASE_GAS = (txType: Tag): number => {
  const feeFactors = {
    [Tag.ChannelForceProgressTx]: 30,
    [Tag.ChannelOffChainTx]: 0,
    [Tag.ChannelOffChainUpdateCallContract]: 0,
    [Tag.ChannelOffChainUpdateCreateContract]: 0,
    [Tag.ChannelOffChainUpdateDeposit]: 0,
    [Tag.ChannelOffChainUpdateWithdraw]: 0,
    [Tag.ChannelOffChainUpdateTransfer]: 0,
    [Tag.ContractCreateTx]: 5,
    [Tag.ContractCallTx]: 12,
    [Tag.GaAttachTx]: 5,
    [Tag.GaMetaTx]: 5,
    [Tag.PayingForTx]: 1 / 5,
  } as const;
  const factor = feeFactors[txType as keyof typeof feeFactors] ?? 1;
  return factor * BASE_GAS;
};

/**
 * Calculate fee for Other types of transactions
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @param txSize - The transaction size
 * @returns parameters - The transaction parameters
 * @returns parameters.relativeTtl - The relative ttl
 * @returns parameters.innerTxSize - The size of the inner transaction
 * @returns The Other fee
 * @example
 * ```js
 * TX_FEE_OTHER_GAS(Tag.OracleResponseTx, 10, { relativeTtl: 10, innerTxSize: 10 })
 *  => 10 * 20 + Math.ceil(32000 * 10 / Math.floor(60 * 24 * 365 / 2))
 * ```
 */
const TX_FEE_OTHER_GAS = (
  txType: Tag,
  txSize: number,
  { relativeTtl, innerTxSize }: { relativeTtl: number; innerTxSize: number },
): number => {
  switch (txType) {
    case Tag.OracleRegisterTx:
    case Tag.OracleExtendTx:
    case Tag.OracleQueryTx:
    case Tag.OracleResponseTx:
      return txSize * GAS_PER_BYTE
        + Math.ceil((32000 * relativeTtl) / Math.floor((60 * 24 * 365) / KEY_BLOCK_INTERVAL));
    case Tag.GaMetaTx:
    case Tag.PayingForTx:
      return (txSize - innerTxSize) * GAS_PER_BYTE;
    default:
      return txSize * GAS_PER_BYTE;
  }
};

function getOracleRelativeTtl(params: any): number {
  const ttlKeys = {
    [Tag.OracleRegisterTx]: 'oracleTtlValue',
    [Tag.OracleExtendTx]: 'oracleTtlValue',
    [Tag.OracleQueryTx]: 'queryTtlValue',
    [Tag.OracleResponseTx]: 'responseTtlValue',
  } as const;

  const { tag } = params;
  if (!isKeyOfObject(tag, ttlKeys)) return 1;
  return params[ttlKeys[tag]];
}

/**
 * Calculate fee based on tx type and params
 */
export function buildFee(
  builtTx: Encoded.Transaction,
  unpackTx: typeof unpackTxType,
  buildTx: typeof buildTxType,
): bigint {
  const { length } = decode(builtTx);
  const txObject = unpackTx(builtTx);

  let innerTxSize = 0;
  if (txObject.tag === Tag.GaMetaTx || txObject.tag === Tag.PayingForTx) {
    innerTxSize = decode(buildTx(txObject.tx.encodedTx)).length;
  }

  const gas = TX_FEE_BASE_GAS(txObject.tag) + TX_FEE_OTHER_GAS(txObject.tag, length, {
    relativeTtl: getOracleRelativeTtl(txObject), innerTxSize,
  });
  return BigInt(gas) * MIN_GAS_PRICE;
}

/**
 * Calculate min fee
 * @category transaction builder
 * @param rebuildTx - Callback to get built transaction with specific fee
 */
function calculateMinFee(
  rebuildTx: (value: bigint) => Encoded.Transaction,
  unpackTx: typeof unpackTxType,
  buildTx: typeof buildTxType,
): bigint {
  let fee = 0n;
  let previousFee;
  do {
    previousFee = fee;
    fee = buildFee(rebuildTx(fee), unpackTx, buildTx);
  } while (fee !== previousFee);
  return fee;
}

export default {
  ...coinAmount,

  serialize(
    _value: Int | undefined,
    {
      rebuildTx, unpackTx, buildTx, _computingMinFee, _pickBiggerFee,
    }: {
      rebuildTx: (params: any) => Encoded.Transaction;
      unpackTx: typeof unpackTxType;
      buildTx: typeof buildTxType;
      _computingMinFee?: bigint;
      _pickBiggerFee?: boolean;
    },
  ): Buffer {
    if (_computingMinFee != null) return coinAmount.serialize(_computingMinFee.toString());
    const minFee = new BigNumber(calculateMinFee(
      (fee) => rebuildTx({ _computingMinFee: fee }),
      unpackTx,
      buildTx,
    ).toString());
    const value = new BigNumber(_value ?? minFee);
    if (minFee.gt(value)) {
      if (_pickBiggerFee === true) return coinAmount.serialize(minFee);
      throw new IllegalArgumentError(`Fee ${value.toString()} must be bigger then ${minFee}`);
    }
    return coinAmount.serialize(value);
  },
};
