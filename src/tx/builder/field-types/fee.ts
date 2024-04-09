import BigNumber from 'bignumber.js';
import { ArgumentError, IllegalArgumentError } from '../../../utils/errors';
import { Int, MIN_GAS_PRICE, Tag } from '../constants';
import uInt from './u-int';
import coinAmount from './coin-amount';
import { getCachedIncreasedGasPrice } from './gas-price';
import { isKeyOfObject } from '../../../utils/other';
import { decode, Encoded } from '../../../utils/encoder';
import type { unpackTx as unpackTxType, buildTx as buildTxType } from '../index';
import Node from '../../../Node';

const BASE_GAS = 15000;
const GAS_PER_BYTE = 20;
const KEY_BLOCK_INTERVAL = 3;

/**
 * Calculate the base gas
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @returns The base gas
 * @example
 * ```js
 * TX_BASE_GAS(Tag.ChannelForceProgressTx) => 30 * 15000
 * ```
 */
const TX_BASE_GAS = (txType: Tag): number => {
  const feeFactors = {
    [Tag.ChannelForceProgressTx]: 30,
    [Tag.ChannelOffChainTx]: 0,
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
 * Calculate gas for other types of transactions
 * @see {@link https://github.com/aeternity/protocol/blob/master/consensus/README.md#gas}
 * @param txType - The transaction type
 * @param txSize - The transaction size
 * @returns parameters - The transaction parameters
 * @returns parameters.relativeTtl - The relative ttl
 * @returns parameters.innerTxSize - The size of the inner transaction
 * @returns The other gas
 * @example
 * ```js
 * TX_OTHER_GAS(Tag.OracleResponseTx, 10, { relativeTtl: 12, innerTxSize: 0 })
 *  => 10 * 20 + Math.ceil(32000 * 12 / Math.floor(60 * 24 * 365 / 3))
 * ```
 */
const TX_OTHER_GAS = (
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
 * Calculate gas based on tx type and params
 */
export function buildGas(
  builtTx: Encoded.Transaction,
  unpackTx: typeof unpackTxType,
  buildTx: typeof buildTxType,
): number {
  const { length } = decode(builtTx);
  const txObject = unpackTx(builtTx);

  let innerTxSize = 0;
  if (txObject.tag === Tag.GaMetaTx || txObject.tag === Tag.PayingForTx) {
    innerTxSize = decode(buildTx(txObject.tx.encodedTx)).length;
  }

  return TX_BASE_GAS(txObject.tag)
    + TX_OTHER_GAS(txObject.tag, length, {
      relativeTtl: getOracleRelativeTtl(txObject), innerTxSize,
    });
}

/**
 * Calculate min fee
 * @category transaction builder
 * @param rebuildTx - Callback to get built transaction with specific fee
 */
function calculateMinFee(
  rebuildTx: (value: BigNumber) => Encoded.Transaction,
  unpackTx: typeof unpackTxType,
  buildTx: typeof buildTxType,
): BigNumber {
  let fee = new BigNumber(0);
  let previousFee;
  do {
    previousFee = fee;
    fee = new BigNumber(MIN_GAS_PRICE).times(buildGas(rebuildTx(fee), unpackTx, buildTx));
  } while (!fee.eq(previousFee));
  return fee;
}

// TODO: Get rid of this workaround. Transaction builder can't accept/return gas price instead of
// fee because it may get a decimal gas price. So, it should accept the optional `gasPrice` even
// if it is not a contract-related transaction. And use this `gasPrice` to calculate `fee`.
const gasPricePrefix = '_gas-price:';

export interface SerializeAettosParams {
  rebuildTx: (params: any) => Encoded.Transaction;
  unpackTx: typeof unpackTxType;
  buildTx: typeof buildTxType;
  _computingMinFee?: BigNumber;
}

export default {
  ...coinAmount,

  async prepare(
    value: Int | undefined,
    params: {},
    { onNode }: { onNode?: Node },
  ): Promise<Int | undefined> {
    if (value != null) return value;
    if (onNode == null) {
      throw new ArgumentError('onNode', 'provided (or provide `fee` instead)', onNode);
    }
    const gasPrice = await getCachedIncreasedGasPrice(onNode);
    if (gasPrice === 0n) return undefined;
    return gasPricePrefix + gasPrice;
  },

  serializeAettos(
    _value: string | undefined,
    {
      rebuildTx, unpackTx, buildTx, _computingMinFee,
    }: SerializeAettosParams,
    { _canIncreaseFee }: { _canIncreaseFee?: boolean },
  ): string {
    if (_computingMinFee != null) return _computingMinFee.toFixed();
    const minFee = calculateMinFee(
      (fee) => rebuildTx({ _computingMinFee: fee }),
      unpackTx,
      buildTx,
    );
    const value = _value?.startsWith(gasPricePrefix) === true
      ? minFee.dividedBy(MIN_GAS_PRICE).times(_value.replace(gasPricePrefix, ''))
      : new BigNumber(_value ?? minFee);
    if (minFee.gt(value)) {
      if (_canIncreaseFee === true) return minFee.toFixed();
      throw new IllegalArgumentError(`Fee ${value.toString()} must be bigger than ${minFee}`);
    }
    return value.toFixed();
  },

  serialize(
    value: Parameters<typeof coinAmount.serialize>[0],
    params: Parameters<typeof coinAmount.serialize>[1] & SerializeAettosParams,
    options: { _canIncreaseFee?: boolean } & Parameters<typeof coinAmount.serialize>[2],
  ): Buffer {
    if (typeof value === 'string' && value.startsWith(gasPricePrefix)) {
      return uInt.serialize(this.serializeAettos(value, params, options));
    }
    return coinAmount.serialize.call(this, value, params, options);
  },
};
