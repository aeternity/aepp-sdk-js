import { afterEach, before, describe, it } from 'mocha';
import { expect } from 'chai';
import { stub } from 'sinon';
import {
  AccountBase,
  AccountMemory,
  AeSdk,
  AeSdkWallet,
  BrowserWindowMessageConnection,
  Encoded,
  METHODS,
  Node,
  NoWalletConnectedError,
  RpcConnectionError,
  RpcRejectedByUserError,
  RpcNoNetworkById,
  SUBSCRIPTION_TYPES,
  Tag,
  verifyMessageSignature,
  WALLET_TYPE,
  WalletConnectorFrame,
  WalletConnectorFrameWithNode,
} from '../../src';
import AccountRpc from '../../src/account/Rpc';
import { getSdk, networkId, timeoutBlock } from '.';
import { assertNotNull, getFakeWindows } from '../utils';

interface WalletSetup {
  wallet: AeSdkWallet;
  connection: BrowserWindowMessageConnection;
}

let aeSdk: AeSdk;
let node: Node;
let account: AccountBase;
let sdkPromise: Promise<AeSdk> | undefined;

/**
 * Both suites below need nothing but a node and one funded account, and `getSdk` pays for the
 * account with an on-chain spend, so it is called once per file.
 */
async function initSdk(): Promise<void> {
  sdkPromise ??= getSdk();
  aeSdk = await sdkPromise;
  node = aeSdk.api;
  [account] = Object.values(aeSdk.accounts);
}

/**
 * Sets up a wallet already listening on the wallet side of a fresh window pair, and returns the
 * connection an aepp would use to reach it.
 */
function setupWallet(accounts: AccountBase[]): WalletSetup {
  const windows = getFakeWindows();
  const wallet = new AeSdkWallet({
    nodes: [{ name: 'local', instance: node }],
    accounts,
    id: 'test',
    type: WALLET_TYPE.window,
    name: 'Wallet',
    onConnection() {},
    onSubscription() {},
    onAskAccounts() {},
    onAskToSelectNetwork() {},
    onDisconnect() {},
  });
  wallet.addRpcClient(
    new BrowserWindowMessageConnection({
      self: windows.walletWindow,
      target: windows.aeppWindow,
    }),
  );
  const connection = new BrowserWindowMessageConnection({
    self: windows.aeppWindow,
    target: windows.walletWindow,
  });
  return { wallet, connection };
}

describe('WalletConnectorFrame', () => {
  before(initSdk);

  const setup = (): WalletSetup => setupWallet([account, AccountMemory.generate()]);

  describe('connect', () => {
    it('connects to wallet and reports network id', async () => {
      const { connection } = setup();
      const connector = await WalletConnectorFrame.connect('Test aepp', connection);
      expect(connector.isConnected).to.equal(true);
      expect(connector.networkId).to.equal(networkId);
      expect(connector.accounts).to.eql([]);
    });

    it('fails if wallet rejects connection', async () => {
      const { wallet, connection } = setup();
      wallet.onConnection = () => {
        throw new RpcRejectedByUserError();
      };
      await expect(WalletConnectorFrame.connect('Test aepp', connection))
        .to.be.eventually.rejectedWith('Operation rejected by user')
        .with.property('code', 4);
    });
  });

  describe('accounts', () => {
    let wallet: AeSdkWallet;
    let connector: WalletConnectorFrame;

    before(async () => {
      const { wallet: w, connection } = setup();
      wallet = w;
      connector = await WalletConnectorFrame.connect('Test aepp', connection);
    });

    // restored here rather than at the end of each test so that a failing assertion doesn't leave
    // a throwing handler behind for the rest of the suite
    afterEach(() => {
      wallet.onAskAccounts = () => {};
      wallet.onSubscription = () => {};
    });

    it('asks wallet for accounts', async () => {
      const accounts = await connector.getAccounts();
      expect(accounts.map((a) => a.address)).to.eql(wallet.addresses());
      accounts.forEach((a) => expect(a).to.be.an.instanceOf(AccountRpc));
    });

    it('fails to ask accounts if wallet rejects', async () => {
      wallet.onAskAccounts = () => {
        throw new RpcRejectedByUserError();
      };
      await expect(connector.getAccounts())
        .to.be.eventually.rejectedWith('Operation rejected by user')
        .with.property('code', 4);
    });

    it('subscribes to accounts', async () => {
      const accounts = await connector.subscribeAccounts(SUBSCRIPTION_TYPES.subscribe, 'connected');
      expect(accounts.length).to.equal(wallet.addresses().length);
      expect(connector.accounts).to.eql(accounts);
      expect(accounts.map((a) => a.address)).to.have.members(wallet.addresses());
    });

    it('emits accountsChange when wallet adds an account', async () => {
      const extraAccount = AccountMemory.generate();
      const accountsPromise = new Promise<AccountRpc[]>((resolve) => {
        connector.once('accountsChange', resolve);
      });
      wallet.addAccount(extraAccount);
      const accounts = await accountsPromise;
      expect(accounts.map((a) => a.address)).to.include(extraAccount.address);
      expect(connector.accounts).to.eql(accounts);
    });

    it('emits accountsChange when wallet selects an account', async () => {
      const [, connectedAccount] = wallet.addresses();
      const accountsPromise = new Promise<AccountRpc[]>((resolve) => {
        connector.once('accountsChange', resolve);
      });
      wallet.selectAccount(connectedAccount);
      const accounts = await accountsPromise;
      expect(accounts[0].address).to.equal(connectedAccount);
    });

    it('unsubscribes from accounts', async () => {
      const accounts = await connector.subscribeAccounts(
        SUBSCRIPTION_TYPES.unsubscribe,
        'connected',
      );
      expect(accounts).to.eql([]);
      expect(connector.accounts).to.eql([]);
    });

    it('fails to subscribe if wallet rejects', async () => {
      wallet.onSubscription = () => {
        throw new RpcRejectedByUserError();
      };
      await expect(connector.subscribeAccounts(SUBSCRIPTION_TYPES.subscribe, 'connected'))
        .to.be.eventually.rejectedWith('Operation rejected by user')
        .with.property('code', 4);
    });
  });

  it('signs a transaction using an account provided by wallet', async () => {
    const { connection } = setup();
    const connector = await WalletConnectorFrame.connect('Test aepp', connection);
    const [accountRpc] = await connector.subscribeAccounts(SUBSCRIPTION_TYPES.subscribe, 'current');

    const tx = await aeSdk.buildTx({
      tag: Tag.SpendTx,
      senderId: accountRpc.address,
      recipientId: accountRpc.address,
      amount: 1,
    });
    const signedTx = await aeSdk.sendTransaction(tx, { onAccount: accountRpc });
    expect(signedTx.hash).to.satisfy((h: string) => h.startsWith('th_'));
  }).timeout(timeoutBlock);

  it('signs a message using an account provided by wallet', async () => {
    const { connection } = setup();
    const connector = await WalletConnectorFrame.connect('Test aepp', connection);
    const [accountRpc] = await connector.subscribeAccounts(SUBSCRIPTION_TYPES.subscribe, 'current');

    const message = 'test message';
    const signature = await accountRpc.signMessage(message);
    expect(verifyMessageSignature(message, signature, accountRpc.address)).to.equal(true);
  });

  describe('askToSelectNetwork', () => {
    it('asks wallet to select a network', async () => {
      const { wallet, connection } = setup();
      const connector = await WalletConnectorFrame.connect('Test aepp', connection);
      let args: unknown[] = [];
      wallet.onAskToSelectNetwork = (...a) => {
        args = a;
      };
      const payload = { networkId: 'ae_test' };
      await connector.askToSelectNetwork(payload);
      expect(args.slice(1)).to.eql([payload, 'http://origin.test']);
    });

    it('fails if wallet does not know the network', async () => {
      const { wallet, connection } = setup();
      const connector = await WalletConnectorFrame.connect('Test aepp', connection);
      wallet.onAskToSelectNetwork = () => {
        throw new RpcNoNetworkById('test');
      };
      await expect(connector.askToSelectNetwork({ networkId: 'ae_test' }))
        .to.be.eventually.rejectedWith('Wallet can\'t find a network by id "test"')
        .with.property('code', 13);
    });
  });

  it('emits networkIdChange when wallet switches node', async () => {
    const { wallet, connection } = setup();
    const connector = await WalletConnectorFrame.connect('Test aepp', connection);
    const networkIdPromise = new Promise<string>((resolve) => {
      connector.once('networkIdChange', resolve);
    });
    wallet.addNode('second-node', node, true);
    expect(await networkIdPromise).to.equal(networkId);
    expect(connector.networkId).to.equal(networkId);
  });

  describe('disconnect', () => {
    it('disconnects from wallet and drops accounts', async () => {
      const { wallet, connection } = setup();
      const connector = await WalletConnectorFrame.connect('Test aepp', connection);
      await connector.subscribeAccounts(SUBSCRIPTION_TYPES.subscribe, 'connected');
      expect(connector.accounts.length).to.be.greaterThan(0);

      const disconnectPromise = new Promise<unknown>((resolve) => {
        connector.once('disconnect', resolve);
      });
      const walletDisconnectPromise = new Promise<any[]>((resolve) => {
        wallet.onDisconnect = (...args) => resolve(args);
      });
      connector.disconnect();

      await disconnectPromise;
      const [, walletParams] = await walletDisconnectPromise;
      expect(walletParams.reason).to.equal('bye');
      expect(connector.isConnected).to.equal(false);
      expect(connector.accounts).to.eql([]);
    });

    it('emits disconnect with the reason sent by wallet', async () => {
      const { wallet, connection } = setup();
      const connector = await WalletConnectorFrame.connect('Test aepp', connection);
      const disconnectPromise = new Promise<any>((resolve) => {
        connector.once('disconnect', resolve);
      });
      const [clientInfo] = Array.from(wallet._clients.values());
      clientInfo.rpc.notify(METHODS.closeConnection, { reason: 'wallet is closing' });
      expect((await disconnectPromise).reason).to.equal('wallet is closing');
      expect(connector.isConnected).to.equal(false);
    });

    it('fails to use connector after disconnect', async () => {
      const { connection } = setup();
      const connector = await WalletConnectorFrame.connect('Test aepp', connection);
      connector.disconnect();

      const message = 'You are not connected to Wallet';
      await expect(connector.getAccounts()).to.be.rejectedWith(NoWalletConnectedError, message);
      await expect(
        connector.subscribeAccounts(SUBSCRIPTION_TYPES.subscribe, 'connected'),
      ).to.be.rejectedWith(NoWalletConnectedError, message);
      await expect(connector.askToSelectNetwork({ networkId: 'ae_test' })).to.be.rejectedWith(
        NoWalletConnectedError,
        message,
      );
      expect(() => connector.disconnect()).to.throw(NoWalletConnectedError, message);
    });
  });
});

describe('WalletConnectorFrameWithNode', () => {
  before(initSdk);

  const setup = (): WalletSetup => setupWallet([account]);

  it('gets node shared by wallet on connect', async () => {
    const { connection } = setup();
    const connector = await WalletConnectorFrameWithNode.connect('Test aepp', connection);
    expect(connector.node).to.be.an.instanceOf(Node);
    expect(await connector.node.getNetworkId()).to.equal(networkId);
  });

  it('fails to connect if wallet does not share a node', async () => {
    const { wallet, connection } = setup();
    stub(wallet, '_getNode').returns({ node: undefined });
    await expect(WalletConnectorFrameWithNode.connect('Test aepp', connection)).to.be.rejectedWith(
      RpcConnectionError,
      'Missing URLs of the Node',
    );
  });

  it('emits nodeChange when wallet switches node', async () => {
    const { wallet, connection } = setup();
    const connector = await WalletConnectorFrameWithNode.connect('Test aepp', connection);
    const nodePromise = new Promise<Node>((resolve) => {
      connector.once('nodeChange', resolve);
    });
    wallet.addNode('second-node', node, true);
    const newNode = await nodePromise;
    expect(newNode).to.be.an.instanceOf(Node);
    expect(connector.node).to.equal(newNode);
  });

  it('uses the wallet node to read chain state', async () => {
    const { connection } = setup();
    const connector = await WalletConnectorFrameWithNode.connect('Test aepp', connection);
    const [accountRpc] = await connector.subscribeAccounts(SUBSCRIPTION_TYPES.subscribe, 'current');
    assertNotNull(accountRpc);
    const address: Encoded.AccountAddress = accountRpc.address;
    const { balance } = await connector.node.getAccountByPubkey(address);
    expect(balance).to.be.a('bigint');
  });
});
