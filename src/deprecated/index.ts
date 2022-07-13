import BigNumber from 'bignumber.js';
import { buildTx } from '../tx/builder';
import { TX_TYPE } from '../tx/builder/constants';
import { calculateMinFee as calculateMinFeeInternal } from '../tx/builder/field-types/fee';
import { TxParamsCommon } from '../tx/builder/schema';
import { AE_AMOUNT_FORMATS } from '../utils/amount-formatter';

export * from './methods';

/**
 * @deprecated use NamePointer from apis/node instead
 * @hidden
 */
export interface Pointer {
  key: string;
  id: string;
}

/**
 * @deprecated use genSalt instead
 * @hidden
 */
export function salt(): number {
  return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
}

/**
 * @deprecated use genSalt instead
 * @hidden
 */
export const createSalt = salt;

/**
 * Calculate min fee
 * @category transaction builder
 * @param txType - Transaction type
 * @param options - Options object
 * @param options.params - Tx params
 * @deprecated use buildTx to generate transaction, unpack it and refer to `fee` field
 * @hidden
 * @example
 * ```js
 * calculateMinFee('spendTx', { gasLimit, params })
 * ```
 */
export default function calculateMinFee(
  txType: TX_TYPE,
  { params, vsn, denomination }: CalculateMinFeeOptions,
): BigNumber {
  return calculateMinFeeInternal(
    txType,
    // @ts-expect-error anyway this planned to be removed
    (fee: BigNumber) => buildTx({ ...params, fee }, txType, { vsn, denomination }),
  );
}

interface CalculateMinFeeOptions {
  params: TxParamsCommon;
  vsn?: number;
  denomination?: AE_AMOUNT_FORMATS;
}
