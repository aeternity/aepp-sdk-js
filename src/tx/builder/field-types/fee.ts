import BigNumber from 'bignumber.js';
import { IllegalArgumentError } from '../../../utils/errors';
import { MIN_GAS_PRICE, Tag } from '../constants';
import coinAmount from './coin-amount';
import { isKeyOfObject } from '../../../utils/other';

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
 * TX_FEE_BASE('channelForceProgress') => new BigNumber(30 * 15000)
 * ```
 */
const TX_FEE_BASE_GAS = (txType: Tag): BigNumber => {
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
  return new BigNumber(factor * BASE_GAS);
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
 * TX_FEE_OTHER_GAS('oracleResponse',10, { relativeTtl: 10, innerTxSize: 10 })
 *  => new BigNumber(10).times(20).plus(Math.ceil(32000 * 10 / Math.floor(60 * 24 * 365 / 2)))
 * ```
 */
const TX_FEE_OTHER_GAS = (
  txType: Tag,
  txSize: number,
  { relativeTtl, innerTxSize }: { relativeTtl: number; innerTxSize: number },
): BigNumber => {
  switch (txType) {
    case Tag.OracleRegisterTx:
    case Tag.OracleExtendTx:
    case Tag.OracleQueryTx:
    case Tag.OracleResponseTx:
      return new BigNumber(txSize)
        .times(GAS_PER_BYTE)
        .plus(
          Math.ceil((32000 * relativeTtl) / Math.floor((60 * 24 * 365) / KEY_BLOCK_INTERVAL)),
        );
    case Tag.GaMetaTx:
    case Tag.PayingForTx:
      return new BigNumber(txSize).minus(innerTxSize).times(GAS_PER_BYTE);
    default:
      return new BigNumber(txSize).times(GAS_PER_BYTE);
  }
};

function getOracleRelativeTtl(params: any, txType: Tag): number {
  const ttlKeys = {
    [Tag.OracleRegisterTx]: 'oracleTtlValue',
    [Tag.OracleExtendTx]: 'oracleTtlValue',
    [Tag.OracleQueryTx]: 'queryTtlValue',
    [Tag.OracleResponseTx]: 'responseTtlValue',
  } as const;

  if (!isKeyOfObject(txType, ttlKeys)) return 1;
  return params[ttlKeys[txType]];
}

/**
 * Calculate fee based on tx type and params
 */
export function buildFee(txType: Tag, buildTx: any): BigNumber {
  const { rlpEncoded: { length }, txObject } = buildTx;

  return TX_FEE_BASE_GAS(txType)
    .plus(TX_FEE_OTHER_GAS(txType, length, {
      relativeTtl: getOracleRelativeTtl(txObject, txType),
      innerTxSize: [Tag.GaMetaTx, Tag.PayingForTx].includes(txType)
        ? txObject.tx.tx.encodedTx.rlpEncoded.length
        : 0,
    }))
    .times(MIN_GAS_PRICE);
}

/**
 * Calculate min fee
 * @category transaction builder
 * @param txType - Transaction type
 * @param rebuildTx - Callback to get built transaction with specific fee
 */
export function calculateMinFee(
  txType: Tag,
  rebuildTx: (value: BigNumber) => any,
): BigNumber {
  let fee = new BigNumber(0);
  let previousFee;
  do {
    previousFee = fee;
    fee = buildFee(txType, rebuildTx(fee));
  } while (!fee.eq(previousFee));
  return fee;
}

export default {
  ...coinAmount,

  serializeAettos(
    _value: string | undefined,
    { txType, rebuildTx, _computingMinFee }:
    { txType: Tag; rebuildTx: (params: any) => any; _computingMinFee?: string },
  ): string {
    if (_computingMinFee != null) return _computingMinFee;
    const minFee = calculateMinFee(txType, (fee) => rebuildTx({ _computingMinFee: fee }));
    const value = new BigNumber(_value ?? minFee);
    if (minFee.gt(value)) {
      throw new IllegalArgumentError(`Fee ${value.toString()} must be bigger then ${minFee}`);
    }
    return value.toFixed();
  },

  serialize: coinAmount.serializeOptional,
};
