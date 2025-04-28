import { describe, it } from 'mocha';
import { expect } from 'chai';
import { getSdk } from '.';
import { Node } from '../../src';

describe('AeSdk', () => {
  describe('_getPollInterval', () => {
    it('returns value based on options', async () => {
      const aeSdk = await getSdk(0);
      aeSdk._options._expectedMineRate = 1000;
      aeSdk._options._microBlockCycle = 300;
      expect(await aeSdk._getPollInterval('key-block')).to.equal(333);
      expect(await aeSdk._getPollInterval('micro-block')).to.equal(100);
    });

    (
      [
        [
          'devnet',
          0,
          0,
          (node: Node) => (node.getNetworkId = async () => Promise.resolve('ae_dev')),
        ],
        [
          'hyperchains',
          1000,
          1000,
          (node: Node) => {
            node.getNetworkId = async () => Promise.resolve('ae_random');
            node._isHyperchain = async () => Promise.resolve(true);
          },
        ],
        [
          'mainnet',
          60000,
          1000,
          (node: Node) => {
            node.getNetworkId = async () => Promise.resolve('ae_mainnet');
            node._isHyperchain = () => {
              throw new Error("Shouldn't be called");
            };
          },
        ],
        [
          'default case',
          60000,
          1000,
          (node: Node) => (node.getNetworkId = async () => Promise.resolve('ae_random')),
        ],
      ] as const
    ).forEach(([name, kb, mb, cb]) =>
      it(`handles ${name}`, async () => {
        const aeSdk = await getSdk(0);
        cb(aeSdk.api);
        delete aeSdk._options._expectedMineRate;
        delete aeSdk._options._microBlockCycle;
        expect(await aeSdk._getPollInterval('key-block')).to.equal(kb);
        expect(await aeSdk._getPollInterval('micro-block')).to.equal(mb);
      }),
    );
  });
});
