import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  signJwt,
  unpackJwt,
  verifyJwt,
  isJwt,
  ensureJwt,
  AccountMemory,
  ArgumentError,
  InvalidSignatureError,
} from '../../src';

describe('JWT', () => {
  const account = new AccountMemory('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf');
  const payload = { test: 'data' };
  const jwt =
    'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWJfandrIjp7ImNydiI6IkVkMjU1MTkiLCJrdHkiOiJPS1AiLCJ4IjoiaEF5WFM1Y1dSM1pGUzZFWjJFN2NUV0JZcU43SksyN2NWNHF5MHd0TVFnQSJ9LCJ0ZXN0IjoiZGF0YSJ9.u9El4b2O2LRhvTTW3g46vk1hx0xXWPkJEaEeEy-rLzLr2yuQlNc7qIdcr_z06BgHx5jyYv2CpUL3hqLpc0RzBA';
  const jwtWithAddress =
    'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiYWtfMjFBMjdVVlZ0M2hEa0JFNUo3cmhocW5INVlOYjRZMWRxbzRQblN5YnJIODVwbldvN0UifQ._munmgMvg9SE6jJaTYd6tBSV7EtqO_YRV4TkZjQfop6W18hm_fAPWNbwNupS8doaOs2corl4Uc26zUq1Jyl6Bg';
  const jwtShortest =
    'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.e30.4L-jN-e5p23BHfOYX04CzLBSovALIiM4OEghM6xQAgGbl1g-ANXxFa-DZ3igIo21wemZ7gtlyD_fS-2Y9BWFDQ';

  describe('isJwt, ensureJwt', () => {
    it('works if correct jwt', () => {
      expect(isJwt(jwt)).to.equal(true);
      ensureJwt(jwt);
    });

    it('fails if wrong jwt', () => {
      const j = 'test';
      expect(isJwt(j)).to.equal(false);
      expect(() => ensureJwt(j)).to.throw(
        ArgumentError,
        'JWT components count should be 3, got 1 instead',
      );
    });
  });

  describe('signJwt', () => {
    it('signs', async () => {
      expect(await signJwt(payload, account)).to.equal(jwt);
    });

    it('signs with address', async () => {
      expect(await signJwt({ address: account.address, sub_jwk: undefined }, account)).to.equal(
        jwtWithAddress,
      );
    });

    it('signs shortest', async () => {
      expect(await signJwt({ sub_jwk: undefined }, account)).to.equal(jwtShortest);
    });
  });

  describe('unpackJwt', () => {
    it('unpacks', async () => {
      expect(unpackJwt(jwt)).to.eql({
        payload: {
          sub_jwk: {
            crv: 'Ed25519',
            kty: 'OKP',
            x: 'hAyXS5cWR3ZFS6EZ2E7cTWBYqN7JK27cV4qy0wtMQgA',
          },
          test: 'data',
        },
        signer: account.address,
      });
    });

    it('fails if address not the same as in "sub_jwk"', () => {
      const { address } = AccountMemory.generate();
      expect(() => unpackJwt(jwt, address)).to.throw(
        ArgumentError,
        `address should be ${account.address} ("sub_jwk"), got ${address} instead`,
      );
    });

    it('unpacks with address', async () => {
      expect(unpackJwt(jwtWithAddress)).to.eql({
        payload: { address: account.address },
        signer: undefined,
      });
      expect(unpackJwt(jwtWithAddress, account.address)).to.eql({
        payload: { address: account.address },
        signer: account.address,
      });
    });

    it('unpacks shortest', async () => {
      expect(unpackJwt(jwtShortest)).to.eql({ payload: {}, signer: undefined });
      expect(unpackJwt(jwtShortest, account.address)).to.eql({
        payload: {},
        signer: account.address,
      });
    });

    it('fails if wrong signature', () => {
      const { address } = AccountMemory.generate();
      expect(() => unpackJwt(jwtShortest, address)).to.throw(
        InvalidSignatureError,
        `JWT is not signed by ${address}`,
      );
    });
  });

  describe('verifyJwt', () => {
    it('verifies', () => {
      expect(verifyJwt(jwt)).to.equal(true);
      expect(verifyJwt(jwt, account.address)).to.equal(true);
      expect(verifyJwt(jwtShortest, account.address)).to.equal(true);
    });

    it('returns false if address not the same as in "sub_jwk"', () => {
      expect(verifyJwt(jwt, AccountMemory.generate().address)).to.equal(false);
    });

    it('returns false if address not provided', () => {
      expect(verifyJwt(jwtShortest)).to.equal(false);
    });
  });
});
