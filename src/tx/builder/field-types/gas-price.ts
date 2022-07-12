import { Int } from './u-int';
import coinAmount from './coin-amount';
import { IllegalArgumentError } from '../../../utils/errors';
import { MIN_GAS_PRICE } from '../constants';

export default {
  ...coinAmount,

  serialize(value: Int | undefined): Buffer {
    value ??= MIN_GAS_PRICE;
    if (+value < MIN_GAS_PRICE) {
      throw new IllegalArgumentError(`Gas price ${value.toString()} must be bigger then ${MIN_GAS_PRICE}`);
    }
    return coinAmount.serialize(value);
  },
};
