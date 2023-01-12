/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { encode as rlpEncode } from 'rlp';
import BigNumber from 'bignumber.js';
import { randomName } from '../utils';
import {
  genSalt,
  decode, encode,
  getDefaultPointerKey, commitmentHash, getMinimumNameFee, isNameValid, produceNameId,
  toBytes,
  buildTx, unpackTx,
  NAME_BID_RANGES, Tag, AbiVersion, VmVersion,
  SchemaNotFoundError, ArgumentError,
} from '../../src';
import { Encoding, Encoded } from '../../src/utils/encoder';

describe('Tx', () => {
  it('reproducible commitment hashes can be generated', async () => {
    const salt = genSalt();
    const hash = await commitmentHash('foobar.chain', salt);
    hash.should.be.a('string');
    hash.should.be.equal(await commitmentHash('foobar.chain', salt));
  });

  it('test from big number to bytes', async () => {
    // TODO investigate about float numbers serialization
    const data = [
      new BigNumber('7841237845261982793129837487239459234675231423423453451234'),
      new BigNumber('7841237845261982793129837487239459214234234534523'),
      new BigNumber('7841237845261982793129837412341231231'),
      new BigNumber('78412378452619'),
      new BigNumber('7841237845261982793129837487239459214124563456'),
      new BigNumber('7841237845261982793129837487239459214123'),
    ];

    function bnFromBytes(bn: BigNumber): string {
      const bytes = toBytes(bn, true);
      return new BigNumber(bytes.toString('hex'), 16).toString(10);
    }

    data.forEach((n) => {
      n.toString(10).should.be.equal(bnFromBytes(n));
    });
  });

  it('Produce name id for `.chain`', () => {
    produceNameId('asdas.chain').should.be.equal('nm_2DMazuJNrGkQYve9eMttgdteaigeeuBk3fmRYSThJZ2NpX3r8R');
  });

  describe('getMinimumNameFee', () => {
    it('returns correct name fees', () => {
      for (let i = 1; i <= Object.keys(NAME_BID_RANGES).length; i += 1) {
        getMinimumNameFee(randomName(i)).toString()
          .should.be.equal(NAME_BID_RANGES[i].toString());
      }
    });
  });

  describe('isNameValid', () => {
    it('validates domain', () => isNameValid('asdasdasd.unknown').should.be.equal(false));
    it('don\'t throws exception', () => isNameValid('asdasdasd.chain').should.be.equal(true));
  });

  const payload = Buffer.from([1, 2, 42]);
  describe('decode', () => {
    it('decodes base64check', () => expect(decode('ba_AQIq9Y55kw==')).to.be.eql(payload));

    it('decodes base58check', () => expect(decode('nm_3DZUwMat2')).to.be.eql(payload));

    it('throws if invalid checksum', () => expect(() => decode('ak_23aaaaa'))
      .to.throw('Invalid checksum'));

    it('throws if invalid size', () => expect(() => decode('ak_An6Ui6sE1F'))
      .to.throw('Payload should be 32 bytes, got 4 instead'));
  });

  describe('encode', () => {
    it('encodes base64check', () => expect(encode(payload, Encoding.Bytearray))
      .to.be.equal('ba_AQIq9Y55kw=='));

    it('encodes base58check', () => expect(encode(payload, Encoding.Name))
      .to.be.equal('nm_3DZUwMat2'));
  });

  describe('getDefaultPointerKey', () => {
    it('returns default pointer key for contract', () => expect(
      getDefaultPointerKey('ct_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR'),
    ).to.be.equal('contract_pubkey'));

    it('throws error', () => expect(
      () => getDefaultPointerKey('ba_AQIq9Y55kw==' as Encoded.Channel),
    ).to.throw('identifier should be prefixed with one of ak_, ok_, ct_, ch_, got ba_AQIq9Y55kw== instead'));
  });

  describe('unpackTx', () => {
    it('throws error if invalid transaction version', () => {
      const tx = encode(rlpEncode([10, 99]), Encoding.Transaction);
      expect(() => unpackTx(tx))
        .to.throw(SchemaNotFoundError, 'Transaction deserialization not implemented for tag 10 version 99');
    });

    it('fails to unpack tx with more RLP items than in schema', () => {
      expect(() => unpackTx('tx_+GIMAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ChAeEyuPHdt6BOY7f6lkeaVLvFJaUxp/G8DOSSEhkDBn+wiBvBbWdOyAAAhg92HvYQAAABhHRlc3SEdGVzdK2Ldck='))
        .to.throw(ArgumentError, 'Transaction RLP length should be 9, got 10 instead');
    });

    it('unpacks unknown transaction', () => {
      const account = unpackTx('tx_zQoBAIkFa8deLWMQAAMJo1/N');
      if (account.tag === Tag.SpendTx) {
        expect(account.recipientId);
        // @ts-expect-error spend tx don't have balance
        expect(account.balance);
      }
      if (account.tag === Tag.Account) {
        expect(account.balance);
        if (account.version === 1) {
          // @ts-expect-error account v1 entry don't have flags
          expect(account.flags);
        } else if (account.version === 2) {
          expect(account.flags);
        }
        // @ts-expect-error without checking version, account may not have flags
        expect(account.flags);
      }
    });

    it('unpacks state channel poi', () => {
      const poi = 'pi_+QS9PAH5Agj5AgWgLTKha2G59WNpjU2qOeEP9n/k6VUZw6lrwd2jn0zjyZb5AeH4dKAtMqFrYbn1Y2mNTao54Q/2f+TpVRnDqWvB3aOfTOPJlvhRgKBy/g6a1aHG5CUcExd2PvF/VDFQoFXDYRynvBxhsviPWoCAgKDmsQ/HT1KkP6IZIZxPre8pPevMUitDJ/wdFSLdSx2GU4CAgICAgICAgICA+HSgcv4OmtWhxuQlHBMXdj7xf1QxUKBVw2Ecp7wcYbL4j1r4UYCAgICAgICAoIEfDDawnsjhRHiZ3cH3w1bwZCU/ComV5UZ35oNfBZQNgICAgKC1oTen+OePzzEwr98V96QpzGPnNdq33nRolIwWZ31TO4CAgPhSoIEfDDawnsjhRHiZ3cH3w1bwZCU/ComV5UZ35oNfBZQN8KAgy4vNCNXy3SL07CeWTpNXmqxcXKgpwiS5xqMVvJqPbI7NCgEAiQVrx14tYxAAA/hLoLWhN6f454/PMTCv3xX3pCnMY+c12rfedGiUjBZnfVM76aAg+T20wFXy2ZOEIKWCVNexp+1QmgXSfwzarLhs8ov8rofGCgEAggPo+FKg5rEPx09SpD+iGSGcT63vKT3rzFIrQyf8HRUi3UsdhlPwoD1xbWafWKm2OCnVvDaJX/R46dFWXDVp0Dio4Am/Aa/Zjs0KAQCJBWvHXi1jD/wV4+KgkuUqD84mdniErJPs5b5pR5faMyeuAuGSpTK0rUbGowvAwPkChvkCg6B2jPRZng8uvSIogeA13/PJ3kppJyDm8hrp5NaP39/v3/kCX/hEoBHlmqYc8k9c2eNzc9JAADb3fErCVaOf2zDNbvn+WTd14hCgcz/+U+Q3icmxZXQLRTSUTLW827c3lKJfOCBYgXAEomP4O6BYJ4U3UbSFRNdKow3ApDqnzTNUNG7kE2T287Q+JQSb4NmFxCCCLwCDwiA/gICAgICAgICAgICAgICA+NWgbusUs5OcObuVt7pByi05w+imTwelvFFKINZcKb9uzA34soCgEeWaphzyT1zZ43Nz0kAANvd8SsJVo5/bMM1u+f5ZN3WAgICAgICAgICAgICAgLiA+H4oAaEBXXFtZp9YqbY4KdW8Nolf9Hjp0VZcNWnQOKjgCb8Br9mDBQADuE74TEYDoOHfv3ueq4IcJKbTzxq+A6KqCONqtFC+IRgBer5iV6BZwKCN/oB4IJIANwEHBwEBAI4vARGAeCCSGWdldEFyZ4IvAIU3LjAuMQCAAcCCA+j4U6BzP/5T5DeJybFldAtFNJRMtbzbtzeUol84IFiBcASiY/Gg+834Gf8ycAnGZdS3wlaPv5tIpbWL68KqCphOqokQveuAgICAgICAgICAgICAgIAA+Gagdoz0WZ4PLr0iKIHgNd/zyd5KaScg5vIa6eTWj9/f79/4Q6EAHfk9tMBV8tmThCClglTXsaftUJoF0n8M2qy4bPKL/K6gbusUs5OcObuVt7pByi05w+imTwelvFFKINZcKb9uzA34RqD7zfgZ/zJwCcZl1LfCVo+/m0iltYvrwqoKmE6qiRC96+SCAACgWCeFN1G0hUTXSqMNwKQ6p80zVDRu5BNk9vO0PiUEm+DAwLP4mdE=';
      const unpackedPoi = unpackTx(poi, Tag.TreesPoi);

      const address = 'ak_i9svRuk9SJfAponRnCYVnVWN9HVLdBEd8ZdGREJMaUiTn4S4D';
      const account = {
        tag: 10, version: 1, nonce: 0, balance: '99999999999999998997',
      };
      expect(unpackedPoi.accounts[0].get(address)).to.eql(account);

      const addressContract = 'ct_ECdrEy2NJKq3qK3xraPtcDP7vfdi56SQXYAH3bVVSTmpqpYyW';
      const accountContract = {
        tag: 10, version: 1, nonce: 0, balance: '1000',
      };
      expect(unpackedPoi.accounts[0].get(addressContract as Encoded.AccountAddress))
        .to.eql(accountContract);
      expect(unpackedPoi.accounts[0].toObject()).to.eql({
        ak_BvMjyAXbpHkjzVfG53N6FxF1LwTX2EYwFLfNbk8mcXjp8CXBC: {
          tag: 10, version: 1, nonce: 0, balance: '100000000000000000003',
        },
        [addressContract.replace('ct_', 'ak_')]: accountContract,
        [address]: account,
      });

      const contract = {
        tag: 40,
        version: 1,
        owner: 'ak_i9svRuk9SJfAponRnCYVnVWN9HVLdBEd8ZdGREJMaUiTn4S4D',
        ctVersion: { vmVersion: VmVersion.Fate, abiVersion: AbiVersion.Fate },
        code: 'cb_+ExGA6Dh3797nquCHCSm088avgOiqgjjarRQviEYAXq+YlegWcCgjf6AeCCSADcBBwcBAQCOLwERgHggkhlnZXRBcmeCLwCFNy4wLjEALb9eTg==',
        log: 'cb_Xfbg4g==',
        active: true,
        referers: [],
        deposit: '1000',
      };
      expect(unpackedPoi.contracts[0].get(addressContract)).to.eql(contract);
      expect(unpackedPoi.contracts[0].toObject()).to.eql({ [addressContract]: contract });

      expect(buildTx(unpackedPoi, { prefix: Encoding.Poi })).to.equal(poi);
    });
  });

  describe('buildTx', () => {
    it('returns value of a proper type', () => {
      const address = 'ak_i9svRuk9SJfAponRnCYVnVWN9HVLdBEd8ZdGREJMaUiTn4S4D';

      const tx: Encoded.Transaction = buildTx({
        tag: Tag.SpendTx, nonce: 0, ttl: 0, amount: 123, senderId: address, recipientId: address,
      });
      expect(tx).to.satisfy((s: string) => s.startsWith('tx_'));

      const txExplicit: Encoded.Transaction = buildTx({
        tag: Tag.SpendTx, nonce: 0, ttl: 0, amount: 123, senderId: address, recipientId: address,
      }, { prefix: Encoding.Transaction });
      expect(txExplicit).to.satisfy((s: string) => s.startsWith('tx_'));

      const pi: Encoded.Poi = buildTx({
        tag: Tag.SpendTx, nonce: 0, ttl: 0, amount: 123, senderId: address, recipientId: address,
      }, { prefix: Encoding.Poi });
      expect(pi).to.satisfy((s: string) => s.startsWith('pi_'));
    });

    it('build ContractCreateTx with specified fee', () => {
      const txParams = {
        tag: Tag.ContractCreateTx,
        version: 1,
        ownerId: 'ak_xw6vb7yJfajDdfcXzjg6Q5bH23bSUJrud6iBBfMdegZJFbQmc',
        nonce: 3,
        code: 'cb_+GhGA6Csc3MTA1lWna1q0L5k4TgjcQsmHIVhaJ7qU/0CBZqpO8C4O57+RNZEHwA3ADcAGg6CPwEDP/6AeCCSADcBBwcBAQCYLwIRRNZEHxFpbml0EYB4IJIZZ2V0QXJngi8AhTcuMC4xAHO0rKc=',
        ctVersion: { vmVersion: VmVersion.Fate2, abiVersion: AbiVersion.Fate },
        fee: '78500000000000',
        ttl: 0,
        deposit: '0',
        amount: '0',
        gasLimit: 76,
        gasPrice: '1000000000',
        callData: 'cb_KxFE1kQfP4oEp9E=',
      } as const;
      const tx = buildTx(txParams);
      expect(unpackTx(tx, Tag.ContractCreateTx).fee).to.be.equal('78500000000000');
    });

    it('unpack and build ChannelCreateTx into the same value', () => {
      const tx = 'tx_+IgyAqEBNMD0uYWndDrqF2Q8OIUWZ/gEi45vpwfg+cNOEVi9pL+JBWvHXi1jEAAAoQG5mrb34g29bneQLjNaFcH4OwVP0r9m9x6kYxpxiqN7EYkFa8deLWMQAAAAAQCGECcSfcAAwMCgOK3o2rLTFOY30p/4fMgaz3hG5WWTAcWknsu7ceLFmM0CERW42w==';
      expect(buildTx(unpackTx(tx))).to.be.equal(tx);
    });

    it('rejects if invalid transaction version', () => {
      expect(() => buildTx({ tag: Tag.SpendTx, version: 5 } as any))
        .to.throw(SchemaNotFoundError, 'Transaction serialization not implemented for SpendTx version 5');
    });
  });
});
