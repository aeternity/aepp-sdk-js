import puppeteer, { Page } from 'puppeteer-core';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import type { BaseProvider } from '@metamask/providers';
import '..';
import {
  AccountMetamask,
  AccountMetamaskFactory,
  buildTx,
  Tag,
  unpackTx,
  verifySignature,
  verifyMessage,
  decode,
  hash,
} from '../../src';
import { assertNotNull } from '../utils';

const compareWithExtension = false; // switch to true for manual testing
// MetaMask should be initialized with mnemonic:
// eye quarter chapter suit cruel scrub verify stuff volume control learn dust
type Message = { request: object } | { resolve: unknown } | { reject: object };
let page: Page;

async function instructTester(action?: string): Promise<void> {
  if (!compareWithExtension) return;
  await page.evaluate(
    (t) => (document.body.innerHTML = t),
    action != null ? `Press ${action.toUpperCase()}!` : 'Running tests...',
  );
}

async function initProvider(
  messageQueue: Message[],
  fakeQueue: boolean = false,
): Promise<BaseProvider> {
  after(() => expect(messageQueue).to.have.lengthOf(0));
  return {
    async request(actualRequest: unknown) {
      const expectedRequest = messageQueue.shift();
      assertNotNull(expectedRequest);
      if (!('request' in expectedRequest))
        throw new Error(`Expected request, got ${JSON.stringify(expectedRequest)} instead`);
      expect(actualRequest).to.eql(expectedRequest.request);

      const expectedResponse = messageQueue.shift();
      assertNotNull(expectedResponse);
      if ('request' in expectedResponse)
        throw new Error(
          `Expected reject or resolve, got ${JSON.stringify(expectedRequest)} instead`,
        );

      if (compareWithExtension && !fakeQueue) {
        const actualResponse = await page.evaluate(async (req): Promise<Message> => {
          // @ts-expect-error executed in a browser
          return window.ethereum.request(req).then(
            (resolve: unknown) => ({ resolve }),
            (reject: unknown) => ({ reject }),
          );
        }, expectedRequest.request);
        expect(actualResponse).to.eql(expectedResponse);
      }

      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      if ('reject' in expectedResponse) throw expectedResponse.reject;
      return expectedResponse.resolve;
    },
  } as unknown as BaseProvider;
}

describe('Aeternity Snap for MetaMask', function () {
  this.timeout(compareWithExtension ? 60000 : 300);

  before(async () => {
    if (!compareWithExtension) return;

    const metamaskDir = './test/assets/metamask/';
    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: false,
      args: [`--disable-extensions-except=${metamaskDir}`, `--load-extension=${metamaskDir}`],
      userDataDir: './test/assets/chrome-user-data',
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    [page] = await browser.pages();
    await page.goto('https://google.com/404');
    await page.evaluate(() => alert('Press OK when MetaMask is ready'));
    await instructTester();

    after(async () => browser.close());
  });

  afterEach(async (): Promise<void> => instructTester());

  describe('factory', () => {
    const snapDetails = {
      blocked: false,
      enabled: true,
      id: 'npm:@aeternity-snap/plugin',
      initialPermissions: {
        snap_manageState: {},
        snap_dialog: {},
        'endowment:rpc': { dapps: true, snaps: false },
        'endowment:network-access': {},
        snap_getBip32Entropy: [{ path: ['m', "44'", "457'"], curve: 'ed25519' }],
      },
      version: '0.0.9',
    };

    const metamaskVersionCheck = [
      { request: { method: 'web3_clientVersion' } },
      { resolve: 'MetaMask/v12.3.1' },
    ];

    it('installs snap', async () => {
      const provider = await initProvider([
        ...metamaskVersionCheck,
        {
          request: {
            method: 'wallet_requestSnaps',
            params: { 'npm:@aeternity-snap/plugin': { version: '0.0.9' } },
          },
        },
        {
          resolve: {
            'npm:@aeternity-snap/plugin': snapDetails,
          },
        },
      ]);
      const factory = new AccountMetamaskFactory(provider);
      expect(await factory.installSnap()).to.eql(snapDetails);
    });

    it('requests snap', async () => {
      const provider = await initProvider([
        ...metamaskVersionCheck,
        {
          request: {
            method: 'wallet_requestSnaps',
            params: { 'npm:@aeternity-snap/plugin': { version: '>=0.0.9 <0.1.0' } },
          },
        },
        {
          resolve: {
            'npm:@aeternity-snap/plugin': snapDetails,
          },
        },
      ]);
      const factory = new AccountMetamaskFactory(provider);
      expect(await factory.requestSnap()).to.eql(snapDetails);
    });

    const snapVersionCheck = [
      { request: { method: 'wallet_getSnaps' } },
      { resolve: { 'npm:@aeternity-snap/plugin': snapDetails } },
    ];

    it('gets snap version', async () => {
      const provider = await initProvider([...metamaskVersionCheck, ...snapVersionCheck]);
      const factory = new AccountMetamaskFactory(provider);
      expect(await factory.getSnapVersion()).to.equal('0.0.9');
    });

    const requestSnaps = [
      {
        request: {
          method: 'wallet_requestSnaps',
          params: {
            'npm:@aeternity-snap/plugin': {
              version: '>=0.0.9 <0.1.0',
            },
          },
        },
      },
      { resolve: { 'npm:@aeternity-snap/plugin': snapDetails } },
    ];

    it('ensures that snap version is compatible', async () => {
      const provider = await initProvider(
        [
          ...metamaskVersionCheck,
          requestSnaps[0],
          {
            reject: {
              code: -32602,
              message:
                'Snap "npm:@aeternity-snap/plugin@<>" is already installed. Couldn\'t update to a version inside requested "<>" range.',
            },
          },
        ],
        true,
      );
      const factory = new AccountMetamaskFactory(provider);
      await expect(factory.initialize(42)).to.be.rejectedWith(
        'Snap "npm:@aeternity-snap/plugin@<>" is already installed. Couldn\'t update to a version inside requested "<>" range.',
      );
    });

    const getPublicKeyRequest = {
      request: {
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@aeternity-snap/plugin',
          request: { method: 'getPublicKey', params: { derivationPath: ["42'", "0'", "0'"] } },
        },
      },
    };

    it('initializes an account', async () => {
      const provider = await initProvider([
        ...metamaskVersionCheck,
        ...requestSnaps,
        getPublicKeyRequest,
        { resolve: { publicKey: 'ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv' } },
      ]);
      const factory = new AccountMetamaskFactory(provider);
      await instructTester('approve');
      const account = await factory.initialize(42);
      expect(account).to.be.an.instanceOf(AccountMetamask);
      expect(account.address).to.equal('ak_2HteeujaJzutKeFZiAmYTzcagSoRErSXpBFV179xYgqT4teakv');
      expect(account.index).to.equal(42);
    });

    it('initializes an account rejected', async () => {
      const provider = await initProvider([
        ...metamaskVersionCheck,
        ...requestSnaps,
        getPublicKeyRequest,
        { reject: { code: 4001, message: 'User rejected the request.' } },
      ]);
      const factory = new AccountMetamaskFactory(provider);
      await instructTester('reject');
      await expect(factory.initialize(42)).to.be.rejectedWith('User rejected the request.');
    });
  });

  describe('account', () => {
    const address = 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ';
    it('fails on calling raw signing', async () => {
      const provider = await initProvider([]);
      const account = new AccountMetamask(provider, 0, address);
      await expect(account.unsafeSign()).to.be.rejectedWith('RAW signing using MetaMask');
    });

    const transaction = buildTx({
      tag: Tag.SpendTx,
      senderId: address,
      recipientId: address,
      amount: 1.23e18,
      nonce: 10,
    });

    const signTransactionRequest = {
      request: {
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@aeternity-snap/plugin',
          request: {
            method: 'signTransaction',
            params: {
              derivationPath: ["0'", "0'", "0'"],
              networkId: 'ae_uat',
              tx: 'tx_+FkMAaEB915T9XgiInpYtGMJXW2rZXyrgEV0vmLeC+H5UnnQkDehAfdeU/V4IiJ6WLRjCV1tq2V8q4BFdL5i3gvh+VJ50JA3iBER1nuxuwAAhg9MNiAIAAAKgKZ39DI=',
            },
          },
        },
      },
    };

    it('signs transaction', async () => {
      const provider = await initProvider([
        signTransactionRequest,
        {
          resolve: {
            publicKey: 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ',
            signedTx:
              'tx_+KMLAfhCuED4aPHGzpufKzrsvsBMantciuMPXA6H288X+5lmPMIuQapu210e41Z4FkyD1b3IzYzvMIs+z5b1Pzy9YXMgQewNuFv4WQwBoQH3XlP1eCIieli0YwldbatlfKuARXS+Yt4L4flSedCQN6EB915T9XgiInpYtGMJXW2rZXyrgEV0vmLeC+H5UnnQkDeIERHWe7G7AACGD0w2IAgAAAqAja1dTA==',
          },
        },
      ]);
      const account = new AccountMetamask(provider, 0, address);
      const networkId = 'ae_uat';
      await instructTester('approve');
      const signedTransaction = await account.signTransaction(transaction, { networkId });
      expect(signedTransaction).to.satisfy((t: string) => t.startsWith('tx_'));
      const {
        signatures: [signature],
      } = unpackTx(signedTransaction, Tag.SignedTx);
      const hashedTx = Buffer.concat([Buffer.from(networkId), hash(decode(transaction))]);
      expect(verifySignature(hashedTx, signature, address)).to.equal(true);
    });

    it('signs transaction rejected', async () => {
      const provider = await initProvider([
        signTransactionRequest,
        { reject: { code: 4001, message: 'User rejected the request.' } },
      ]);
      const account = new AccountMetamask(provider, 0, address);
      await instructTester('reject');
      await expect(
        account.signTransaction(transaction, { networkId: 'ae_uat' }),
      ).to.be.rejectedWith('User rejected the request.');
    });

    const message = 'test-message,'.repeat(3);
    const signMessageRequest = {
      request: {
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@aeternity-snap/plugin',
          request: {
            method: 'signMessage',
            params: {
              derivationPath: ["0'", "0'", "0'"],
              message: 'dGVzdC1tZXNzYWdlLHRlc3QtbWVzc2FnZSx0ZXN0LW1lc3NhZ2Us',
            },
          },
        },
      },
    };

    it('signs message', async () => {
      const provider = await initProvider([
        signMessageRequest,
        {
          resolve: {
            publicKey: 'ak_2swhLkgBPeeADxVTAVCJnZLY5NZtCFiM93JxsEaMuC59euuFRQ',
            signature:
              'eDl+GGBY8niDW44+hmlg5EGNwenwCzokI/V8FgIciHIBGeuzNzoTYRLKocn/Y4cAkgZGWessZB3Wd2fxXIA1DA==',
          },
        },
      ]);
      const account = new AccountMetamask(provider, 0, address);
      await instructTester('approve');
      const signature = await account.signMessage(message);
      expect(signature).to.be.an.instanceOf(Uint8Array);
      expect(verifyMessage(message, signature, address)).to.equal(true);
    });

    it('signs message rejected', async () => {
      const provider = await initProvider([
        signMessageRequest,
        { reject: { code: 4001, message: 'User rejected the request.' } },
      ]);
      const account = new AccountMetamask(provider, 0, address);
      await instructTester('reject');
      await expect(account.signMessage(message)).to.be.rejectedWith('User rejected the request.');
    });
  });
});
