import { describe, it } from 'mocha';
import { expect } from 'chai';
import '../index';
import { AeSdk, MissingParamError } from '../../src';
import { getNetworkId } from '../../src/Node';

describe('AeSdk', () => {
  it('executes methods without node, compiler, accounts', () => {
    const aeSdk = new AeSdk();
    expect(aeSdk._getPollInterval('block')).to.be.a('number');
  });

  describe('getNetworkId', () => {
    it('getNetworkId throws error', async () => {
      await expect(getNetworkId.call({}))
        .to.be.rejectedWith(MissingParamError, 'networkId is not provided');
    });
  });
});
