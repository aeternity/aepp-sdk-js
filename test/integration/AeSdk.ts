import { describe, it } from 'mocha';
import { expect } from 'chai';
import { getSdk, networkId } from '.';

describe('AeSdk', () => {
  describe('_getPollInterval', () => {
    it('returns value based on options', async () => {
      const aeSdk = await getSdk(0);
      aeSdk._options._expectedMineRate = 1000;
      aeSdk._options._microBlockCycle = 300;
      expect(await aeSdk._getPollInterval('key-block')).to.equal(333);
      expect(await aeSdk._getPollInterval('micro-block')).to.equal(100);
    });

    it('returns correct value', async () => {
      const aeSdk = await getSdk(0);
      delete aeSdk._options._expectedMineRate;
      delete aeSdk._options._microBlockCycle;
      const [kb, mb] = networkId === 'ae_dev' ? [0, 0] : [60000, 1000];
      expect(await aeSdk._getPollInterval('key-block')).to.equal(kb);
      expect(await aeSdk._getPollInterval('micro-block')).to.equal(mb);
    });
  });
});
