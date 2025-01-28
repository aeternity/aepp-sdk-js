import BigNumber from 'bignumber.js';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { prefixedAmount } from '../../src';

const MAGNITUDE = 18;
describe('prefixedAmount', () => {
  it('removes trailing zeros', () => {
    expect(prefixedAmount(new BigNumber('1.0000'))).to.equal('1');
  });

  it('displays fees', () => {
    expect(prefixedAmount(new BigNumber(17120).shiftedBy(-MAGNITUDE))).to.equal('0.01712 pico');
  });
  it('displays balance', () => {
    expect(prefixedAmount(new BigNumber('89.99999999000924699'))).to.equal('90');
  });

  it('generates proper values', () => {
    const t = new BigNumber(`0.${'123456789'.repeat(3)}`).shiftedBy(-MAGNITUDE);
    [
      '0.00000012 pico',
      '0.00000123 pico',
      '0.00001235 pico',
      '0.00012346 pico',
      '0.00123457 pico',
      '0.01234568 pico',
      '0.12345679 pico',
      '1.23456789 pico',
      '12.3456789 pico',
      '123.456789 pico',
      '1234.56789 pico',
      '12345.6789 pico',
      '123456.789 pico',
      '0.00000123',
      '0.00001235',
      '0.00012346',
      '0.00123457',
      '0.01234568',
      '0.12345679',
      '1.23456789',
      '12.3456789',
      '123.456789',
      '1234.56789',
      '12345.6789',
      '123456.789',
      '1234567.89',
      '12345678.9',
      '123456789',
      '1.23456789 giga',
      '12.3456789 giga',
      '123.456789 giga',
      '1234.56789 giga',
      '12345.6789 giga',
      '123456.789 giga',
      '1234567.89 giga',
      '12345678.9 giga',
      '123456789 giga',
      '1.23456789 exa',
      '12.3456789 exa',
    ].forEach((res, idx) => expect(prefixedAmount(t.shiftedBy(idx))).to.equal(res));
  });
});
