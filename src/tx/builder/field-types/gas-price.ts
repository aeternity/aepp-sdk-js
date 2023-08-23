import coinAmount from './coin-amount';
import { IllegalArgumentError } from '../../../utils/errors';
import { MIN_GAS_PRICE } from '../constants';

export default {
  ...coinAmount,

  serializeAettos(value: string | undefined = MIN_GAS_PRICE.toString()): string {
    if (+value < MIN_GAS_PRICE) {
      throw new IllegalArgumentError(`Gas price ${value.toString()} must be bigger than ${MIN_GAS_PRICE}`);
    }
    return value;
  },
};
