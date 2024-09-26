import { describe, it } from 'mocha';
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
  AccountLedgerFactory,
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
let transport: Transport;
let recordStore: RecordStore;
let expectedRecordStore = '';
let ignoreRealDevice = false;

async function initTransport(s: string, i = false): Promise<void> {
  expectedRecordStore = s;
  ignoreRealDevice = i;
  if (compareWithRealDevice && !ignoreRealDevice) {
    transport = await TransportNodeHid.create();
    recordStore = new RecordStore();
    const TransportRecorder = createTransportRecorder(transport, recordStore);
    transport = new TransportRecorder(transport);
  } else {
    transport = await openTransportReplayer(RecordStore.fromString(expectedRecordStore));
  }
}

afterEach(async () => {
  if (compareWithRealDevice && !ignoreRealDevice) {
    expect(recordStore.toString()).to.be.equal(expectedRecordStore);
  }
  expectedRecordStore = '';
  ignoreRealDevice = false;
});

describe('Ledger HW', () => {
  describe('factory', () => {
    it('gets app version', async () => {
      await initTransport(indent`
        => e006000000
        <= 000004049000
        => e006000000
        <= 000004049000`);
      const factory = new AccountLedgerFactory(transport);
      expect((await factory.getAppConfiguration()).version).to.be.equal('0.4.4');
    });

    it('ensures that app version is compatible', async () => {
      await initTransport(
        indent`
          => e006000000
          <= 000104049000`,
        true,
      );
      const factory = new AccountLedgerFactory(transport);
      await expect(factory.getAddress(42)).to.be.rejectedWith(
        'Unsupported app on ledger version 1.4.4. Supported: >= 0.4.4 < 0.5.0',
      );
    });

    it('gets address', async () => {
      await initTransport(indent`
        => e006000000
        <= 000004049000
        => e0020000040000002a
        <= 35616b5f3248746565756a614a7a75744b65465a69416d59547a636167536f5245725358704246563137397859677154347465616b769000`);
      const factory = new AccountLedgerFactory(transport);
      expect(await factory.getAddress(42)).to.be.equal(
        'ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv',
      );
    });

    it('gets address with verification', async () => {
      await initTransport(indent`
        => e006000000
        <= 000004049000
        => e0020100040000002a
        <= 35616b5f3248746565756a614a7a75744b65465a69416d59547a636167536f5245725358704246563137397859677154347465616b769000`);
      const factory = new AccountLedgerFactory(transport);
      expect(await factory.getAddress(42, true)).to.be.equal(
        'ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv',
      );
    });

    it('gets address with verification rejected', async () => {
      await initTransport(indent`
        => e006000000
        <= 000004049000
        => e0020100040000002a
        <= 6985`);
      const factory = new AccountLedgerFactory(transport);
      await expect(factory.getAddress(42, true)).to.be.rejectedWith(
        'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)',
      );
    });

    it('initializes an account', async () => {
      await initTransport(indent`
        => e006000000
        <= 000004049000
        => e0020000040000002a
        <= 35616b5f3248746565756a614a7a75744b65465a69416d59547a636167536f5245725358704246563137397859677154347465616b769000`);
      const factory = new AccountLedgerFactory(transport);
      const account = await factory.initialize(42);
      expect(account).to.be.instanceOf(AccountLedger);
      expect(account.address).to.be.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
      expect(account.index).to.be.equal(42);
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
      await initTransport(indent`
        => e006000000
        <= 000004049000
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
      expect(accounts.length).to.be.equal(node.addresses.length);
      expect(accounts.map((a) => a.address)).to.be.eql(node.addresses);
    });

    it('discovers accounts on unused ledger', async () => {
      await initTransport(indent`
        => e006000000
        <= 000004049000
        => e00200000400000000
        <= 35616b5f327377684c6b674250656541447856544156434a6e5a4c59354e5a744346694d39334a787345614d754335396575754652519000`);
      const node = new NodeMock();
      const factory = new AccountLedgerFactory(transport);
      const accounts = await factory.discover(node);
      expect(accounts.length).to.be.equal(0);
    });
  });

  describe('account', () => {
    const address = 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ';
    it('fails on calling raw signing', async () => {
      await initTransport('\n');
      const account = new AccountLedger(transport, 0, address);
      await expect(account.sign()).to.be.rejectedWith('RAW signing using Ledger HW');
    });

    const transaction = buildTx({
      tag: Tag.SpendTx,
      senderId: address,
      recipientId: address,
      amount: 1.23e18,
      nonce: 10,
    });

    it('signs transaction', async () => {
      await initTransport(indent`
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
      expect(verify(hashedTx, signature, address)).to.be.equal(true);
    });

    it('signs transaction rejected', async () => {
      await initTransport(indent`
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
      await initTransport(indent`
        => e00800002f0000000000000027746573742d6d6573736167652c746573742d6d6573736167652c746573742d6d6573736167652c
        <= 78397e186058f278835b8e3e866960e4418dc1e9f00b3a2423f57c16021c88720119ebb3373a136112caa1c9ff63870092064659eb2c641dd67767f15c80350c9000`);
      const account = new AccountLedger(transport, 0, address);
      const signature = await account.signMessage(message);
      expect(signature).to.be.instanceOf(Uint8Array);
      expect(verifyMessage(message, signature, address)).to.be.equal(true);
    });

    it('signs message rejected', async () => {
      await initTransport(indent`
        => e00800002f0000000000000027746573742d6d6573736167652c746573742d6d6573736167652c746573742d6d6573736167652c
        <= 6985`);
      const account = new AccountLedger(transport, 0, address);
      await expect(account.signMessage(message)).to.be.rejectedWith(
        'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)',
      );
    });
  });
});
