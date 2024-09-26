import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  Encoded, DelegationTag, packDelegation, unpackDelegation, MemoryAccount, DecodeError,
} from '../../src';

const accountAddress = 'ak_i9svRuk9SJfAponRnCYVnVWN9HVLdBEd8ZdGREJMaUiTn4S4D';
const contractAddress = 'ct_i9svRuk9SJfAponRnCYVnVWN9HVLdBEd8ZdGREJMaUiTn4S4D';
const queryId = 'oq_i9svRuk9SJfAponRnCYVnVWN9HVLdBEd8ZdGREJMaUiTn4S4D';

describe('Delegation signatures', () => {
  const delegation = 'ba_+EYDAaEBXXFtZp9YqbY4KdW8Nolf9Hjp0VZcNWnQOKjgCb8Br9mhBV1xbWafWKm2OCnVvDaJX/R46dFWXDVp0Dio4Am/Aa/Z2vgCEQ==';

  it('packs and unpacks delegation', () => {
    const params = { tag: DelegationTag.AensPreclaim, accountAddress, contractAddress } as const;
    expect(packDelegation(params)).to.equal(delegation);
    expect(unpackDelegation(delegation)).to.eql({ ...params, version: 1 });
  });

  it('signs delegation', async () => {
    const account = new MemoryAccount('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf');
    expect(await account.signDelegation(delegation, { networkId: 'ae_test' }))
      .to.be.equal('sg_UHnWENCvSvJPjcwR2rW82btPvDoDqPvDnn8TsXkoQSNoMHEeT1D8YkAwJQQNrALTBdqqFou4X4Q2MoqCXzwnQZTDZvH28');
  });

  it('packs and unpacks aens name delegation', () => {
    const d = 'ba_+GgCAaEBXXFtZp9YqbY4KdW8Nolf9Hjp0VZcNWnQOKjgCb8Br9mhAlCYygTo5mrGvATbkThUR6EXecvfzfsug8dFPZFieKO3oQVdcW1mn1iptjgp1bw2iV/0eOnRVlw1adA4qOAJvwGv2bOkQT8=';
    const params = { tag: DelegationTag.AensName, accountAddress, contractAddress } as const;
    expect(packDelegation({ ...params, nameId: 'test.chain' })).to.equal(d);
    expect(unpackDelegation(d)).to.eql({
      ...params, nameId: 'nm_cVjoMBVH5UAthDx8hEijr5dF21yex6itrxbZZUMaftL941g9G', version: 1,
    });
  });

  it('packs and unpacks oracle response delegation', () => {
    const d = 'ba_+EYFAaEEXXFtZp9YqbY4KdW8Nolf9Hjp0VZcNWnQOKjgCb8Br9mhBV1xbWafWKm2OCnVvDaJX/R46dFWXDVp0Dio4Am/Aa/ZQ3BGAA==';
    const params = { tag: DelegationTag.OracleResponse, queryId, contractAddress } as const;
    expect(packDelegation(params)).to.equal(d);
    expect(unpackDelegation(d)).to.eql({ ...params, version: 1 });
  });

  it('unpacks delegation with correct types', () => {
    const params = unpackDelegation(delegation);
    expect(params.tag);
    expect(params.version);
    if (params.tag === DelegationTag.AensWildcard) {
      expect(params.accountAddress);
      // @ts-expect-error AensWildcard don't have nameId
      expect(params.nameId);
      const addr: Encoded.AccountAddress = params.accountAddress;
      expect(addr);
    }
    if (params.tag === DelegationTag.OracleResponse) {
      expect(params.queryId);
    }
  });

  it('fails if unexpected delegation tag', () => {
    expect(() => unpackDelegation(delegation, DelegationTag.Oracle))
      .to.throw(DecodeError, 'Expected Oracle tag, got AensPreclaim instead');
  });

  it('checks packing parameters', () => {
    // @ts-expect-error AensPreclaim don't have nameId
    expect(() => packDelegation({ tag: DelegationTag.AensPreclaim, nameId: 'test.chain' }))
      .to.throw();
    // @ts-expect-error requires contractAddress
    expect(() => packDelegation({ tag: DelegationTag.AensPreclaim, accountAddress }))
      .to.throw();
  });
});
