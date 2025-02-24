import { describe, it } from 'mocha';
import { expect } from 'chai';
import { Node, Encoded, AccountMnemonicFactory, MemoryAccount } from '../../src';

const mnemonic = 'eye quarter chapter suit cruel scrub verify stuff volume control learn dust';

const seed = new Uint8Array([
  26, 43, 123, 108, 82, 100, 153, 240, 181, 30, 143, 186, 96, 84, 133, 187, 20, 179, 152, 54, 114,
  118, 104, 243, 147, 193, 110, 110, 179, 195, 207, 131, 230, 174, 67, 145, 148, 16, 229, 126, 115,
  211, 147, 77, 150, 171, 211, 227, 217, 151, 80, 229, 196, 192, 209, 44, 71, 40, 106, 234, 223, 20,
  163, 59,
]);

const wallet = {
  secretKey: 'ba_I1lro/ANfEKuBUal0Glo++D5abkcFLIIihTDLcC8l3My1PuP',
  chainCode: 'ba_XZL45EKIQiLe9v/pkY37Bn3GiqLXZ5v2hIya6llA0QOlYf6i',
} as const;

describe('Account mnemonic factory', () => {
  it('derives wallet by mnemonic', async () => {
    const factory = new AccountMnemonicFactory(mnemonic);
    expect(await factory.getWallet()).to.eql(wallet);
  });

  it('derives wallet by seed', async () => {
    const factory = new AccountMnemonicFactory(seed);
    expect(await factory.getWallet()).to.eql(wallet);
  });

  it('derives wallet by wallet', async () => {
    const factory = new AccountMnemonicFactory(wallet);
    expect(await factory.getWallet()).to.eql(wallet);
  });

  it('derives wallet in sync', async () => {
    const factory = new AccountMnemonicFactory(mnemonic);
    expect(factory.getWalletSync()).to.eql(wallet);
  });

  it('initializes an account by mnemonic', async () => {
    const factory = new AccountMnemonicFactory(mnemonic);
    const account = await factory.initialize(42);
    expect(account).to.be.an.instanceOf(MemoryAccount);
    expect(account.address).to.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
  });

  it('initializes an account by seed', async () => {
    const factory = new AccountMnemonicFactory(seed);
    const account = await factory.initialize(42);
    expect(account).to.be.an.instanceOf(MemoryAccount);
    expect(account.address).to.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
  });

  it('initializes an account by wallet', async () => {
    const factory = new AccountMnemonicFactory(wallet);
    const account = await factory.initialize(42);
    expect(account).to.be.an.instanceOf(MemoryAccount);
    expect(account.address).to.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
  });

  it('initializes an account in sync', async () => {
    const factory = new AccountMnemonicFactory(mnemonic);
    const account = factory.initializeSync(42);
    expect(account).to.be.an.instanceOf(MemoryAccount);
    expect(account.address).to.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
  });

  class NodeMock extends Node {
    addresses: Encoded.AccountAddress[] = [];

    constructor() {
      super('https://test.stg.aepps.com');
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
    expect(accounts.length).to.equal(node.addresses.length);
    expect(accounts.map((a) => a.address)).to.eql(node.addresses);
  });

  it('discovers accounts on unused mnemonic', async () => {
    const node = new NodeMock();
    const factory = new AccountMnemonicFactory(mnemonic);
    const accounts = await factory.discover(node);
    expect(accounts.length).to.equal(0);
  });
});
