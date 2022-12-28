/*
 * ISC License (ISC)
 * Copyright (c) 2022 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

import {
  after, before, describe, it,
} from 'mocha';
import { expect } from 'chai';
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
  SUBSCRIPTION_TYPES,
  Tag,
  WALLET_TYPE,
  unpackTx,
  decode,
  MESSAGE_DIRECTION,
  METHODS,
  RPC_STATUS,
  generateKeyPair,
  hash,
  verify,
  NoWalletConnectedError,
  UnAuthorizedAccountError,
  UnexpectedTsError,
  UnknownRpcClientError,
  UnsubscribedAccountError,
  AccountBase,
  verifyMessage,
  buildTx,
} from '../../src';
import { concatBuffers } from '../../src/utils/other';
import { ImplPostMessage } from '../../src/aepp-wallet-communication/connection/BrowserWindowMessage';
import {
  getSdk, ignoreVersion, networkId, url, compilerUrl,
} from '.';
import { Accounts, Network } from '../../src/aepp-wallet-communication/rpc/types';
import { encode, Encoded, Encoding } from '../../src/utils/encoder';

const WindowPostMessageFake = (
  name: string,
): ImplPostMessage & { name: string; messages: any[] } => ({
  name,
  messages: [],
  addEventListener(onEvent: string, listener: any) {
    this.listener = listener;
  },
  removeEventListener() {
    return () => null;
  },
  postMessage(source: any, msg: any) {
    this.messages.push(msg);
    setTimeout(() => {
      if (typeof this.listener === 'function') {
        this.listener({ data: msg, origin: 'http://origin.test', source });
      }
    });
  },
});

const getConnections = (): { walletWindow: ImplPostMessage; aeppWindow: ImplPostMessage } => {
  // @ts-expect-error workaround for tests
  global.window = { location: { origin: '//test' } };
  const walletWindow = WindowPostMessageFake('wallet');
  const aeppWindow = WindowPostMessageFake('aepp');
  walletWindow.postMessage = walletWindow.postMessage.bind(walletWindow, aeppWindow);
  aeppWindow.postMessage = aeppWindow.postMessage.bind(aeppWindow, walletWindow);
  return { walletWindow, aeppWindow };
};

describe('Aepp<->Wallet', function aeppWallet() {
  this.timeout(2000);
  const node = new Node(url, { ignoreVersion });
  const connections = getConnections();
  const connectionFromWalletToAepp = new BrowserWindowMessageConnection({
    self: connections.walletWindow,
    target: connections.aeppWindow,
  });
  const connectionFromAeppToWallet = new BrowserWindowMessageConnection({
    self: connections.aeppWindow,
    target: connections.walletWindow,
  });
  const handlerReject = (): void => { throw new Error('test reject'); };
  let account: AccountBase;

  describe('New RPC Wallet-AEPP: AEPP node', () => {
    const keypair = generateKeyPair();
    let aeSdk: AeSdk;
    let aepp: AeSdkAepp;
    let wallet: AeSdkWallet;

    before(async () => {
      aeSdk = await getSdk();
      [account] = Object.values(aeSdk.accounts);
      wallet = new AeSdkWallet({
        nodes: [{ name: 'local', instance: node }],
        accounts: [account, MemoryAccount.generate()],
        id: 'test',
        type: WALLET_TYPE.window,
        name: 'Wallet',
        onConnection: handlerReject,
        onSubscription: handlerReject,
        onAskAccounts: handlerReject,
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
      const contract = await aeSdk.initializeContract({
        sourceCode: 'contract Test =\n'
          + '  entrypoint getArg(x : int) = x',
      });
      await contract.$deploy([]);
      const aeppSdk = new AeSdkAepp({
        name: 'AEPP',
        nodes: [{ name: 'test', instance: node }],
        onCompiler: new CompilerHttp(compilerUrl),
      });
      const contractAepp = await aeppSdk.initializeContract<{ getArg: (a: number) => number }>({
        aci: contract._aci,
        address: contract.$options.address,
      });
      expect((await contractAepp.getArg(42)).decodedResult).to.be.equal(42n);
    });

    it('Fail on not connected', async () => {
      await Promise.all([
        aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'current'),
        aepp.askAddresses(),
      ].map((promise) => expect(promise).to.be.rejectedWith(NoWalletConnectedError, 'You are not connected to Wallet')));
      expect(() => aepp.disconnectWallet()).to.throw(NoWalletConnectedError, 'You are not connected to Wallet');
      expect(() => aepp.address).to.throw(NoWalletConnectedError, 'You are not connected to Wallet');
    });

    it('Should receive `announcePresence` message from wallet', async () => {
      const isReceived: any = new Promise((resolve) => {
        if (connections.aeppWindow.addEventListener == null) throw new UnexpectedTsError();
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
      await expect(aepp.connectToWallet(connectionFromAeppToWallet)).to.be.eventually
        .rejectedWith('Wallet deny your connection request')
        .with.property('code', 9);
    });

    it('AEPP connect to wallet: wallet accept connection', async () => {
      wallet.onConnection = () => {};
      connectionFromAeppToWallet.disconnect();
      const connected = await aepp.connectToWallet(connectionFromAeppToWallet);

      connected.name.should.be.equal('Wallet');
    });

    it('Try to get address from wallet: not subscribed for account', async () => {
      expect(() => aepp.address).to.throw(UnsubscribedAccountError, 'You are not subscribed for an account.');
    });

    it('Try to ask for address', async () => {
      await expect(aepp.askAddresses()).to.be.rejectedWith(UnsubscribedAccountError, 'You are not subscribed for an account.');
    });

    it('Try to sign and send transaction to wallet without subscription', async () => {
      wallet.getAccounts().should.be.an('object');
      await Promise.all([aepp.signTransaction('tx_asdasd'), aepp.send('tx_asdasd')]
        .map((promise) => expect(promise).to.be.rejectedWith(UnsubscribedAccountError, 'You are not subscribed for an account.')));
    });

    it('Subscribe to address: wallet reject', async () => {
      wallet.onSubscription = () => {
        throw new RpcRejectedByUserError();
      };
      await expect(aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected')).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4);
    });

    it('Subscribe to address: wallet accept', async () => {
      let checkPromise;
      wallet.onSubscription = (id, params, origin) => {
        checkPromise = Promise.resolve().then(() => {
          expect(id.split('-').length).to.be.equal(5);
          expect(params).to.be.eql({ type: 'subscribe', value: 'connected' });
          expect(origin).to.be.equal('http://origin.test');
        });
      };
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.unsubscribe, 'connected');
      const subscriptionResponse = await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');

      await checkPromise;
      subscriptionResponse.subscription.should.be.an('array');
      subscriptionResponse.subscription.filter((e) => e === 'connected').length.should.be.equal(1);
      subscriptionResponse.address.current.should.be.an('object');
      Object.keys(subscriptionResponse.address.current)[0].should.be.equal(account.address);
      subscriptionResponse.address.connected.should.be.an('object');
      Object.keys(subscriptionResponse.address.connected).length.should.be.equal(1);
    });

    it('Try to use `onAccount` for not existent account', () => {
      const { publicKey } = generateKeyPair();
      expect(() => {
        aepp.spend(100, publicKey, { onAccount: publicKey });
      }).to.throw(UnAuthorizedAccountError, `You do not have access to account ${publicKey}`);
    });

    it('aepp accepts key pairs in onAccount', async () => {
      await aepp.spend(100, aepp.address, { onAccount: account });
    });

    it('Get address: subscribed for accounts', async () => {
      expect(aepp.address).to.be.equal(account.address);
    });

    it('Ask for address: subscribed for accounts -> wallet deny', async () => {
      wallet.onAskAccounts = () => {
        throw new RpcRejectedByUserError();
      };
      await expect(aepp.askAddresses()).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4);
    });

    it('Ask for address: subscribed for accounts -> wallet accept', async () => {
      let checkPromise;
      wallet.onAskAccounts = (id, params, origin) => {
        checkPromise = Promise.resolve().then(() => {
          expect(id.split('-').length).to.be.equal(5);
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
      await expect(aepp.askAddresses()).to.be.eventually
        .rejectedWith('You are not connected to the wallet')
        .with.property('code', 10);
      clientInfo.status = RPC_STATUS.CONNECTED;
    });

    it('Sign transaction: wallet deny', async () => {
      let origin;
      wallet._resolveAccount().signTransaction = (tx, { aeppOrigin }) => {
        origin = aeppOrigin;
        throw new RpcRejectedByUserError();
      };
      const tx = await aepp.buildTx(Tag.SpendTx, {
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
      });
      await expect(aepp.signTransaction(tx)).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4);
      expect(origin).to.be.equal('http://origin.test');
    });

    it('Sign transaction: fails with unknown error', async () => {
      wallet._resolveAccount().signTransaction = () => {
        throw new Error('test');
      };
      const tx = await aepp.buildTx(Tag.SpendTx, {
        senderId: keypair.publicKey,
        recipientId: keypair.publicKey,
        amount: 0,
      });
      await expect(aepp.signTransaction(tx, { onAccount: account.address }))
        .to.be.rejectedWith('The peer failed to execute your request due to unknown error');
    });

    it('Sign transaction: wallet allow', async () => {
      // @ts-expect-error removes object property to restore the original behavior
      delete wallet._resolveAccount().signTransaction;
      const tx = await aepp.buildTx(Tag.SpendTx, {
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
      });

      const signedTx = await aepp.signTransaction(tx);
      const unpackedTx = unpackTx(signedTx, Tag.SignedTx);
      const { signatures: [signature], encodedTx } = unpackedTx;
      const txWithNetwork = concatBuffers([
        Buffer.from(networkId), hash(decode(buildTx(encodedTx))),
      ]);
      expect(verify(txWithNetwork, signature, aepp.address)).to.be.equal(true);
    });

    it('Try to sign using unpermited account', async () => {
      const { publicKey: pub } = generateKeyPair();
      if (aepp.rpcClient == null) throw new UnexpectedTsError();
      await expect(aepp.rpcClient.request(METHODS.sign, {
        tx: 'tx_+NkLAfhCuECIIeWttRUiZ32uriBdmM1t+dCg90KuG2ABxOiuXqzpAul6uTWvsyfx3EFJDah6trudrityh+6XSX3mkPEimhgGuJH4jzIBoQELtO15J/l7UeG8teE0DRIzWyorEsi8UiHWPEvLOdQeYYgbwW1nTsgAAKEB6bv2BOYRtUYKOzmZ6Xcbb2BBfXPOfFUZ4S9+EnoSJcqIG8FtZ07IAACIAWNFeF2KAAAKAIYSMJzlQADAoDBrIcoop8JfZ4HOD9p3nDTiNthj7jjl+ArdHwEMUrvQgitwOr/v3Q==',
        onAccount: pub,
        returnSigned: true,
        networkId,
      })).to.be.eventually.rejectedWith(`You are not subscribed for account ${pub}`)
        .with.property('code', 11);
    });

    it('Sign by wallet and broadcast transaction by aepp ', async () => {
      const acc = wallet._resolveAccount();
      acc.signTransaction = async (txIgnore, options) => {
        const txReplace = await aepp.buildTx(Tag.SpendTx, {
          senderId: aepp.address,
          recipientId: aepp.address,
          amount: 0,
          payload: encode(Buffer.from('zerospend2'), Encoding.Bytearray),
        });
        return MemoryAccount.prototype.signTransaction.call(acc, txReplace, options);
      };
      const tx = await aepp.buildTx(Tag.SpendTx, {
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
        payload: encode(Buffer.from('zerospend'), Encoding.Bytearray),
      });
      const res = await aepp.send(tx);
      if (res.tx?.payload == null || res.blockHeight == null) throw new UnexpectedTsError();
      decode(res.tx.payload as Encoded.Any).toString().should.be.equal('zerospend2');
      res.blockHeight.should.be.a('number');
    });

    it('Sign message: rejected', async () => {
      let origin;
      wallet._resolveAccount().signMessage = (message, { aeppOrigin } = {}) => {
        origin = aeppOrigin;
        throw new RpcRejectedByUserError();
      };
      await expect(aepp.signMessage('test')).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4);
      expect(origin).to.be.equal('http://origin.test');
    });

    it('Sign message', async () => {
      // @ts-expect-error removes object property to restore the original behavior
      delete wallet._resolveAccount().signMessage;
      const messageSig = await aepp.signMessage('test');
      messageSig.should.be.instanceof(Buffer);
      expect(verifyMessage('test', messageSig, aepp.address)).to.be.equal(true);
    });

    it('Sign message fails with unknown error', async () => {
      wallet._resolveAccount().signMessage = () => {
        throw new Error('test');
      };
      await expect(aepp.signMessage('test', { onAccount: account.address }))
        .to.be.rejectedWith('The peer failed to execute your request due to unknown error');
    });

    it('Sign message using specific account', async () => {
      const onAccount = wallet.addresses()[1];
      const messageSig = await aepp.signMessage('test', { onAccount });
      messageSig.should.be.instanceof(Buffer);
      expect(verifyMessage('test', messageSig, onAccount)).to.be.equal(true);
    });

    it('Sign and broadcast invalid transaction', async () => {
      // @ts-expect-error removes object property to restore the original behavior
      delete wallet._resolveAccount().signTransaction;
      const tx = await aepp.buildTx(Tag.SpendTx, {
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
        ttl: 1,
        absoluteTtl: true,
      });

      await expect(aepp.send(tx)).to.be
        .rejectedWith('Transaction verification errors: TTL 1 is already expired, current height is');
    });

    it('Add new account to wallet: receive notification for update accounts', async () => {
      if (aepp._accounts == null) throw new UnexpectedTsError();
      const connectedLength = Object.keys(aepp._accounts.connected).length;
      const accountsPromise = new Promise<Accounts>((resolve) => {
        aepp.onAddressChange = resolve;
      });
      wallet.addAccount(MemoryAccount.generate());
      expect(Object.keys((await accountsPromise).connected).length).to.equal(connectedLength + 1);
    });

    it('Receive update for wallet select account', async () => {
      if (aepp._accounts == null) throw new UnexpectedTsError();
      const connectedAccount = Object
        .keys(aepp._accounts.connected)[0] as Encoded.AccountAddress;
      const accountsPromise = new Promise<Accounts>((resolve) => {
        aepp.onAddressChange = resolve;
      });
      wallet.selectAccount(connectedAccount);
      const { connected, current } = await accountsPromise;
      if (current == null || connected == null) throw new UnexpectedTsError();
      expect(current[connectedAccount]).to.be.eql({});
      expect(Object.keys(connected).includes(connectedAccount)).to.be.equal(false);
    });

    it('Aepp: receive notification for network update', async () => {
      const message = await new Promise<Network>((resolve) => {
        aepp.onNetworkChange = (msg: any) => resolve(msg);
        wallet.addNode('second_node', node, true);
      });
      message.networkId.should.be.equal(networkId);
      expect(wallet.selectedNodeName).to.be.equal('second_node');
    });

    it('Try to connect unsupported protocol', async () => {
      if (aepp.rpcClient == null) throw new UnexpectedTsError();
      await expect(aepp.rpcClient.request(METHODS.connect, { name: 'test-aepp', version: 2 as 1, connectNode: false })).to.be.eventually.rejectedWith('Unsupported Protocol Version').with.property('code', 5);
    });

    it('Disconnect from wallet', async () => {
      const walletDisconnect: Promise<any> = new Promise((resolve) => {
        wallet.onDisconnect = (...args: any) => resolve(args);
      });
      const aeppDisconnect: Promise<any> = new Promise((resolve) => {
        aepp.onDisconnect = (...args: any) => resolve(args);
      });
      connectionFromWalletToAepp.sendMessage({
        method: METHODS.closeConnection, params: { reason: 'bye' }, jsonrpc: '2.0',
      });
      const [aeppMessage] = await aeppDisconnect;
      aeppMessage.reason.should.be.equal('bye');
      connectionFromAeppToWallet.sendMessage({
        method: METHODS.closeConnection, params: { reason: 'bye' }, jsonrpc: '2.0',
      });
      const [, walletMessage] = await walletDisconnect;
      walletMessage.reason.should.be.equal('bye');
    });

    it('Remove rpc client', async () => {
      wallet.onConnection = () => {};
      const id = wallet.addRpcClient(new BrowserWindowMessageConnection({
        self: connections.walletWindow,
        target: connections.aeppWindow,
      }));
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
      expect(() => wallet.removeRpcClient('a1')).to.throw(UnknownRpcClientError, 'RpcClient with id a1 do not exist');
    });
  });

  describe('Rpc helpers', () => {
    after(async () => {
      connectionFromAeppToWallet.disconnect();
    });

    it('Send message from content script', async () => {
      connectionFromWalletToAepp.sendDirection = MESSAGE_DIRECTION.to_aepp;
      const ok = await new Promise<boolean>((resolve) => {
        connectionFromAeppToWallet.connect((msg: any) => {
          msg.method.should.be.equal('hey');
          resolve(true);
        }, () => {});
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
        onDisconnect() {},
      });
      aepp = new AeSdkAepp({
        name: 'AEPP',
        onNetworkChange() {},
        onAddressChange() {},
        onDisconnect() {},
      });
      wallet.addRpcClient(connectionFromWalletToAepp);
      await aepp.connectToWallet(
        connectionFromAeppToWallet,
        { connectNode: true, name: 'wallet-node', select: true },
      );
    });

    it('Subscribe to address: wallet accept', async () => {
      wallet.onSubscription = () => {};
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
      await aepp.subscribeAddress(SUBSCRIPTION_TYPES.unsubscribe, 'connected');
      const subscriptionResponse = await aepp.subscribeAddress(SUBSCRIPTION_TYPES.subscribe, 'connected');
      subscriptionResponse.subscription.should.be.an('array');
    });

    it('Sign by wallet and broadcast transaction by aepp ', async () => {
      const acc = wallet._resolveAccount();
      acc.signTransaction = async (txIgnore, options) => {
        const txReplace = await aepp.buildTx(Tag.SpendTx, {
          senderId: aepp.address,
          recipientId: aepp.address,
          amount: 0,
          payload: encode(Buffer.from('zerospend2'), Encoding.Bytearray),
        });
        return MemoryAccount.prototype.signTransaction.call(acc, txReplace, options);
      };
      const tx = await aepp.buildTx(Tag.SpendTx, {
        senderId: aepp.address,
        recipientId: aepp.address,
        amount: 0,
        payload: encode(Buffer.from('zerospend'), Encoding.Bytearray),
      });
      const res = await aepp.send(tx);
      if (res.tx?.payload == null || res.blockHeight == null) throw new UnexpectedTsError();
      decode(res.tx.payload as Encoded.Any).toString().should.be.equal('zerospend2');
      res.blockHeight.should.be.a('number');
    });

    it('Aepp: receive notification with node for network update', async () => {
      const message = await new Promise<Network>((resolve) => {
        aepp.onNetworkChange = (msg) => resolve(msg);
        wallet.addNode('second_node', node, true);
      });
      message.networkId.should.be.equal(networkId);
      if (message.node == null) throw new UnexpectedTsError();
      message.node.should.be.an('object');
      expect(wallet.selectedNodeName).to.be.equal('second_node');
    });
  });
});
