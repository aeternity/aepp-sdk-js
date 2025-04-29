import '..';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import { encode as rlpEncode } from 'rlp';
import BigNumber from 'bignumber.js';
import { checkOnlyTypes, ensureEqual, randomName } from '../utils';
import {
  genSalt,
  decode,
  encode,
  Encoding,
  Encoded,
  getDefaultPointerKey,
  commitmentHash,
  getMinimumNameFee,
  isName,
  produceNameId,
  toBytes,
  buildTx,
  unpackTx,
  unpackEntry,
  NAME_BID_RANGES,
  Tag,
  EntryTag,
  AbiVersion,
  VmVersion,
  SchemaNotFoundError,
  ArgumentError,
  AeSdk,
  packEntry,
} from '../../src';

describe('Tx', () => {
  it('reproducible commitment hashes can be generated', async () => {
    const salt = genSalt();
    const hash = await commitmentHash('foobar.chain', salt);
    expect(hash).to.be.a('string');
    expect(hash).to.equal(await commitmentHash('foobar.chain', salt));
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
      expect(n.toString(10)).to.equal(bnFromBytes(n));
    });
  });

  it('Produce name id for `.chain`', () => {
    expect(produceNameId('asdas.chain')).to.equal(
      'nm_2DMazuJNrGkQYve9eMttgdteaigeeuBk3fmRYSThJZ2NpX3r8R',
    );
  });

  describe('getMinimumNameFee', () => {
    it('returns correct name fees', () => {
      for (let i = 1; i <= Object.keys(NAME_BID_RANGES).length; i += 1) {
        expect(getMinimumNameFee(randomName(i)).toString()).to.equal(NAME_BID_RANGES[i].toString());
      }
    });
  });

  describe('isName', () => {
    it('validates domain', () => expect(isName('asdasdasd.unknown')).to.equal(false));
    it("don't throws exception", () => expect(isName('asdasdasd.chain')).to.equal(true));
  });

  const payload = Buffer.from([1, 2, 42]);
  describe('decode', () => {
    it('decodes base64check', () => expect(decode('ba_AQIq9Y55kw==')).to.eql(payload));

    it('decodes base58check', () => expect(decode('nm_3DZUwMat2')).to.eql(payload));

    it('throws if invalid checksum', () =>
      expect(() => decode('ak_23aaaaa')).to.throw('Invalid checksum'));

    it('throws if invalid size', () =>
      expect(() => decode('ak_An6Ui6sE1F')).to.throw('Payload should be 32 bytes, got 4 instead'));
  });

  describe('encode', () => {
    it('encodes base64check', () =>
      expect(encode(payload, Encoding.Bytearray)).to.equal('ba_AQIq9Y55kw=='));

    it('encodes base58check', () =>
      expect(encode(payload, Encoding.Name)).to.equal('nm_3DZUwMat2'));
  });

  describe('getDefaultPointerKey', () => {
    it('returns default pointer key for contract', () =>
      expect(
        getDefaultPointerKey('ct_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR'),
      ).to.equal('contract_pubkey'));

    it('throws error', () =>
      expect(() => getDefaultPointerKey('ba_AQIq9Y55kw==' as Encoded.Channel)).to.throw(
        'identifier should be prefixed with one of ak_, ok_, ct_, ch_, got ba_AQIq9Y55kw== instead',
      ));
  });

  describe('unpackTx', () => {
    it('throws error if invalid transaction version', () => {
      const tx = encode(rlpEncode([10, 99]), Encoding.Bytearray);
      expect(() => unpackEntry(tx)).to.throw(
        SchemaNotFoundError,
        'Transaction schema not implemented for tag Account (10) version 99',
      );
    });

    it('fails to unpack tx with more RLP items than in schema', () => {
      expect(() =>
        unpackTx(
          'tx_+GIMAaEB4TK48d23oE5jt/qWR5pUu8UlpTGn8bwM5JISGQMGf7ChAeEyuPHdt6BOY7f6lkeaVLvFJaUxp/G8DOSSEhkDBn+wiBvBbWdOyAAAhg92HvYQAAABhHRlc3SEdGVzdK2Ldck=',
        ),
      ).to.throw(ArgumentError, 'RLP length should be 9, got 10 instead');
    });

    it('unpacks unknown transaction', () => {
      const account = unpackEntry('ba_zQoBAIkFa8deLWMQAAMJo1/N');
      if (account.tag === EntryTag.Contract) {
        expect(account.owner);
        // @ts-expect-error contract entry don't have balance
        expect(account.balance);
        const str: Encoded.ContractBytearray = account.code;
        expect(str);
      }
      if (account.tag === EntryTag.Account) {
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
      if (account.tag === EntryTag.ContractCall) {
        // @ts-expect-error contract call shouldn't store owner
        expect(account.owner);
      }
    });

    it('unpacks state channel poi', () => {
      const poi =
        'pi_+QS9PAH5Agj5AgWgLTKha2G59WNpjU2qOeEP9n/k6VUZw6lrwd2jn0zjyZb5AeH4dKAtMqFrYbn1Y2mNTao54Q/2f+TpVRnDqWvB3aOfTOPJlvhRgKBy/g6a1aHG5CUcExd2PvF/VDFQoFXDYRynvBxhsviPWoCAgKDmsQ/HT1KkP6IZIZxPre8pPevMUitDJ/wdFSLdSx2GU4CAgICAgICAgICA+HSgcv4OmtWhxuQlHBMXdj7xf1QxUKBVw2Ecp7wcYbL4j1r4UYCAgICAgICAoIEfDDawnsjhRHiZ3cH3w1bwZCU/ComV5UZ35oNfBZQNgICAgKC1oTen+OePzzEwr98V96QpzGPnNdq33nRolIwWZ31TO4CAgPhSoIEfDDawnsjhRHiZ3cH3w1bwZCU/ComV5UZ35oNfBZQN8KAgy4vNCNXy3SL07CeWTpNXmqxcXKgpwiS5xqMVvJqPbI7NCgEAiQVrx14tYxAAA/hLoLWhN6f454/PMTCv3xX3pCnMY+c12rfedGiUjBZnfVM76aAg+T20wFXy2ZOEIKWCVNexp+1QmgXSfwzarLhs8ov8rofGCgEAggPo+FKg5rEPx09SpD+iGSGcT63vKT3rzFIrQyf8HRUi3UsdhlPwoD1xbWafWKm2OCnVvDaJX/R46dFWXDVp0Dio4Am/Aa/Zjs0KAQCJBWvHXi1jD/wV4+KgkuUqD84mdniErJPs5b5pR5faMyeuAuGSpTK0rUbGowvAwPkChvkCg6B2jPRZng8uvSIogeA13/PJ3kppJyDm8hrp5NaP39/v3/kCX/hEoBHlmqYc8k9c2eNzc9JAADb3fErCVaOf2zDNbvn+WTd14hCgcz/+U+Q3icmxZXQLRTSUTLW827c3lKJfOCBYgXAEomP4O6BYJ4U3UbSFRNdKow3ApDqnzTNUNG7kE2T287Q+JQSb4NmFxCCCLwCDwiA/gICAgICAgICAgICAgICA+NWgbusUs5OcObuVt7pByi05w+imTwelvFFKINZcKb9uzA34soCgEeWaphzyT1zZ43Nz0kAANvd8SsJVo5/bMM1u+f5ZN3WAgICAgICAgICAgICAgLiA+H4oAaEBXXFtZp9YqbY4KdW8Nolf9Hjp0VZcNWnQOKjgCb8Br9mDBQADuE74TEYDoOHfv3ueq4IcJKbTzxq+A6KqCONqtFC+IRgBer5iV6BZwKCN/oB4IJIANwEHBwEBAI4vARGAeCCSGWdldEFyZ4IvAIU3LjAuMQCAAcCCA+j4U6BzP/5T5DeJybFldAtFNJRMtbzbtzeUol84IFiBcASiY/Gg+834Gf8ycAnGZdS3wlaPv5tIpbWL68KqCphOqokQveuAgICAgICAgICAgICAgIAA+Gagdoz0WZ4PLr0iKIHgNd/zyd5KaScg5vIa6eTWj9/f79/4Q6EAHfk9tMBV8tmThCClglTXsaftUJoF0n8M2qy4bPKL/K6gbusUs5OcObuVt7pByi05w+imTwelvFFKINZcKb9uzA34RqD7zfgZ/zJwCcZl1LfCVo+/m0iltYvrwqoKmE6qiRC96+SCAACgWCeFN1G0hUTXSqMNwKQ6p80zVDRu5BNk9vO0PiUEm+DAwLP4mdE=';
      const unpackedPoi = unpackEntry(poi, EntryTag.TreesPoi);

      const address = 'ak_i9svRuk9SJfAponRnCYVnVWN9HVLdBEd8ZdGREJMaUiTn4S4D';
      const account = {
        tag: EntryTag.Account,
        version: 1,
        nonce: 0,
        balance: '99999999999999998997',
      };
      expect(unpackedPoi.accounts[0].get(address)).to.eql(account);

      const addressContract = 'ct_ECdrEy2NJKq3qK3xraPtcDP7vfdi56SQXYAH3bVVSTmpqpYyW';
      const accountContract = {
        tag: EntryTag.Account,
        version: 1,
        nonce: 0,
        balance: '1000',
      };
      expect(unpackedPoi.accounts[0].get(addressContract as Encoded.AccountAddress)).to.eql(
        accountContract,
      );
      expect(unpackedPoi.accounts[0].toObject()).to.eql({
        ak_BvMjyAXbpHkjzVfG53N6FxF1LwTX2EYwFLfNbk8mcXjp8CXBC: {
          tag: EntryTag.Account,
          version: 1,
          nonce: 0,
          balance: '100000000000000000003',
        },
        [addressContract.replace('ct_', 'ak_')]: accountContract,
        [address]: account,
      });

      const contract = {
        tag: EntryTag.Contract,
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

      expect(packEntry(unpackedPoi)).to.equal(poi);
    });

    it('unpacks state channel calls record', () => {
      const tx =
        'cs_+QFBggJuAbkBOvkBNz8B+QEyuJf4lUABuEBRt/rxUTPwSp8BBMQWR70Ag6kTiNXTDmO2LWStsbEXhED9reWbZWfYmFIwTrKG6Khrbb7SvfC4T4ll2BtXsX/luE/4TSkCoQFZYYdOS6IFcvCPFPCBUOkebcCW0ZehLaMRA+K9RcniKwICoQVRt/rxUTPwSp8BBMQWR70Ag6kTiNXTDmO2LWStsbEXhAA9PwDAuJf4lUABuEBRt/rxUTPwSp8BBMQWR70Ag6kTiNXTDmO2LWStsbEXhADlKPCJlyMdCDQrNsajcRCzQk6M8LSJvbdnJ7Lc4aFjuE/4TSkCoQFZYYdOS6IFcvCPFPCBUOkebcCW0ZehLaMRA+K9RcniKwMDoQVRt/rxUTPwSp8BBMQWR70Ag6kTiNXTDmO2LWStsbEXhAEOVADAenqUfg==';
      const params = {
        tag: EntryTag.CallsMtree,
        version: 1,
        payload: {
          'ba_Ubf68VEz8EqfAQTEFke9AIOpE4jV0w5jti1krbGxF4RA/a3lm2Vn2JhSME6yhuioa22+0r3wuE+JZdgbV7F/5c9Ms1g=':
            {
              callerId: 'ak_gN7nP72rm7D1kuSYWRtL9Sf4pFRoTPKM8wa9JHyneazW8zHm4',
              callerNonce: 2,
              contractId: 'ct_czPqotjcUujiXu5DaTeJMbv2WJpqwuhsQFn6edrGVRaoHLifk',
              gasPrice: '0',
              gasUsed: 61,
              height: 2,
              log: [],
              returnType: 0,
              returnValue: 'cb_P4fvHVw=',
              tag: EntryTag.ContractCall,
              version: 2,
            },
          'ba_Ubf68VEz8EqfAQTEFke9AIOpE4jV0w5jti1krbGxF4QA5SjwiZcjHQg0KzbGo3EQs0JOjPC0ib23Zyey3OGhY+BjbKc=':
            {
              callerId: 'ak_gN7nP72rm7D1kuSYWRtL9Sf4pFRoTPKM8wa9JHyneazW8zHm4',
              callerNonce: 3,
              contractId: 'ct_czPqotjcUujiXu5DaTeJMbv2WJpqwuhsQFn6edrGVRaoHLifk',
              gasPrice: '1',
              gasUsed: 14,
              height: 3,
              log: [],
              returnType: 0,
              returnValue: 'cb_VNLOFXc=',
              tag: EntryTag.ContractCall,
              version: 2,
            },
        },
      } as const;
      expect(unpackEntry(tx, EntryTag.CallsMtree)).to.eql(params);
      expect(packEntry(params)).to.equal(tx);
    });

    it('unpacks state channel signed tx', () => {
      const { signatures, encodedTx } = unpackTx(
        'tx_+NILAfiEuEBCv6dwkalvFkuHyYNcRpgZVYlSMmyOO9ukCrBBYYy2zLdgaSs/ug3e01ep2jiy6z9ABOkC83QNpCjdi0eAahUBuEC1RFFr7z4401oJRENrqGRlRsOwTp/GU70W5zeiTP0TZ8rtfzhGH1ZjIsq7u+o6duevI+eyrBtXr3yeqbViEB4KuEj4RjkCoQYzv70uksCUiH6SlOGVAYhx0LkLFmtDUXsRejThITz2MwOgGK/uHihyT8uUtXTAcncw9QFkW0QghCzEWDfwXWbHR14jXFqu',
        Tag.SignedTx,
      );
      expect(signatures).to.have.lengthOf(2);
      ensureEqual<Tag.ChannelOffChainTx>(encodedTx.tag, Tag.ChannelOffChainTx);
      expect(encodedTx.channelId).to.satisfy((s: string) => s.startsWith('ch_'));
      expect(encodedTx.round).to.equal(3);
      expect(encodedTx.stateHash).to.satisfy((s: string) => s.startsWith('st_'));
    });

    it('unpacks state trees tx', () => {
      const tx =
        'ss_+QKqPgC5ATb5ATOCAm0BuQEs+QEpPwH5ASSo50ABo/v6skWp8mq1jwV/+iKDkHayfTtp7ytW6d/nZ2QVQ4zhEAABP6rpQAGj+/qyRanyarWPBX/6IoOQdrJ9O2nvK1bp3+dnZBVDjOEQAACCLwCm5UABofv6skWp8mq1jwV/+iKDkHayfTtp7ytW6d/nZ2QVQ4zhEAC4p/ilQAGg+/qyRanyarWPBX/6IoOQdrJ9O2nvK1bp3+dnZBVDjOG4gPh+KAGhAaJtvnDfkCeML/RLVY1N/6eQNHADrvu4hZoCmMAbCi5SgwUAA7hO+ExGA6Dh3797nquCHCSm088avgOiqgjjarRQviEYAXq+YlegWcCgjf6AeCCSADcBBwcBAQCOLwERgHggkhlnZXRBcmeCLwCFNy4wLjEAgAHAggPouKf4pYICbgG4n/idPwH4mbiX+JVAAbhA+/qyRanyarWPBX/6IoOQdrJ9O2nvK1bp3+dnZBVDjOEHycljzso7F0NwAzM/Oj84MV1Lo7ia3VslsuGHHCI+wrhP+E0pAqEBom2+cN+QJ4wv9EtVjU3/p5A0cAOu+7iFmgKYwBsKLlICAqEF+/qyRanyarWPBX/6IoOQdrJ9O2nvK1bp3+dnZBVDjOEAPT8AwIrJggJvAYTDPwHAismCAnABhMM/AcCKyYICcQGEwz8BwLij+KGCAnIBuJv4mT8B+JWs60ABoPv6skWp8mq1jwV/+iKDkHayfTtp7ytW6d/nZ2QVQ4zhh8YKAQCCA+iz8kABoKJtvnDfkCeML/RLVY1N/6eQNHADrvu4hZoCmMAbCi5Sjs0KAQCJBWvHXi1jD/wVs/JAAaBuFXSR/8BDssKtH01lCLrV/Jd1ImY9KNci1mQqB0RIJY7NCgEAiQVrx14tYxAAA0X2l9c=';
      const params = {
        accounts: {
          ak_2uyUQn1dyzrMxjzhSQgZ2rV1dk2D5BCYpquzzBn6hxoSAo7y1d: {
            balance: '1000',
            nonce: 0,
            tag: EntryTag.Account,
            version: 1,
          },
          ak_2EY2KjfhXkpLq2u13YuvDBahi8Yxq5ErNocCeCUAvwHmJjS2aF: {
            balance: '99999999999999998997',
            nonce: 0,
            tag: EntryTag.Account,
            version: 1,
          },
          ak_qUwhrGsBqhxh2Ace9KBsrDtJpmFeWhuhLZg61L4cQ4Lknhvud: {
            balance: '100000000000000000003',
            nonce: 0,
            tag: EntryTag.Account,
            version: 1,
          },
        },
        calls: {
          'ba_+/qyRanyarWPBX/6IoOQdrJ9O2nvK1bp3+dnZBVDjOEHycljzso7F0NwAzM/Oj84MV1Lo7ia3VslsuGHHCI+wsMqg1w=':
            {
              callerId: 'ak_2EY2KjfhXkpLq2u13YuvDBahi8Yxq5ErNocCeCUAvwHmJjS2aF',
              callerNonce: 2,
              contractId: 'ct_2uyUQn1dyzrMxjzhSQgZ2rV1dk2D5BCYpquzzBn6hxoSAo7y1d',
              gasPrice: '0',
              gasUsed: 61,
              height: 2,
              log: [],
              returnType: 0,
              returnValue: 'cb_P4fvHVw=',
              tag: EntryTag.ContractCall,
              version: 2,
            },
        },
        channels: {},
        contracts: {
          ct_2uyUQn1dyzrMxjzhSQgZ2rV1dk2D5BCYpquzzBn6hxoSAo7y1d: {
            active: true,
            code: 'cb_+ExGA6Dh3797nquCHCSm088avgOiqgjjarRQviEYAXq+YlegWcCgjf6AeCCSADcBBwcBAQCOLwERgHggkhlnZXRBcmeCLwCFNy4wLjEALb9eTg==',
            ctVersion: {
              abiVersion: 3,
              vmVersion: 5,
            },
            deposit: '1000',
            log: 'cb_Xfbg4g==',
            owner: 'ak_2EY2KjfhXkpLq2u13YuvDBahi8Yxq5ErNocCeCUAvwHmJjS2aF',
            referers: [],
            tag: EntryTag.Contract,
            version: 1,
          },
        },
        ns: {},
        oracles: {},
        tag: EntryTag.StateTrees,
        version: 0,
      } as const;
      expect(unpackEntry(tx, EntryTag.StateTrees)).to.eql(params);
    });
  });

  const address = 'ak_i9svRuk9SJfAponRnCYVnVWN9HVLdBEd8ZdGREJMaUiTn4S4D';

  describe('buildTx', () => {
    it('returns value of a proper type', () => {
      const tx: Encoded.Transaction = buildTx({
        tag: Tag.SpendTx,
        nonce: 0,
        amount: 123,
        senderId: address,
        recipientId: address,
      });
      expect(tx).to.satisfy((s: string) => s.startsWith('tx_'));
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
      expect(unpackTx(tx, Tag.ContractCreateTx).fee).to.equal('78500000000000');
    });

    it('unpack and build ChannelCreateTx into the same value', () => {
      const tx =
        'tx_+IgyAqEBNMD0uYWndDrqF2Q8OIUWZ/gEi45vpwfg+cNOEVi9pL+JBWvHXi1jEAAAoQG5mrb34g29bneQLjNaFcH4OwVP0r9m9x6kYxpxiqN7EYkFa8deLWMQAAAAAQCGECcSfcAAwMCgOK3o2rLTFOY30p/4fMgaz3hG5WWTAcWknsu7ceLFmM0CERW42w==';
      expect(buildTx(unpackTx(tx))).to.equal(tx);
    });

    it('checks argument types', () => {
      const spendTxParams = {
        tag: Tag.SpendTx,
        nonce: 0,
        senderId: address,
        recipientId: address,
      } as const;
      const spendTx =
        'tx_+FEMAaEBXXFtZp9YqbY4KdW8Nolf9Hjp0VZcNWnQOKjgCb8Br9mhAV1xbWafWKm2OCnVvDaJX/R46dFWXDVp0Dio4Am/Aa/ZAIYPJvVhyAAAAIBeys6T';
      expect(buildTx(spendTxParams)).to.equal(spendTx);
      // @ts-expect-error spend tx don't have balance
      expect(buildTx({ ...spendTxParams, balance: 123 })).to.equal(spendTx);
      // @ts-expect-error spend tx should have senderId
      expect(() => buildTx({ ...spendTxParams, senderId: undefined })).to.throw(TypeError);

      const accountParams = { tag: EntryTag.Account, nonce: 0, balance: 123 } as const;
      const account = 'ba_xAoBAHt6KY13';
      const accountV2Params = {
        flags: 12,
        gaContract: 'ct_ECdrEy2NJKq3qK3xraPtcDP7vfdi56SQXYAH3bVVSTmpqpYyW',
        gaAuthFun: 'cb_Xfbg4g==',
      } as const;
      const accountV2 = 'ba_6AoCDAB7oQUd+T20wFXy2ZOEIKWCVNexp+1QmgXSfwzarLhs8ov8roBmV7GN';
      // @ts-expect-error version should be specified if used not the last schema
      expect(() => packEntry(accountParams)).to.throw();
      expect(packEntry({ ...accountParams, version: 1 })).to.equal(account);
      expect(packEntry({ ...accountParams, version: 2, ...accountV2Params })).to.equal(accountV2);
      // @ts-expect-error account v1 entry don't have flags
      expect(packEntry({ ...accountParams, version: 1, flags: 12 })).to.equal(account);
      expect(packEntry({ ...accountParams, ...accountV2Params })).to.equal(accountV2);
    });

    it('rejects if invalid transaction version', () => {
      expect(() => buildTx({ tag: Tag.SpendTx, version: 5 } as any)).to.throw(
        SchemaNotFoundError,
        'Transaction schema not implemented for tag SpendTx (12) version 5',
      );
    });
  });

  describe('buildTxAsync', () => {
    it('should fail if key is missed', () => {
      checkOnlyTypes(async () => {
        const sdk = new AeSdk();
        // @ts-expect-error recipientId field is missed
        await sdk.buildTx({ tag: Tag.SpendTx, senderId: address, amount: 0 });
      });
    });
  });
});
