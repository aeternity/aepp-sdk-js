import BigNumber from 'bignumber.js';
import { getMinimumNameFee } from '../helpers';
import { InsufficientNameFeeError } from '../../../utils/errors';
import { Int } from './u-int';
import coinAmount from './coin-amount';
import { AensName } from '../constants';

export default {
  ...coinAmount,

  /**
   * @param value - AENS name fee Buffer
   * @param txFields - Transaction fields
   * @param txFields.name - AENS Name in transaction
   */
  serialize(
    value: Int | undefined,
    txFields: { name: AensName },
  ): Buffer {
    const minNameFee = getMinimumNameFee(txFields.name);
    value ??= minNameFee;
    if (minNameFee.gt(value)) {
      throw new InsufficientNameFeeError(new BigNumber(value), minNameFee);
    }
    return coinAmount.serialize(value);
  },
};
