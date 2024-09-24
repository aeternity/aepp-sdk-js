import { after, before, describe, it } from 'mocha';
import { expect } from 'chai';
import { stub, createSandbox } from 'sinon';
import {
  AeSdk,
  AeSdkAepp,
  AeSdkWallet,
  BrowserWindowMessageConnection,
  MemoryAccount,
  Node,
  CompilerHttp,
  RpcConnectionDenyError,
  RpcRejectedByUserError,
  RpcNoNetworkById,
  SUBSCRIPTION_TYPES,
  Tag,
  WALLET_TYPE,
  unpackTx,
  decode,
  encode,
  Encoded,
  Encoding,
  MESSAGE_DIRECTION,
  METHODS,
  RPC_STATUS,
  verify,
  NoWalletConnectedError,
  UnAuthorizedAccountError,
  UnknownRpcClientError,
  UnsubscribedAccountError,
  RpcInternalError,
  AccountBase,
  verifyMessage,
  buildTx,
  hashTypedData,
  Contract,
  packDelegation,
  DelegationTag,
} from '../../src';
import { getBufferToSign } from '../../src/account/Memory';
import { ImplPostMessage } from '../../src/aepp-wallet-communication/connection/BrowserWindowMessage';
import { getSdk, networkId, compilerUrl } from '.';
import { Accounts, Network } from '../../src/aepp-wallet-communication/rpc/types';
import { assertNotNull, indent } from '../utils';

const WindowPostMessageFake = (
  name: string,
): ImplPostMessage & { name: string; messages: any[] } => {
  let listener: (event: any) => void;
  return {
    name,
    messages: [],
    addEventListener(onEvent: string, _listener: typeof listener) {
      listener = _listener;
    },
    removeEventListener() {
      return () => null;
    },
    postMessage(source: any, msg: any) {
      this.messages.push(msg);
      setTimeout(() => {
        if (typeof listener === 'function') {
          listener({ data: msg, origin: 'http://origin.test', source });
        }
      });
    },
  };
};

const getConnections = (): { walletWindow: ImplPostMessage; aeppWindow: ImplPostMessage } => {
  // @ts-expect-error workaround for tests
  global.window = { location: { origin: '//test' } };
  const walletWindow = WindowPostMessageFake('wallet');
  const aeppWindow = WindowPostMessageFake('aepp');
  walletWindow.postMessage = walletWindow.postMessage.bind(walletWindow, aeppWindow);
  aeppWindow.postMessage = aeppWindow.postMessage.bind(aeppWindow, walletWindow);
  return { walletWindow, aeppWindow };
};

describe('Aepp<->Wallet', () => {
  const connections = getConnections();
  const connectionFromWalletToAepp = new BrowserWindowMessageConnection({
    self: connections.walletWindow,
    target: connections.aeppWindow,
  });
  const connectionFromAeppToWallet = new BrowserWindowMessageConnection({
    self: connections.aeppWindow,
    target: connections.walletWindow,
  });
  const handlerReject = (): void => {
    throw new Error('test reject');
  };
  let node: Node;
  let aeSdk: AeSdk;
  let account: AccountBase;

  before(async () => {
    aeSdk = await getSdk();
    node = aeSdk.api;
    [account] = Object.values(aeSdk.accounts);
  });

  describe('New RPC Wallet-AEPP: AEPP node', () => {
    const { address } = MemoryAccount.generate();
    let aepp: AeSdkAepp;
    let wallet: AeSdkWallet;

    before(async () => {
      wallet = new AeSdkWallet({
        nodes: [{ name: 'local', instance: node }],
        accounts: [account, MemoryAccount.generate()],
        id: 'test',
        type: WALLET_TYPE.window,
        name: 'Wallet',
        onConnection: handlerReject,
        onSubscription: handlerReject,
        onAskAccounts: handlerReject,
        onAskToSelectNetwork: handlerReject,
        onDisconnect() {},
      });
      aepp = new AeSdkAepp({
        name: 'AEPP',
        nodes: [{ name: 'test', instance: node }],
        onNetworkChange() {},
        onAddressChange() {},
        onDisconnect() {},
      });
    });

    it('aepp can do static calls without connection to wallet', async () => {
      const contract = await Contract.initialize({
        ...aeSdk.getContext(),
        sourceCode: indent`
          contract Test =
            entrypoint getArg(x : int) = x`,
      });
      await contract.$deploy([]);
      const aeppSdk = new AeSdkAepp({
        name: 'AEPP',
        nodes: [{ name: 'test', instance: node }],
        onCompiler: new CompilerHttp(compilerUrl),
      });
      const contractAepp = await Contract.initialize<{ getArg: (a: number) => number }>({
        ...aeppSdk.getContext(),
        aci: contract._aci,
        address: contract.$options.address,
      });
      expect((await contractAepp.getArg(42)).decodedResult).to.be.equal(42n);
    });

    it('Fail on not connected', async () => {
      await Promise.all(
        [aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'current'), aepp.askAddresses()].map(
          (promise) =>
            expect(promise).to.be.rejectedWith(
              NoWalletConnectedError,
              'You are not connected to Wallet',
            ),
        ),
      );
      expect(() => aepp.disconnectWallet()).to.throw(
        NoWalletConnectedError,
        'You are not connected to Wallet',
      );
      expect(() => aepp.address).to.throw(
        NoWalletConnectedError,
        'You are not connected to Wallet',
      );
    });

    it('Should receive `announcePresence` message from wallet', async () => {
      const isReceived = new Promise<boolean>((resolve) => {
        connections.aeppWindow.addEventListener('message', (msg) => {
          resolve(msg.data.method === 'connection.announcePresence');
        });
      });

      const clientId = wallet.addRpcClient(connectionFromWalletToAepp);
      Array.from(wallet._clients.keys()).length.should.be.equal(1);
      await wallet.shareWalletInfo(clientId);
      const is = await isReceived;
      is.should.be.equal(true);
    });

    it('AEPP connect to wallet: wallet reject connection', async () => {
      wallet.onConnection = () => {
        throw new RpcConnectionDenyError();
      };
      await expect(aepp.connectToWallet(connectionFromAeppToWallet))
        .to.be.eventually.rejectedWith('Wallet deny your connection request')
        .with.property('code', 9);
    });

    it('AEPP connect to wallet: wallet accept connection', async () => {
      wallet.onConnection = () => {};
      connectionFromAeppToWallet.disconnect();
      const connected = await aepp.connectToWallet(connectionFromAeppToWallet);

      connected.name.should.be.equal('Wallet');
    });

    it('Try to get address from wallet: not subscribed for account', async () => {
      expect(() => aepp.address).to.throw(
        UnsubscribedAccountError,
        'You are not subscribed for an account.',
      );
    });

    it('Try to ask for address', async () => {
      await expect(aepp.askAddresses()).to.be.rejectedWith(
        RpcInternalError,
        'The peer failed to execute your request due to unknown error',
      );
      wallet.onAskAccounts = () => {};
      expect(await aepp.askAddresses()).to.be.eql(wallet.addresses());
    });

    it('Try to sign and send transaction to wallet without subscription', async () => {
      wallet.getAccounts().should.be.an('object');
      await Promise.all(
        [aepp.signTransaction('tx_asdasd'), aepp.sendTransaction('tx_asdasd')].map((promise) =>
          expect(promise).to.be.rejectedWith(
            UnsubscribedAccountError,
            'You are not subscribed for an account.',
          ),
        ),
      );
    });

    it('Subscribe to address: wallet reject', async () => {
      wallet.onSubscription = () => {
        throw new RpcRejectedByUserError();
      };
      await expect(aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected'))
        .to.be.eventually.rejectedWith('Operation rejected by user')
        .with.property('code', 4);
    });

    it('Subscribe to address: wallet accept', async () => {
      let checkPromise;
      wallet.onSubscription = (id, params, origin) => {
        checkPromise = Promise.resolve().then(() => {
          expect(Buffer.from(id, 'base64').length).to.be.equal(8);
          expect(params).to.be.eql({ type: 'subscribe', value: 'connected' });
          expect(origin).to.be.equal('http://origin.test');
        });
      };
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.unsubscribe, 'connected');
      const subscriptionResponse = await aepp.subscribeAddress(
        SUBSCRIPTION_TYPES.subscribe,
        'connected',
      );

      await checkPromise;
      subscriptionResponse.subscription.should.be.an('array');
      subscriptionResponse.subscription.filter((e) => e === 'connected').length.should.be.equal(1);
      subscriptionResponse.address.current.should.be.an('object');
      Object.keys(subscriptionResponse.address.current)[0].should.be.equal(account.address);
      subscriptionResponse.address.connected.should.be.an('object');
      Object.keys(subscriptionResponse.address.connected).length.should.be.equal(1);
    });

    it('Try to use `onAccount` for not existent account', () => {
      expect(() => {
        aepp.spend(100, address, { onAccount: address });
      }).to.throw(UnAuthorizedAccountError, `You do not have access to account ${address}`);
    });

    it('aepp accepts key pairs in onAccount', async () => {
      await aepp.spend(100, aepp.address, { onAccount: account });
    });

    it('Get address: subscribed for accounts', async () => {
      expect(aepp.address).to.be.equal(account.address);
    });

    it('Ask for address: exception in onAskAccounts -> wallet deny', async () => {
      wallet.onAskAccounts = () => {
        throw new RpcRejectedByUserError();
      };
      await expect(aepp.askAddresses())
        .to.be.eventually.rejectedWith('Operation rejected by user')
        .with.property('code', 4);
    });

    it('Ask for address: no exception in onAskAccounts -> wallet accept', async () => {
      let checkPromise;
      wallet.onAskAccounts = (id, params, origin) => {
        checkPromise = Promise.resolve().then(() => {
          expect(Buffer.from(id, 'base64').length).to.be.equal(8);
          expect(params).to.be.equal(undefined);
          expect(origin).to.be.equal('http://origin.test');
        });
      };
      const addressees = await aepp.askAddresses();
      addressees.length.should.be.equal(2);
      addressees[0].should.be.equal(account.address);
      await checkPromise;
    });

    it('Not authorize', async () => {
      const clientInfo = Array.from(wallet._clients.entries())[0][1];
      clientInfo.status = RPC_STATUS.DISCONNECTED;
      await expect(aepp.askAddresses())
        .to.be.eventually.rejectedWith('You are not connected to the wallet')
        .with.property('code', 10);
      clientInfo.status = RPC_STATUS.CONNECTED;
    });

    it('Sign transaction: wallet deny', async () => {
      let origin;
      const s = stub(wallet._resolveAccount(), 'signTransaction').callsFake(
        (tx, { aeppOrigin }) => {
          origin = aeppOrigin;
          throw new RpcRejectedByUserError();
        },
      );
      const tx = await aepp.buildTx({
        tag: Tag.SpendTx,
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
      });
      await expect(aepp.signTransaction(tx))
        .to.be.eventually.rejectedWith('Operation rejected by user')
        .with.property('code', 4);
      expect(origin).to.be.equal('http://origin.test');
      s.restore();
    });

    it('Sign transaction: fails with unknown error', async () => {
      const s = stub(wallet._resolveAccount(), 'signTransaction').callsFake(() => {
        throw new Error('test');
      });
      const tx = await aepp.buildTx({
        tag: Tag.SpendTx,
        senderId: address,
        recipientId: address,
        amount: 0,
      });
      await expect(aepp.signTransaction(tx)).to.be.rejectedWith(
        'The peer failed to execute your request due to unknown error',
      );
      s.restore();
    });

    [false, true].forEach((innerTx) => {
      it(`Sign${innerTx ? ' inner' : ''} transaction`, async () => {
        const tx = await aepp.buildTx({
          tag: Tag.SpendTx,
          senderId: aepp.address,
          recipientId: aepp.address,
          amount: 0,
        });

        const signedTx = await aepp.signTransaction(tx, { innerTx });
        const unpackedTx = unpackTx(signedTx, Tag.SignedTx);
        const {
          signatures: [signature],
          encodedTx,
        } = unpackedTx;
        const txWithNetwork = getBufferToSign(buildTx(encodedTx), networkId, innerTx);
        expect(verify(txWithNetwork, signature, aepp.address)).to.be.equal(true);
      });
    });

    it('Try to sign using unpermited account', async () => {
      assertNotNull(aepp.rpcClient);
      await expect(
        aepp.rpcClient.request(METHODS.sign, {
          tx: 'tx_+NkLAfhCuECIIeWttRUiZ32uriBdmM1t+dCg90KuG2ABxOiuXqzpAul6uTWvsyfx3EFJDah6trudrityh+6XSX3mkPEimhgGuJH4jzIBoQELtO15J/l7UeG8teE0DRIzWyorEsi8UiHWPEvLOdQeYYgbwW1nTsgAAKEB6bv2BOYRtUYKOzmZ6Xcbb2BBfXPOfFUZ4S9+EnoSJcqIG8FtZ07IAACIAWNFeF2KAAAKAIYSMJzlQADAoDBrIcoop8JfZ4HOD9p3nDTiNthj7jjl+ArdHwEMUrvQgitwOr/v3Q==',
          onAccount: address,
          returnSigned: true,
          networkId,
        }),
      )
        .to.be.eventually.rejectedWith(`You are not subscribed for account ${address}`)
        .with.property('code', 11);
    });

    it('Sign by wallet and broadcast transaction by aepp ', async () => {
      const acc = wallet._resolveAccount();
      const s = stub(acc, 'signTransaction').callsFake(async (txIgnore, options) => {
        const txReplace = await aepp.buildTx({
          tag: Tag.SpendTx,
          senderId: aepp.address,
          recipientId: aepp.address,
          amount: 0,
          payload: encode(Buffer.from('zerospend2'), Encoding.Bytearray),
        });
        return MemoryAccount.prototype.signTransaction.call(acc, txReplace, options);
      });
      const tx = await aepp.buildTx({
        tag: Tag.SpendTx,
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
        payload: encode(Buffer.from('zerospend'), Encoding.Bytearray),
      });
      const res = await aepp.sendTransaction(tx);
      s.restore();
      assertNotNull(res.tx?.payload);
      decode(res.tx.payload as Encoded.Any)
        .toString()
        .should.be.equal('zerospend2');
      assertNotNull(res.blockHeight);
      res.blockHeight.should.be.a('number');
    });

    describe('Sign message', () => {
      it('rejected by wallet', async () => {
        let origin;
        const s = stub(wallet._resolveAccount(), 'signMessage').callsFake(
          (message, { aeppOrigin } = {}) => {
            origin = aeppOrigin;
            throw new RpcRejectedByUserError();
          },
        );
        await expect(aepp.signMessage('test'))
          .to.be.eventually.rejectedWith('Operation rejected by user')
          .with.property('code', 4);
        expect(origin).to.be.equal('http://origin.test');
        s.restore();
      });

      it('works', async () => {
        const messageSig = await aepp.signMessage('test');
        messageSig.should.be.instanceof(Buffer);
        expect(verifyMessage('test', messageSig, aepp.address)).to.be.equal(true);
      });

      it('fails with unknown error', async () => {
        const s = stub(wallet._resolveAccount(), 'signMessage').callsFake(() => {
          throw new Error('test');
        });
        await expect(aepp.signMessage('test')).to.be.rejectedWith(
          'The peer failed to execute your request due to unknown error',
        );
        s.restore();
      });

      it('signs using specific account', async () => {
        const onAccount = wallet.addresses()[1];
        const messageSig = await aepp.signMessage('test', { onAccount });
        expect(verifyMessage('test', messageSig, onAccount)).to.be.equal(true);
      });
    });

    describe('Sign typed data', () => {
      const recordAci = {
        record: [
          { name: 'operation', type: 'string' },
          { name: 'parameter', type: 'int' },
        ],
      } as const;
      const recordData = 'cb_KxF0ZXN0VANAuWU=';

      it('rejected by wallet', async () => {
        let origin;
        const s = stub(wallet._resolveAccount(), 'signTypedData').callsFake(
          (data, aci, { aeppOrigin } = {}) => {
            origin = aeppOrigin;
            throw new RpcRejectedByUserError();
          },
        );
        await expect(aepp.signTypedData(recordData, recordAci))
          .to.be.eventually.rejectedWith('Operation rejected by user')
          .with.property('code', 4);
        expect(origin).to.be.equal('http://origin.test');
        s.restore();
      });

      it('works', async () => {
        const messageSig = await aepp.signTypedData(recordData, recordAci);
        expect(messageSig).to.satisfy((s: string) => s.startsWith('sg_'));
        const hash = hashTypedData(recordData, recordAci, {});
        expect(verify(hash, decode(messageSig), aepp.address)).to.be.equal(true);
      });

      it('fails with unknown error', async () => {
        const s = stub(wallet._resolveAccount(), 'signTypedData').callsFake(() => {
          throw new Error('test');
        });
        await expect(aepp.signTypedData(recordData, recordAci)).to.be.rejectedWith(
          'The peer failed to execute your request due to unknown error',
        );
        s.restore();
      });

      it('signs using specific account', async () => {
        const onAccount = wallet.addresses()[1];
        const messageSig = await aepp.signTypedData(recordData, recordAci, { onAccount });
        const hash = hashTypedData(recordData, recordAci, {});
        expect(verify(hash, decode(messageSig), onAccount)).to.be.equal(true);
      });
    });

    describe('Sign raw data', () => {
      const rawData = Buffer.from('test payload');

      it('rejected by wallet', async () => {
        let origin;
        const s = stub(wallet._resolveAccount(), 'sign').callsFake((data, { aeppOrigin } = {}) => {
          origin = aeppOrigin;
          throw new RpcRejectedByUserError();
        });
        await expect(aepp.sign(rawData))
          .to.be.eventually.rejectedWith('Operation rejected by user')
          .with.property('code', 4);
        expect(origin).to.be.equal('http://origin.test');
        s.restore();
      });

      it('works', async () => {
        const signature = await aepp.sign(rawData);
        expect(signature).to.be.instanceOf(Buffer);
        expect(verify(rawData, signature, aepp.address)).to.be.equal(true);
      });

      it('fails with unknown error', async () => {
        const s = stub(wallet._resolveAccount(), 'sign').callsFake(() => {
          throw new Error('test');
        });
        await expect(aepp.sign(rawData))
          .to.be.eventually.rejectedWith(
            'The peer failed to execute your request due to unknown error',
          )
          .with.property('code', 12);
        s.restore();
      });

      it('signs using specific account', async () => {
        const onAccount = wallet.addresses()[1];
        const signature = await aepp.sign(rawData, { onAccount });
        expect(verify(rawData, signature, onAccount)).to.be.equal(true);
      });
    });

    describe('Sign delegation', () => {
      const getDelegation = (accountAddress?: Encoded.AccountAddress): Encoded.Bytearray =>
        packDelegation({
          tag: DelegationTag.AensPreclaim,
          contractAddress: 'ct_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh',
          accountAddress: accountAddress ?? aeSdk.address,
        });

      it('rejected by wallet', async () => {
        let origin;
        const sandbox = createSandbox();
        sandbox
          .stub(wallet._resolveAccount(), 'signDelegation')
          .callsFake((delegation, { aeppOrigin } = {}) => {
            origin = aeppOrigin;
            throw new RpcRejectedByUserError();
          });
        await expect(aepp.signDelegation(getDelegation()))
          .to.be.eventually.rejectedWith('Operation rejected by user')
          .with.property('code', 4);
        expect(origin).to.be.equal('http://origin.test');
        sandbox.restore();
      });

      it('works', async () => {
        const signature = await aepp.signDelegation(getDelegation());
        expect(signature).to.satisfy((s: string) => s.startsWith('sg_'));
      });

      it('fails with unknown error', async () => {
        const sandbox = createSandbox();
        sandbox.stub(wallet._resolveAccount(), 'signDelegation').callsFake(() => {
          throw new Error('test');
        });
        await expect(aepp.signDelegation(getDelegation())).to.be.rejectedWith(
          'The peer failed to execute your request due to unknown error',
        );
        sandbox.restore();
      });

      it('signs using specific account', async () => {
        const onAccount = wallet.addresses()[1];
        const signature = await aepp.signDelegation(getDelegation(onAccount), { onAccount });
        expect(signature).to.satisfy((s: string) => s.startsWith('sg_'));
      });
    });

    describe('Select network by aepp', () => {
      it('rejected by user on wallet side', async () => {
        wallet.onAskToSelectNetwork = () => {
          throw new RpcRejectedByUserError();
        };
        await expect(aepp.askToSelectNetwork({ networkId: 'ae_test' }))
          .to.be.eventually.rejectedWith('Operation rejected by user')
          .with.property('code', 4);
        wallet.onAskToSelectNetwork = handlerReject;
      });

      it('rejected because unknown network id', async () => {
        wallet.onAskToSelectNetwork = () => {
          throw new RpcNoNetworkById('test');
        };
        await expect(aepp.askToSelectNetwork({ networkId: 'ae_test' }))
          .to.be.eventually.rejectedWith('Wallet can\'t find a network by id "test"')
          .with.property('code', 13);
        wallet.onAskToSelectNetwork = handlerReject;
      });

      it('works', async () => {
        let args: unknown[] = [];
        wallet.onAskToSelectNetwork = (...a) => {
          args = a;
        };
        const payload = { nodeUrl: 'http://example.com' };
        await aepp.askToSelectNetwork(payload);
        wallet.onAskToSelectNetwork = handlerReject;
        expect(args.slice(1)).to.be.eql([payload, 'http://origin.test']);
      });
    });

    it('Sign and broadcast invalid transaction', async () => {
      const tx = await aepp.buildTx({
        tag: Tag.SpendTx,
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
        ttl: 1,
        absoluteTtl: true,
      });

      await expect(aepp.sendTransaction(tx)).to.be.rejectedWith(
        'Transaction verification errors: TTL 1 is already expired, current height is',
      );
    });

    describe('Subscriptions', () => {
      it('Add new account to wallet: receive notification for update accounts', async () => {
        assertNotNull(aepp._accounts);
        const connectedLength = Object.keys(aepp._accounts.connected).length;
        const accountsPromise = new Promise<Accounts>((resolve) => {
          aepp.onAddressChange = resolve;
        });
        wallet.addAccount(MemoryAccount.generate());
        expect(Object.keys((await accountsPromise).connected).length).to.equal(connectedLength + 1);
      });

      it('Receive update for wallet select account', async () => {
        assertNotNull(aepp._accounts);
        const connectedAccount = Object.keys(aepp._accounts.connected)[0] as Encoded.AccountAddress;
        const accountsPromise = new Promise<Accounts>((resolve) => {
          aepp.onAddressChange = resolve;
        });
        wallet.selectAccount(connectedAccount);
        const { connected, current } = await accountsPromise;
        expect(current[connectedAccount]).to.be.eql({});
        expect(Object.keys(connected).includes(connectedAccount)).to.be.equal(false);
      });

      it('Aepp: receive notification for network update', async () => {
        const message = await new Promise<Network>((resolve) => {
          aepp.onNetworkChange = (msg) => resolve(msg);
          wallet.addNode('second_node', node, true);
        });
        message.networkId.should.be.equal(networkId);
        expect(wallet.selectedNodeName).to.be.equal('second_node');
      });
    });

    it('Try to connect unsupported protocol', async () => {
      assertNotNull(aepp.rpcClient);
      await expect(
        aepp.rpcClient.request(METHODS.connect, {
          name: 'test-aepp',
          version: 2 as 1,
          connectNode: false,
        }),
      )
        .to.be.eventually.rejectedWith('Unsupported Protocol Version')
        .with.property('code', 5);
    });

    describe('Disconnect', () => {
      it('Disconnect from wallet', async () => {
        const walletDisconnect: Promise<any> = new Promise((resolve) => {
          wallet.onDisconnect = (...args: any) => resolve(args);
        });
        const aeppDisconnect: Promise<any> = new Promise((resolve) => {
          aepp.onDisconnect = (...args: any) => resolve(args);
        });
        connectionFromWalletToAepp.sendMessage({
          method: METHODS.closeConnection,
          params: { reason: 'bye' },
          jsonrpc: '2.0',
        });
        const [aeppMessage] = await aeppDisconnect;
        aeppMessage.reason.should.be.equal('bye');
        connectionFromAeppToWallet.sendMessage({
          method: METHODS.closeConnection,
          params: { reason: 'bye' },
          jsonrpc: '2.0',
        });
        const [, walletMessage] = await walletDisconnect;
        walletMessage.reason.should.be.equal('bye');
      });

      it('Remove rpc client', async () => {
        wallet.onConnection = () => {};
        const id = wallet.addRpcClient(
          new BrowserWindowMessageConnection({
            self: connections.walletWindow,
            target: connections.aeppWindow,
          }),
        );
        await aepp.connectToWallet(
          new BrowserWindowMessageConnection({
            self: connections.aeppWindow,
            target: connections.walletWindow,
          }),
        );

        wallet.removeRpcClient(id);
        Array.from(wallet._clients.keys()).length.should.be.equal(0);
      });

      it('Remove rpc client: client not found', () => {
        expect(() => wallet.removeRpcClient('a1')).to.throw(
          UnknownRpcClientError,
          'RpcClient with id a1 do not exist',
        );
      });
    });
  });

  describe('Rpc helpers', () => {
    after(async () => {
      connectionFromAeppToWallet.disconnect();
    });

    it('Send message from content script', async () => {
      connectionFromWalletToAepp.sendDirection = MESSAGE_DIRECTION.to_aepp;
      const ok = await new Promise<boolean>((resolve) => {
        connectionFromAeppToWallet.connect(
          (msg: any) => {
            msg.method.should.be.equal('hey');
            resolve(true);
          },
          () => {},
        );
        connectionFromWalletToAepp.sendMessage({ jsonrpc: '2.0', method: 'hey' });
      });
      ok.should.be.equal(true);
    });
  });

  describe('New RPC Wallet-AEPP: Bind wallet node to AEPP', () => {
    let aepp: AeSdkAepp;
    let wallet: AeSdkWallet;

    before(async () => {
      wallet = new AeSdkWallet({
        nodes: [{ name: 'local', instance: node }],
        accounts: [account],
        id: 'test',
        type: WALLET_TYPE.window,
        name: 'Wallet',
        onConnection() {},
        onSubscription: handlerReject,
        onAskAccounts: handlerReject,
        onAskToSelectNetwork: handlerReject,
        onDisconnect() {},
      });
      aepp = new AeSdkAepp({
        name: 'AEPP',
        onNetworkChange() {},
        onAddressChange() {},
        onDisconnect() {},
      });
      wallet.addRpcClient(connectionFromWalletToAepp);
      await aepp.connectToWallet(connectionFromAeppToWallet, {
        connectNode: true,
        name: 'wallet-node',
      });
    });

    it('Subscribe to address: wallet accept', async () => {
      wallet.onSubscription = () => {};
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.unsubscribe, 'connected');
      const subscriptionResponse = await aepp.subscribeAddress(
        SUBSCRIPTION_TYPES.subscribe,
        'connected',
      );
      subscriptionResponse.subscription.should.be.an('array');
    });

    it('Sign by wallet and broadcast transaction by aepp ', async () => {
      const acc = wallet._resolveAccount();
      const s = stub(acc, 'signTransaction').callsFake(async (txIgnore, options) => {
        const txReplace = await aepp.buildTx({
          tag: Tag.SpendTx,
          senderId: aepp.address,
          recipientId: aepp.address,
          amount: 0,
          payload: encode(Buffer.from('zerospend2'), Encoding.Bytearray),
        });
        return MemoryAccount.prototype.signTransaction.call(acc, txReplace, options);
      });
      const tx = await aepp.buildTx({
        tag: Tag.SpendTx,
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
        payload: encode(Buffer.from('zerospend'), Encoding.Bytearray),
      });
      const res = await aepp.sendTransaction(tx);
      s.restore();
      assertNotNull(res.tx?.payload);
      decode(res.tx.payload as Encoded.Any)
        .toString()
        .should.be.equal('zerospend2');
      assertNotNull(res.blockHeight);
      res.blockHeight.should.be.a('number');
    });

    it('Aepp: receive notification with node for network update', async () => {
      const message = await new Promise<Network>((resolve) => {
        aepp.onNetworkChange = (msg) => resolve(msg);
        wallet.addNode('second_node', node, true);
      });
      message.networkId.should.be.equal(networkId);
      assertNotNull(message.node);
      message.node.should.be.an('object');
      expect(wallet.selectedNodeName).to.be.equal('second_node');
    });
  });
});
