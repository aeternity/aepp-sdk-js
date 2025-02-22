import { describe, it } from 'mocha';
import { expect } from 'chai';
import { decode, encode, Encoding, unpackEntry, EntryTag, packEntry } from '../../src';

const account = {
  tag: EntryTag.Account,
  version: 1,
  nonce: 0,
  balance: '99999999999999998997',
} as const;
const accountEncoded = 'ba_zQoBAIkFa8deLWMP/BW+ZMQO';

const poi = {
  tag: EntryTag.TreesPoi,
  accounts: [],
  calls: [],
  channels: [],
  contracts: [],
  ns: [],
  oracles: [],
} as const;
const poiEncoded = 'pi_yDwBwMDAwMDA5gE8AQ==';

describe('Entry', () => {
  describe('packEntry', () => {
    it('packs', () => {
      expect(packEntry(account)).to.equal(accountEncoded);
    });

    it('packs poi', () => {
      expect(packEntry(poi)).to.equal(poiEncoded);
    });
  });

  describe('unpackEntry', () => {
    it('unpacks', () => {
      expect(unpackEntry(accountEncoded)).to.eql({ ...account, version: 1 });
    });

    it('unpacks poi', () => {
      expect(unpackEntry(poiEncoded)).to.eql({ ...poi, version: 1 });
    });

    it('fails if payload have incorrect encoding', () => {
      const fakePoi = encode(decode(accountEncoded), Encoding.Poi);
      expect(() => unpackEntry(fakePoi)).to.throw('Expected TreesPoi tag, got Account instead');
    });
  });
});
