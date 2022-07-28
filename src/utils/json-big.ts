import JsonBig from 'json-bigint';
import BigNumber from 'bignumber.js';
import { mapObject } from './other';

const jsonBig = JsonBig({ storeAsString: true });

const convertValuesToBigNumbers = (value: any): any => {
  if (typeof value === 'object' && value !== null && value.constructor === Object) {
    return mapObject(value, ([k, v]) => [k, convertValuesToBigNumbers(v)]);
  }
  if (Array.isArray(value)) {
    return value.map((item) => convertValuesToBigNumbers(item));
  }
  if (typeof value === 'string' && new BigNumber(value).toString(10) === value) {
    const bn = new BigNumber(value);
    bn.toJSON = () => bn.toString(10);
    return bn;
  }
  return value;
};

export default {
  stringify: (...args: Parameters<typeof JsonBig['stringify']>): string => (
    jsonBig.stringify(convertValuesToBigNumbers(args[0]), ...args.slice(1))
  ),
  parse: jsonBig.parse,
};
