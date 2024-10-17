import { BigNumber } from 'bignumber.js';
import { getMinimumNameFee } from '../helpers.js';
import { InsufficientNameFeeError } from '../../../utils/errors.js';
import coinAmount from './coin-amount.js';
import { AensName, Int } from '../constants.js';

export default {
  ...coinAmount,

  serializeAettos(_value: string | undefined, txFields: { name: AensName }): string {
    const minNameFee = getMinimumNameFee(txFields.name);
    const value = new BigNumber(_value ?? minNameFee);
    if (minNameFee.gt(value)) throw new InsufficientNameFeeError(value, minNameFee);
    return value.toFixed();
  },

  /**
   * @param value - AENS name fee
   * @param txFields - Transaction fields
   * @param txFields.name - AENS Name in transaction
   */
  serialize(
    value: Int | undefined,
    txFields: { name: AensName } & Parameters<(typeof coinAmount)['serialize']>[1],
    parameters: Parameters<(typeof coinAmount)['serialize']>[2],
  ): Buffer {
    return coinAmount.serialize.call(this, value, txFields, parameters);
  },
};
