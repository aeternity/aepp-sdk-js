import coinAmount from './coin-amount';
import { Int } from './u-int';
import { IllegalArgumentError } from '../../../utils/errors';

export default {
  ...coinAmount,

  /**
   * @param value - Deposit value in string format. Should be equal to '0'.
   * @param options - Options
   * @returns Deposit value Buffer.
   */
  serialize(
    value: Int | undefined,
    options: Parameters<typeof coinAmount['serialize']>[1],
  ): Buffer {
    value ??= 0;
    if (+value !== 0) throw new IllegalArgumentError(`Contract deposit is not refundable, so it should be equal 0, got ${value.toString()} instead`);
    return coinAmount.serialize(value, options);
  },
};
