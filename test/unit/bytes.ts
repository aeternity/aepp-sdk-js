import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import BigNumber from 'bignumber.js';
import { toBytes, TypeError } from '../../src';
import { snakeToPascal, pascalToSnake } from '../../src/utils/string';

describe('Bytes', () => {
  it('toBytes: converts null to empty array', () => {
    expect(toBytes(null)).to.eql(Buffer.from([]));
  });

  const testCase = 'test_test-testTest';

  it('converts snake to pascal case', () =>
    expect(snakeToPascal(testCase)).to.equal('testTest-testTest'));

  it('converts pascal to snake case', () =>
    expect(pascalToSnake(testCase)).to.equal('test_test-test_test'));

  it('converts BigNumber to Buffer', () =>
    expect(toBytes(new BigNumber('1000')).readInt16BE()).to.equal(1000));

  it('throws error if BigNumber is not integer', () =>
    expect(() => toBytes(new BigNumber('1.5'))).to.throw(
      TypeError,
      /Unexpected not integer value:/,
    ));
});
