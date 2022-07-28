import BigNumber from 'bignumber.js';
import { getMinimumNameFee } from '../helpers';
import { InsufficientNameFeeError } from '../../../utils/errors';
import { Int } from './u-int';
import coinAmount from './coin-amount';
import { AensName } from '../constants';

export default {
  ...coinAmount,

  serializeAettos(
    _value: string | undefined,
    txFields: { name: AensName },
  ): string {
    const minNameFee = getMinimumNameFee(txFields.name);
    const value = new BigNumber(_value ?? minNameFee);
    if (minNameFee.gt(value)) throw new InsufficientNameFeeError(value, minNameFee);
    return value.toFixed();
  },

  /**
   * @param value - AENS name fee Buffer
   * @param txFields - Transaction fields
   * @param txFields.name - AENS Name in transaction
   */
  serialize(
    value: Int | undefined,
    txFields: { name: AensName } & Parameters<typeof coinAmount['serialize']>[1],
  ): Buffer {
    return coinAmount.serializeOptional.call(this, value, txFields);
  },
};
