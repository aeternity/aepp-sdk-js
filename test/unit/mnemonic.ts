import { describe, it } from 'mocha';
import { expect } from 'chai';
import {
  Node, Encoded, AccountMnemonicFactory, MemoryAccount,
} from '../../src';

const mnemonic = 'eye quarter chapter suit cruel scrub verify stuff volume control learn dust';

const wallet = {
  secretKey: 'ba_I1lro/ANfEKuBUal0Glo++D5abkcFLIIihTDLcC8l3My1PuP',
  chainCode: 'ba_XZL45EKIQiLe9v/pkY37Bn3GiqLXZ5v2hIya6llA0QOlYf6i',
} as const;

describe('Account mnemonic factory', () => {
  it('derives wallet', async () => {
    const factory = new AccountMnemonicFactory(mnemonic);
    expect(await factory.getWallet()).to.be.eql(wallet);
  });

  it('initializes an account', async () => {
    const factory = new AccountMnemonicFactory(mnemonic);
    const account = await factory.initialize(42);
    expect(account).to.be.instanceOf(MemoryAccount);
    expect(account.address).to.be.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
  });

  it('initializes an account by wallet', async () => {
    const factory = new AccountMnemonicFactory(wallet);
    const account = await factory.initialize(42);
    expect(account.address).to.be.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
  });

  class NodeMock extends Node {
    addresses: Encoded.AccountAddress[] = [];

    constructor() {
      super('https://test.stg.aepps.com', { ignoreVersion: true });
    }

    // eslint-disable-next-line class-methods-use-this
    override getAccountByPubkey = async (
      address: Encoded.AccountAddress,
    ): ReturnType<Node['getAccountByPubkey']> => {
      if (this.addresses.includes(address)) {
        return {
          id: address,
          balance: 10n,
          nonce: 1,
        };
      }
      throw new Error('not found');
    };
  }

  it('discovers accounts', async () => {
    const node = new NodeMock();
    node.addresses.push('ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ');
    node.addresses.push('ak_DzELMKnSfJcfnCUZ2SbXUSxRmFYtGrWmMuKiCx68YKLH26kwc');
    const factory = new AccountMnemonicFactory(mnemonic);
    const accounts = await factory.discover(node);
    expect(accounts.length).to.be.equal(node.addresses.length);
    expect(accounts.map((a) => a.address)).to.be.eql(node.addresses);
  });

  it('discovers accounts on unused mnemonic', async () => {
    const node = new NodeMock();
    const factory = new AccountMnemonicFactory(mnemonic);
    const accounts = await factory.discover(node);
    expect(accounts.length).to.be.equal(0);
  });
});
