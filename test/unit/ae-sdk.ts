import { describe, it } from 'mocha';
import { expect } from 'chai';
import '../index';
import { AeSdk } from '../../src';

describe('AeSdk', () => {
  it('executes methods without node, compiler, accounts', async () => {
    const aeSdk = new AeSdk({ _expectedMineRate: 1000 });
    expect(await aeSdk._getPollInterval('key-block')).to.equal(333);
  });
});
