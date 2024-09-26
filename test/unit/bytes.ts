import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import BigNumber from 'bignumber.js';
import { toBytes, TypeError } from '../../src';
import { snakeToPascal, pascalToSnake } from '../../src/utils/string';

describe('Bytes', () => {
  it('toBytes: converts null to empty array', () => {
    toBytes(null).should.be.eql(Buffer.from([]));
  });

  const testCase = 'test_test-testTest';

  it('converts snake to pascal case', () =>
    snakeToPascal(testCase).should.be.equal('testTest-testTest'));

  it('converts pascal to snake case', () =>
    pascalToSnake(testCase).should.be.equal('test_test-test_test'));

  it('converts BigNumber to Buffer', () =>
    toBytes(new BigNumber('1000')).readInt16BE().should.be.equal(1000));

  it('throws error if BigNumber is not integer', () =>
    expect(() => toBytes(new BigNumber('1.5'))).to.throw(
      TypeError,
      /Unexpected not integer value:/,
    ));
});
