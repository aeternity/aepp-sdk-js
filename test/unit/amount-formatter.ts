import { describe, it } from 'mocha';
import { expect } from 'chai';
import BigNumber from 'bignumber.js';
import '..';
import { AE_AMOUNT_FORMATS, formatAmount, toAe, toAettos } from '../../src';

describe('Amount Formatter', () => {
  it('to aettos', () => {
    (
      [
        [1, AE_AMOUNT_FORMATS.AE, '1000000000000000000'],
        [11, AE_AMOUNT_FORMATS.AE, '11000000000000000000'],
        [111, AE_AMOUNT_FORMATS.AE, '111000000000000000000'],
        [10012312, AE_AMOUNT_FORMATS.AE, '10012312000000000000000000'],
        [1, AE_AMOUNT_FORMATS.AETTOS, '1'],
      ] as const
    ).forEach(([v, denomination, e]) => {
      expect(toAettos(v, { denomination })).to.be.equal(e);
    });
  });

  it('to Ae', () => {
    (
      [
        [1, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1).div(1e18)],
        [10, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(10).div(1e18)],
        [100, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(100).div(1e18)],
        [10012312, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(10012312).div(1e18)],
        [1, AE_AMOUNT_FORMATS.AE, 1],
      ] as const
    ).forEach(([v, denomination, e]) => {
      expect(toAe(v, { denomination })).to.be.equal(e.toString(10));
    });
  });

  it('format', () => {
    (
      [
        [1, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1e18)],
        [10, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.AE, new BigNumber(10).div(1e18)],
        [1e18, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.AE, new BigNumber(1)],
        [
          10012312,
          AE_AMOUNT_FORMATS.AETTOS,
          AE_AMOUNT_FORMATS.AE,
          new BigNumber(10012312).div(1e18),
        ],
        [1, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.AE, 1],
        [1, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AE, new BigNumber(0.000000000001)],
        [1, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1000000)],
        [1e6, AE_AMOUNT_FORMATS.AETTOS, AE_AMOUNT_FORMATS.PICO_AE, new BigNumber(1)],
        [
          0.0001,
          AE_AMOUNT_FORMATS.PICO_AE,
          AE_AMOUNT_FORMATS.AE,
          new BigNumber(0.0000000000000001),
        ],
        [0.000000000001, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.PICO_AE, new BigNumber(1)],
        [0.000001, AE_AMOUNT_FORMATS.PICO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1)],
        [0.000000000001, AE_AMOUNT_FORMATS.MICRO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1)],
        [0.000001, AE_AMOUNT_FORMATS.MICRO_AE, AE_AMOUNT_FORMATS.PICO_AE, new BigNumber(1)],
        [1, AE_AMOUNT_FORMATS.MILI_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1000000000000000)],
        [1, AE_AMOUNT_FORMATS.AE, AE_AMOUNT_FORMATS.MILI_AE, new BigNumber(1000)],
        [1, AE_AMOUNT_FORMATS.NANO_AE, AE_AMOUNT_FORMATS.AE, new BigNumber(0.000000001)],
        [1, AE_AMOUNT_FORMATS.NANO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1000000000)],
        [1, AE_AMOUNT_FORMATS.FEMTO_AE, AE_AMOUNT_FORMATS.AETTOS, new BigNumber(1000)],
        [1, AE_AMOUNT_FORMATS.NANO_AE, AE_AMOUNT_FORMATS.FEMTO_AE, new BigNumber(1000000)],
      ] as const
    ).forEach(([v, denomination, targetDenomination, e]) => {
      expect(formatAmount(v, { denomination, targetDenomination })).to.be.equal(e.toString(10));
    });
  });
});
