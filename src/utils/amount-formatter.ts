import BigNumber from 'bignumber.js';
import { isBigNumber } from './bignumber.js';
import { ArgumentError } from './errors.js';

export enum AE_AMOUNT_FORMATS {
  AE = 'ae',
  MILI_AE = 'miliAE',
  MICRO_AE = 'microAE',
  NANO_AE = 'nanoAE',
  PICO_AE = 'picoAE',
  FEMTO_AE = 'femtoAE',
  AETTOS = 'aettos',
}

/**
 * DENOMINATION_MAGNITUDE
 */
const DENOMINATION_MAGNITUDE = {
  [AE_AMOUNT_FORMATS.AE]: 0,
  [AE_AMOUNT_FORMATS.MILI_AE]: -3,
  [AE_AMOUNT_FORMATS.MICRO_AE]: -6,
  [AE_AMOUNT_FORMATS.NANO_AE]: -9,
  [AE_AMOUNT_FORMATS.PICO_AE]: -12,
  [AE_AMOUNT_FORMATS.FEMTO_AE]: -15,
  [AE_AMOUNT_FORMATS.AETTOS]: -18,
} as const;

/**
 * Convert amount from one to other denomination
 * @param value - amount to convert
 * @param options - options
 * @param options.denomination - denomination of amount, can be ['ae', 'aettos']
 * @param options.targetDenomination - target denomination,
 * can be ['ae', 'aettos']
 */
export const formatAmount = (
  value: string | number | bigint | BigNumber,
  {
    denomination = AE_AMOUNT_FORMATS.AETTOS,
    targetDenomination = AE_AMOUNT_FORMATS.AETTOS,
  }: { denomination?: AE_AMOUNT_FORMATS; targetDenomination?: AE_AMOUNT_FORMATS },
): string => {
  if (!isBigNumber(value)) throw new ArgumentError('value', 'a number', value);

  return new BigNumber(typeof value === 'bigint' ? value.toString() : value)
    .shiftedBy(DENOMINATION_MAGNITUDE[denomination] - DENOMINATION_MAGNITUDE[targetDenomination])
    .toFixed();
};

/**
 * Convert amount to AE
 * @param value - amount to convert
 * @param options - options
 * @param options.denomination - denomination of amount, can be ['ae', 'aettos']
 */
export const toAe = (
  value: string | number | BigNumber,
  { denomination = AE_AMOUNT_FORMATS.AETTOS }: { denomination?: AE_AMOUNT_FORMATS } = {},
): string => formatAmount(value, { denomination, targetDenomination: AE_AMOUNT_FORMATS.AE });

/**
 * Convert amount to aettos
 * @param value - amount to convert
 * @param options - options
 * @param options.denomination - denomination of amount, can be ['ae', 'aettos']
 */
export const toAettos = (
  value: string | number | BigNumber,
  { denomination = AE_AMOUNT_FORMATS.AE }: { denomination?: AE_AMOUNT_FORMATS } = {},
): string => formatAmount(value, { denomination });

interface Prefix {
  name: string;
  magnitude: number;
}

const prefixes: Prefix[] = [
  { name: 'exa', magnitude: 18 },
  { name: 'giga', magnitude: 9 },
  { name: '', magnitude: 0 },
  { name: 'pico', magnitude: -12 },
];

const getNearestPrefix = (exponent: number): Prefix =>
  prefixes.reduce((p, n) =>
    Math.abs(n.magnitude - exponent) < Math.abs(p.magnitude - exponent) ? n : p,
  );

const getLowerBoundPrefix = (exponent: number): Prefix =>
  prefixes.find((p) => p.magnitude <= exponent) ?? prefixes[prefixes.length - 1];

export const prefixedAmount = (rawValue: string | number | BigNumber): string => {
  const value: BigNumber = new BigNumber(rawValue);

  const exp = value.e ?? 0;
  const { name, magnitude } = (exp < 0 ? getNearestPrefix : getLowerBoundPrefix)(exp);
  const v = value
    .shiftedBy(-magnitude)
    .precision(9 + Math.min(exp - magnitude, 0))
    .toFixed();
  return `${v}${name !== '' ? ' ' : ''}${name}`;
};
