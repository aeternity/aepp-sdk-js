import BigNumber from 'bignumber.js'
import prefixedAmount from '../../es/utils/amount-formatter'
import { describe, it } from 'mocha'
import { assert, expect } from 'chai'

const MAGNITUDE = 18
describe('prefixedAmount', () => {
  it('removes trailing zeros', () => {
    (prefixedAmount(BigNumber('1.0000'))).should.be.equal('1')
  })

  it('displays fees', () => {
    (prefixedAmount(BigNumber(17120).shiftedBy(-MAGNITUDE), 0)).should.be.equal('0.01712 pico')
  })
  it('displays balance', () => {
    (prefixedAmount(BigNumber('89.99999999000924699'))).should.be.equal('90')
  })

  it('generates proper values', () => {
    const t = BigNumber(`0.${'123456789'.repeat(3)}`).shiftedBy(-MAGNITUDE);
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
    ].forEach((res, idx) => (prefixedAmount(t.shiftedBy(idx))).should.be.equal(res))
  })
})
