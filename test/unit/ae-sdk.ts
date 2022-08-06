import { describe, it } from 'mocha';
import { expect } from 'chai';
import '../index';
import { AeSdk } from '../../src';

describe('AeSdk', () => {
  it('executes methods without node, compiler, accounts', () => {
    const aeSdk = new AeSdk();
    expect(aeSdk._getPollInterval('block')).to.be.a('number');
  });
});
