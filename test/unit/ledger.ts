import { createInterface } from 'node:readline/promises';
import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import '..';
import {
  createTransportRecorder,
  openTransportReplayer,
  RecordStore,
} from '@ledgerhq/hw-transport-mocker';
import type Transport from '@ledgerhq/hw-transport';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-singleton';
import {
  AccountLedger,
  AccountLedgerFactory as AccountLedgerFactoryOriginal,
  buildTx,
  Node,
  Tag,
  unpackTx,
  verify,
  verifyMessage,
  decode,
  Encoded,
  hash,
} from '../../src';
import { indent } from '../utils';

const compareWithRealDevice = false; // switch to true for manual testing
// ledger should be initialized with mnemonic:
// eye quarter chapter suit cruel scrub verify stuff volume control learn dust

async function initTransport(
  expectedRecordStore: string,
  ignoreRealDevice = false,
): Promise<Transport> {
  if (!compareWithRealDevice || ignoreRealDevice) {
    return openTransportReplayer(RecordStore.fromString(expectedRecordStore));
  }

  // TODO: remove after solving https://github.com/LedgerHQ/ledger-live/issues/9462
  const Transport =
    'default' in TransportNodeHid
      ? (TransportNodeHid.default as typeof TransportNodeHid)
      : TransportNodeHid;
  const t = await Transport.create();
  const recordStore = new RecordStore();
  const TransportRecorder = createTransportRecorder(t, recordStore);
  after(() => {
    expect(recordStore.toString().trim()).to.equal(expectedRecordStore);
  });
  return new TransportRecorder(t);
}

function genLedgerTests(this: Mocha.Suite, isNewApp = false): void {
  this.timeout(compareWithRealDevice ? 60000 : 300);

  before(async () => {
    if (!compareWithRealDevice) return;
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    await rl.question(`Open aeternity@${isNewApp ? '1.0.0' : '0.4.4'} on Ledger and press enter`);
    rl.close();
  });

  class AccountLedgerFactory extends AccountLedgerFactoryOriginal {
    constructor(transport: Transport) {
      super(transport);
      this._enableExperimentalLedgerAppSupport = isNewApp;
    }
  }

  describe('factory', () => {
    it('gets app version', async () => {
      const transport = await initTransport(indent`
        => e006000000
        <= ${isNewApp ? '0100009000' : '000004049000'}`);
      const factory = new AccountLedgerFactory(transport);
      expect((await factory.getAppConfiguration()).version).to.equal(isNewApp ? '1.0.0' : '0.4.4');
    });

    it('ensures that app version is compatible', async () => {
      const transport = await initTransport(
        indent`
          => e006000000
          <= 000104049000`,
        true,
      );
      const factory = new AccountLedgerFactory(transport);
      factory._enableExperimentalLedgerAppSupport = false;
      await expect(factory.getAddress(42)).to.be.rejectedWith(
        'Unsupported Aeternity app on Ledger version 1.4.4. Supported: >= 0.4.4 < 0.5.0',
      );
    });

    it('gets address', async () => {
      const transport = await initTransport(indent`
        => e006000000
        <= ${isNewApp ? '0100009000' : '000004049000'}
        => e0020000040000002a
        <= 35616b5f3248746565756a614a7a75744b65465a69416d59547a636167536f5245725358704246563137397859677154347465616b769000`);
      const factory = new AccountLedgerFactory(transport);
      expect(await factory.getAddress(42)).to.equal(
        'ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv',
      );
    });

    it('gets address with verification', async () => {
      const transport = await initTransport(indent`
        => e006000000
        <= ${isNewApp ? '0100009000' : '000004049000'}
        => e0020100040000002a
        <= 35616b5f3248746565756a614a7a75744b65465a69416d59547a636167536f5245725358704246563137397859677154347465616b769000`);
      const factory = new AccountLedgerFactory(transport);
      expect(await factory.getAddress(42, true)).to.equal(
        'ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv',
      );
    });

    it('gets address with verification rejected', async () => {
      const transport = await initTransport(indent`
        => e006000000
        <= ${isNewApp ? '0100009000' : '000004049000'}
        => e0020100040000002a
        <= 6985`);
      const factory = new AccountLedgerFactory(transport);
      await expect(factory.getAddress(42, true)).to.be.rejectedWith(
        'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)',
      );
    });

    it('initializes an account', async () => {
      const transport = await initTransport(indent`
        => e006000000
        <= ${isNewApp ? '0100009000' : '000004049000'}
        => e0020000040000002a
        <= 35616b5f3248746565756a614a7a75744b65465a69416d59547a636167536f5245725358704246563137397859677154347465616b769000`);
      const factory = new AccountLedgerFactory(transport);
      const account = await factory.initialize(42);
      expect(account).to.be.an.instanceOf(AccountLedger);
      expect(account.address).to.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
      expect(account.index).to.equal(42);
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
      const transport = await initTransport(indent`
        => e006000000
        <= ${isNewApp ? '0100009000' : '000004049000'}
        => e00200000400000000
        <= 35616b5f327377684c6b674250656541447856544156434a6e5a4c59354e5a744346694d39334a787345614d754335396575754652519000
        => e00200000400000001
        <= 34616b5f447a454c4d4b6e53664a63666e43555a32536258555378526d4659744772576d4d754b6943783638594b4c4832366b77639000
        => e00200000400000002
        <= 35616b5f323174656e74786d5936636356434c793246483577714639655071366a725874575132735973393941543839734d657779329000`);
      const node = new NodeMock();
      node.addresses.push('ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ');
      node.addresses.push('ak_DzELMKnSfJcfnCUZ2SbXUSxRmFYtGrWmMuKiCx68YKLH26kwc');
      const factory = new AccountLedgerFactory(transport);
      const accounts = await factory.discover(node);
      expect(accounts.length).to.equal(node.addresses.length);
      expect(accounts.map((a) => a.address)).to.eql(node.addresses);
    });

    it('discovers accounts on unused ledger', async () => {
      const transport = await initTransport(indent`
        => e006000000
        <= ${isNewApp ? '0100009000' : '000004049000'}
        => e00200000400000000
        <= 35616b5f327377684c6b674250656541447856544156434a6e5a4c59354e5a744346694d39334a787345614d754335396575754652519000`);
      const node = new NodeMock();
      const factory = new AccountLedgerFactory(transport);
      const accounts = await factory.discover(node);
      expect(accounts.length).to.equal(0);
    });
  });

  describe('account', () => {
    const address = 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ';
    it('fails on calling raw signing', async () => {
      const transport = await initTransport('');
      const account = new AccountLedger(transport, 0, address);
      await expect(account.unsafeSign()).to.be.rejectedWith('RAW signing using Ledger HW');
    });

    const transaction = buildTx({
      tag: Tag.SpendTx,
      senderId: address,
      recipientId: address,
      amount: 1.23e18,
      nonce: 10,
    });

    it('signs transaction', async () => {
      const transport = await initTransport(indent`
        => e00400006a000000000000005b0661655f756174f8590c01a101f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037a101f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037881111d67bb1bb0000860f4c36200800000a80
        <= f868f1c6ce9b9f2b3aecbec04c6a7b5c8ae30f5c0e87dbcf17fb99663cc22e41aa6edb5d1ee35678164c83d5bdc8cd8cef308b3ecf96f53f3cbd61732041ec0d9000`);
      const account = new AccountLedger(transport, 0, address);
      const networkId = 'ae_uat';
      const signedTransaction = await account.signTransaction(transaction, { networkId });
      expect(signedTransaction).to.satisfy((t: string) => t.startsWith('tx_'));
      const {
        signatures: [signature],
      } = unpackTx(signedTransaction, Tag.SignedTx);
      const hashedTx = Buffer.concat([Buffer.from(networkId), hash(decode(transaction))]);
      expect(verify(hashedTx, signature, address)).to.equal(true);
    });

    it('signs transaction rejected', async () => {
      const transport = await initTransport(indent`
        => e00400006a000000000000005b0661655f756174f8590c01a101f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037a101f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037881111d67bb1bb0000860f4c36200800000a80
        <= 6985`);
      const account = new AccountLedger(transport, 0, address);
      await expect(
        account.signTransaction(transaction, { networkId: 'ae_uat' }),
      ).to.be.rejectedWith(
        'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)',
      );
    });

    const message = 'test-message,'.repeat(3);

    it('signs message', async () => {
      const transport = await initTransport(indent`
        => e00800002f0000000000000027746573742d6d6573736167652c746573742d6d6573736167652c746573742d6d6573736167652c
        <= ${isNewApp ? '78397e186058f278835b8e3e866960e4418dc1e9f00b3a2423f57c16021c88720119ebb3373a136112caa1c9ff63870092064659eb2c641dd67767f15c80350c9000' : '63a9410fa235e4b1f0204cc4d36322e666662da5873b399b076961eced2907f502cd3f91b95bbcfd8e235e194888d469bb15ab4382705aa887c2e0c4e6cb1a0b9000'}`);
      const account = new AccountLedger(transport, 0, address);
      const signature = await account.signMessage(message);
      expect(signature).to.be.an.instanceOf(Uint8Array);
      // FIXME: correct signature after releasing https://github.com/LedgerHQ/app-aeternity/pull/13
      expect(verifyMessage(message, signature, address)).to.equal(isNewApp);
    });

    it('signs message rejected', async () => {
      const transport = await initTransport(indent`
        => e00800002f0000000000000027746573742d6d6573736167652c746573742d6d6573736167652c746573742d6d6573736167652c
        <= 6985`);
      const account = new AccountLedger(transport, 0, address);
      await expect(account.signMessage(message)).to.be.rejectedWith(
        'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)',
      );
    });
  });
}

describe('Ledger HW v0.4.4', function () {
  genLedgerTests.call(this, false);
});

describe('Ledger HW v1.0.0', function () {
  genLedgerTests.call(this, true);
});
