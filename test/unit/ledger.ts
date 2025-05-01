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
  AccountLedger as AccountLedgerOriginal,
  AccountLedgerFactory as AccountLedgerFactoryOriginal,
  buildTx,
  Node,
  Tag,
  unpackTx,
  verifySignature,
  verifyMessageSignature,
  decode,
  Encoded,
  hash,
} from '../../src';
import { indent } from '../utils';
import { Domain } from '../../src/utils/typed-data';
import { ContractByteArrayEncoder, TypeResolver } from '@aeternity/aepp-calldata';

const compareWithRealDevice = false; // switch to true for manual testing
// ledger should be initialized with mnemonic:
// eye quarter chapter suit cruel scrub verify stuff volume control learn dust

function genLedgerTests(this: Mocha.Suite, isNewApp = false): void {
  this.timeout(compareWithRealDevice ? 60000 : 300);

  async function initTransport(
    expectedRecordStore: string,
    ignoreRealDevice = false,
  ): Promise<Transport> {
    // TODO: remove after fixing https://github.com/aeternity/ledger-app/issues/42
    if (compareWithRealDevice && isNewApp)
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

  class AccountLedger extends AccountLedgerOriginal {
    constructor(...args: ConstructorParameters<typeof AccountLedgerOriginal>) {
      super(...args);
      this._isNewApp = isNewApp;
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
      expect(account).to.be.an.instanceOf(AccountLedgerOriginal);
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
    const unsupportedVersion = 'Unsupported ledger app version 0.4.4. Supported: >= 1.0.0 < 2.0.0';

    const rawData = Buffer.from('deadbeef', 'hex');

    it('signs raw data', async () => {
      const transport = await initTransport(
        !isNewApp
          ? ''
          : indent`
        => e00a00000c0000000000000004deadbeef
        <= 86599a8bf7475f878a437b09b3a881e172d5ddfc7fb29d28d5f567e9dc75834c5b3ef3aedf13a4a329058ba993ec68290166cac603f80aaee1c207e524ba75059000`,
      );
      const account = new AccountLedger(transport, 0, address);
      const signaturePromise = account.unsafeSign(rawData);
      if (!isNewApp) {
        await expect(signaturePromise).to.be.rejectedWith(unsupportedVersion);
        return;
      }
      const signature = await signaturePromise;
      expect(verifySignature(rawData, signature, address)).to.equal(true);
    });

    it('signs raw data rejected', async () => {
      if (!isNewApp) return;
      const transport = await initTransport(indent`
        => e00a00000c0000000000000004deadbeef
        <= 6985`);
      const account = new AccountLedger(transport, 0, address);
      await expect(account.unsafeSign(rawData)).to.be.rejectedWith(
        'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)',
      );
    });

    const transaction = buildTx({
      tag: Tag.SpendTx,
      senderId: address,
      recipientId: address,
      amount: 1.23e18,
      nonce: 10,
    });
    const genSignTxRequest = (innerTx = false): string =>
      `e00400006${isNewApp ? 'b' : 'a'}000000000000005b${isNewApp ? (innerTx ? '01' : '00') : ''}0661655f756174f8590c01a101f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037a101f75e53f57822227a58b463095d6dab657cab804574be62de0be1f95279d09037881111d67bb1bb0000860f4c36200800000a80`;

    it('signs transaction', async () => {
      const transport = await initTransport(indent`
        => ${genSignTxRequest()}
        <= f868f1c6ce9b9f2b3aecbec04c6a7b5c8ae30f5c0e87dbcf17fb99663cc22e41aa6edb5d1ee35678164c83d5bdc8cd8cef308b3ecf96f53f3cbd61732041ec0d9000`);
      const account = new AccountLedger(transport, 0, address);
      const networkId = 'ae_uat';
      const signedTransaction = await account.signTransaction(transaction, { networkId });
      expect(signedTransaction).to.satisfy((t: string) => t.startsWith('tx_'));
      const {
        signatures: [signature],
      } = unpackTx(signedTransaction, Tag.SignedTx);
      const hashedTx = Buffer.concat([Buffer.from(networkId), hash(decode(transaction))]);
      expect(verifySignature(hashedTx, signature, address)).to.equal(true);
    });

    it('signs transaction rejected', async () => {
      const transport = await initTransport(indent`
        => ${genSignTxRequest()}
        <= 6985`);
      const account = new AccountLedger(transport, 0, address);
      await expect(
        account.signTransaction(transaction, { networkId: 'ae_uat' }),
      ).to.be.rejectedWith(
        'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)',
      );
    });

    it('signs transaction as inner', async () => {
      const transport = await initTransport(
        !isNewApp
          ? ''
          : indent`
        => ${genSignTxRequest(true)}
        <= e50f2485a2460d64335b725f05b14cc16db65e357f90b888b99586ac37ea3cba9f88d75dde330cda3c9deb05e0867c98d3e184c1db3b5c3e45daab8169a6c40d9000`,
      );
      const account = new AccountLedger(transport, 0, address);
      const networkId = 'ae_uat';
      const signedPromise = account.signTransaction(transaction, { networkId, innerTx: true });
      if (!isNewApp) {
        await expect(signedPromise).to.be.rejectedWith(unsupportedVersion);
        return;
      }
      const {
        signatures: [signature],
      } = unpackTx(await signedPromise, Tag.SignedTx);
      const hashedTx = Buffer.concat([
        Buffer.from(networkId + '-inner_tx'),
        hash(decode(transaction)),
      ]);
      expect(verifySignature(hashedTx, signature, address)).to.equal(true);
    });

    const message = 'test-message,'.repeat(3);

    it('signs message', async () => {
      const transport = await initTransport(indent`
        => e00800002f0000000000000027746573742d6d6573736167652c746573742d6d6573736167652c746573742d6d6573736167652c
        <= ${isNewApp ? '78397e186058f278835b8e3e866960e4418dc1e9f00b3a2423f57c16021c88720119ebb3373a136112caa1c9ff63870092064659eb2c641dd67767f15c80350c9000' : 'f370b3b9d2e0b28d9a4a5f387cacab6fd47cf9fb74b5b4dde76e431cc770eaa392e645b9098945a3d85711a44763bbc5e00da49486d41be69e33ac186589700a9000'}`);
      const account = new AccountLedger(transport, 0, address);
      const signature = await account.signMessage(message);
      expect(signature).to.be.an.instanceOf(Uint8Array);
      // FIXME: correct signature after releasing https://github.com/LedgerHQ/app-aeternity/pull/13
      expect(verifyMessageSignature(message, signature, address)).to.equal(isNewApp);
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

    const delegation =
      'ba_+EYDAaEBXXFtZp9YqbY4KdW8Nolf9Hjp0VZcNWnQOKjgCb8Br9mhBV1xbWafWKm2OCnVvDaJX/R46dFWXDVp0Dio4Am/Aa/Z2vgCEQ==';

    it('signs delegation', async () => {
      const transport = await initTransport(
        !isNewApp
          ? ''
          : indent`
        => e00a00005900000000000000511a0161655f74657374f8460301a1015d716d669f58a9b63829d5bc36895ff478e9d1565c3569d038a8e009bf01afd9a1055d716d669f58a9b63829d5bc36895ff478e9d1565c3569d038a8e009bf01afd9
        <= a863fa5a8187095f6b4d74185014e10042c59485b05d8204aef8d14be5d42663930ce6958724ab0ad0082d71e26744dbdde35ea5f2092e194d480693c026e4059000`,
      );
      const account = new AccountLedger(transport, 0, address);
      const signaturePromise = account.signDelegation(delegation, { networkId: 'ae_test' });
      if (!isNewApp) {
        await expect(signaturePromise).to.be.rejectedWith(unsupportedVersion);
        return;
      }
      expect(await signaturePromise).to.equal(
        'sg_P2krNnpBeYjJauMSeAp8Pg5rPnb9bQchz3pF3wkPRHzsaNYVutAP9kCZS9qpB6xsT69SnUsJb2kqk1SerzNSvQcZAAiNg',
      );
    });

    it('signs delegation rejected', async () => {
      if (!isNewApp) return;
      const transport = await initTransport(indent`
        => e00a00005900000000000000511a0161655f74657374f8460301a1015d716d669f58a9b63829d5bc36895ff478e9d1565c3569d038a8e009bf01afd9a1055d716d669f58a9b63829d5bc36895ff478e9d1565c3569d038a8e009bf01afd9
        <= 6985`);
      const account = new AccountLedger(transport, 0, address);
      await expect(account.signDelegation(delegation, { networkId: 'ae_test' })).to.be.rejectedWith(
        'Ledger device: Condition of use not satisfied (denied by the user?) (0x6985)',
      );
    });

    const recordAci = {
      record: [
        { name: 'operation', type: 'string' },
        { name: 'parameter', type: 'int' },
      ],
    } as const;
    const domain: Domain = {
      name: 'Test app',
      version: 2,
      networkId: 'ae_dev',
      contractAddress: 'ct_21A27UVVt3hDkBE5J7rhhqnH5YNb4Y1dqo4PnSybrH85pnWo7E',
    };
    const recordType = new TypeResolver().resolveType(recordAci, {});
    const typedData = new ContractByteArrayEncoder().encodeWithType(
      { operation: 'test', parameter: 45 },
      recordType,
    );

    it('signs typed data', async () => {
      const transport = await initTransport(
        !isNewApp
          ? ''
          : indent`
        => e00a0000280000000000000020992b3e27cc77f0cb6eef990f3cfeb84191bffe95a3e4013a962c1aa0561d1a48
        <= b2846e392b43988d2386d1e6a0d1215449c185ee9b41e2aa4be3dbe4ca92c214737169dc9f142d102657dcb77d682291e1f574c689f231b3d139879d0fa0c50c9000`,
      );
      const account = new AccountLedger(transport, 0, address);
      const signaturePromise = account.signTypedData(typedData, recordAci, domain);
      if (!isNewApp) {
        await expect(signaturePromise).to.be.rejectedWith(unsupportedVersion);
        return;
      }
      expect(await signaturePromise).to.equal(
        'sg_QMbiL9aYPDZWgYe8zqoaYwXJ7LhWqD187SFi7n9rhgSS4zXYVS2Fr4YARTRRR86wm19BHsNUYDakMKLvQ4JfLmfTVi5Wb',
      );
    });

    it('signs typed data rejected', async () => {
      if (!isNewApp) return;
      const transport = await initTransport(indent`
        => e00a0000280000000000000020992b3e27cc77f0cb6eef990f3cfeb84191bffe95a3e4013a962c1aa0561d1a48
        <= 6985`);
      const account = new AccountLedger(transport, 0, address);
      await expect(account.signTypedData(typedData, recordAci, domain)).to.be.rejectedWith(
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
