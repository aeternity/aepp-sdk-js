import BigNumber from 'bignumber.js';
import { getMinimumNameFee } from '../helpers';
import { InsufficientNameFeeError } from '../../../utils/errors';
import coinAmount from './coin-amount';
import { AensName, Int } from '../constants';

export default {
  ...coinAmount,

  /**
   * @param value - AENS name fee
   * @param txFields - Transaction fields
   * @param txFields.name - AENS Name in transaction
   */
  serialize(value: Int | undefined, txFields: { name: AensName }): Buffer {
    const minNameFee = getMinimumNameFee(txFields.name);
    const val = new BigNumber(value ?? minNameFee);
    if (minNameFee.gt(val)) throw new InsufficientNameFeeError(val, minNameFee);
    return coinAmount.serialize(val);
  },
};
