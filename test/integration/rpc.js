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

import { before, describe, it, after } from 'mocha'
import { expect } from 'chai'
import {
  MemoryAccount,
  Node,
  RpcAepp,
  RpcConnectionDenyError,
  RpcRejectedByUserError,
  RpcWallet,
  TX_TYPE,
  WALLET_TYPE
} from '../../src'
import { concatBuffers } from '../../src/utils/other'
import { unpackTx } from '../../src/tx/builder'
import { decode } from '../../src/tx/builder/helpers'
import BrowserWindowMessageConnection from '../../src/utils/aepp-wallet-communication/connection/BrowserWindowMessage'
import { METHODS, RPC_STATUS } from '../../src/utils/aepp-wallet-communication/schema'
import { generateKeyPair, verify, hash } from '../../src/utils/crypto'
import { compilerUrl, account, networkId, url, ignoreVersion, spendPromise } from './'
import {
  NoWalletConnectedError, UnAuthorizedAccountError, UnsubscribedAccountError, UnknownRpcClientError
} from '../../src/utils/errors'

const WindowPostMessageFake = (name) => ({
  name,
  messages: [],
  addEventListener (onEvent, listener) {
    this.listener = listener
  },
  removeEventListener () {
    return () => null
  },
  postMessage (source, msg) {
    this.messages.push(msg)
    setTimeout(() => {
      if (typeof this.listener === 'function') {
        this.listener({ data: msg, origin: 'testOrigin', source })
      }
    })
  }
})

const getConnections = () => {
  global.chrome = { runtime: {} }
  global.window = { location: { origin: '//test' }, chrome: global.chrome }
  global.location = { protocol: 'http://test.com' }
  const walletWindow = WindowPostMessageFake('wallet')
  const aeppWindow = WindowPostMessageFake('aepp')
  walletWindow.postMessage = walletWindow.postMessage.bind(walletWindow, aeppWindow)
  aeppWindow.postMessage = aeppWindow.postMessage.bind(aeppWindow, walletWindow)
  return { walletWindow, aeppWindow }
}

describe('Aepp<->Wallet', function () {
  this.timeout(2000)
  const node = new Node(url, { ignoreVersion })
  const connections = getConnections()
  const connectionFromWalletToAepp = new BrowserWindowMessageConnection({
    self: connections.walletWindow,
    target: connections.aeppWindow
  })
  const connectionFromAeppToWallet = new BrowserWindowMessageConnection({
    self: connections.aeppWindow,
    target: connections.walletWindow
  })
  const handlerReject = () => { throw new Error('test reject') }

  describe('New RPC Wallet-AEPP: AEPP node', () => {
    const keypair = generateKeyPair()
    let aepp
    let wallet

    before(async () => {
      await spendPromise
      wallet = await RpcWallet({
        compilerUrl,
        accounts: [
          MemoryAccount({ keypair: account }), MemoryAccount({ keypair: generateKeyPair() })
        ],
        nodes: [{ name: 'local', instance: node }],
        id: 'test',
        type: WALLET_TYPE.window,
        name: 'Wallet',
        onConnection: handlerReject,
        onSubscription: handlerReject,
        onSign: handlerReject,
        onAskAccounts: handlerReject,
        onMessageSign: handlerReject,
        onDisconnect () {}
      })
      aepp = await RpcAepp({
        name: 'AEPP',
        nodes: [{ name: 'test', instance: node }],
        onNetworkChange () {},
        onAddressChange () {},
        onDisconnect () {}
      })
    })

    it('Fail on not connected', async () => {
      await Promise.all(
        ['send', 'subscribeAddress', 'askAddresses', 'address']
          .map(method => expect(aepp[method]()).to.be.rejectedWith(NoWalletConnectedError, 'You are not connected to Wallet'))
      )
      expect(() => aepp.disconnectWallet()).to.throw(NoWalletConnectedError, 'You are not connected to Wallet')
    })

    it('Should receive `announcePresence` message from wallet', async () => {
      const isReceived = new Promise((resolve) => {
        connections.aeppWindow.addEventListener('message', (msg) => {
          resolve(msg.data.method === 'connection.announcePresence')
        })
      })

      const clientId = wallet.addRpcClient(connectionFromWalletToAepp)
      Array.from(wallet._clients.keys()).length.should.be.equal(1)
      await wallet.shareWalletInfo(clientId)
      const is = await isReceived
      is.should.be.equal(true)
    })

    it('AEPP connect to wallet: wallet reject connection', async () => {
      wallet.onConnection = () => {
        throw new RpcConnectionDenyError()
      }
      await expect(aepp.connectToWallet(connectionFromAeppToWallet)).to.be.eventually
        .rejectedWith('Wallet deny your connection request')
        .with.property('code', 9)
    })

    it('AEPP connect to wallet: wallet accept connection', async () => {
      wallet.onConnection = () => {}
      connectionFromAeppToWallet.disconnect()
      const connected = await aepp.connectToWallet(connectionFromAeppToWallet)

      connected.name.should.be.equal('Wallet')
    })

    it('Try to get address from wallet: not subscribed for account', async () => {
      await expect(aepp.address()).to.be.rejectedWith(UnsubscribedAccountError, 'You are not subscribed for an account.')
    })

    it('Try to ask for address', async () => {
      await expect(aepp.askAddresses()).to.be.rejectedWith(UnsubscribedAccountError, 'You are not subscribed for an account.')
    })

    it('Try to sign and send transaction to wallet without subscription', async () => {
      wallet.getAccounts().should.be.an('object')
      await Promise.all([aepp.signTransaction('tx_asdasd'), aepp.send('tx_asdasd')]
        .map((promise) => expect(promise).to.be.rejectedWith(UnsubscribedAccountError, 'You are not subscribed for an account.')))
    })

    it('Subscribe to address: wallet reject', async () => {
      wallet.onSubscription = () => {
        throw new RpcRejectedByUserError()
      }
      await expect(aepp.subscribeAddress('subscribe', 'connected')).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4)
    })

    it('Subscribe to address: wallet accept', async () => {
      wallet.onSubscription = () => {}
      await aepp.subscribeAddress('subscribe', 'connected')
      await aepp.subscribeAddress('unsubscribe', 'connected')
      const subscriptionResponse = await aepp.subscribeAddress('subscribe', 'connected')

      subscriptionResponse.subscription.should.be.an('array')
      subscriptionResponse.subscription.filter(e => e === 'connected').length.should.be.equal(1)
      subscriptionResponse.address.current.should.be.an('object')
      Object.keys(subscriptionResponse.address.current)[0].should.be.equal(account.publicKey)
      subscriptionResponse.address.connected.should.be.an('object')
      Object.keys(subscriptionResponse.address.connected).length.should.be.equal(1)
    })

    it('Try to use `onAccount` for not existent account', async () => {
      const { publicKey } = generateKeyPair()
      await expect(aepp.spend(100, publicKey, { onAccount: publicKey }))
        .to.be.rejectedWith(UnAuthorizedAccountError, `You do not have access to account ${publicKey}`)
    })

    it('aepp accepts key pairs in onAccount', async () => {
      await aepp.spend(100, await aepp.address(), { onAccount: account })
    })

    it('Get address: subscribed for accounts', async () => {
      (await aepp.address()).should.be.equal(account.publicKey)
    })

    it('Ask for address: subscribed for accounts -> wallet deny', async () => {
      wallet.onAskAccounts = () => {
        throw new RpcRejectedByUserError()
      }
      await expect(aepp.askAddresses()).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4)
    })

    it('Ask for address: subscribed for accounts -> wallet accept', async () => {
      wallet.onAskAccounts = () => {}
      const addressees = await aepp.askAddresses()
      addressees.length.should.be.equal(2)
      addressees[0].should.be.equal(account.publicKey)
    })

    it('Not authorize', async () => {
      const clientInfo = Array.from(wallet._clients.entries())[0][1]
      clientInfo.status = RPC_STATUS.DISCONNECTED
      await expect(aepp.askAddresses()).to.be.eventually
        .rejectedWith('You are not connected to the wallet')
        .with.property('code', 10)
      clientInfo.status = RPC_STATUS.CONNECTED
    })

    it('Sign transaction: wallet deny', async () => {
      wallet.onSign = () => {
        throw new RpcRejectedByUserError()
      }
      const address = await aepp.address()
      const tx = await aepp.buildTx(TX_TYPE.spend, {
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })
      await expect(aepp.signTransaction(tx)).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4)
    })

    it('Sign transaction: invalid account object in action', async () => {
      wallet.onSign = () => ({ onAccount: {} })
      const tx = await aepp.buildTx(TX_TYPE.spend, {
        senderId: keypair.publicKey,
        recipientId: keypair.publicKey,
        amount: 0,
        payload: 'zerospend'
      })
      await expect(aepp.signTransaction(tx, { onAccount: account.publicKey }))
        .to.be.rejectedWith('The peer failed to execute your request due to unknown error')
    })

    it('Sign transaction: wallet allow', async () => {
      wallet.onSign = () => {}
      const address = await aepp.address()
      const tx = await aepp.buildTx(TX_TYPE.spend, {
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })

      const signedTx = await aepp.signTransaction(tx)
      const { tx: { signatures: [signature], encodedTx: { rlpEncoded } } } = unpackTx(signedTx)
      const txWithNetwork = concatBuffers([Buffer.from(networkId), hash(rlpEncoded)])
      const valid = verify(txWithNetwork, signature, decode(address))
      valid.should.be.equal(true)
    })

    it('Try to sign using unpermited account', async () => {
      const { publicKey: pub } = generateKeyPair()
      await expect(aepp.rpcClient.request(
        METHODS.sign, {
          tx: 'tx_+NkLAfhCuECIIeWttRUiZ32uriBdmM1t+dCg90KuG2ABxOiuXqzpAul6uTWvsyfx3EFJDah6trudrityh+6XSX3mkPEimhgGuJH4jzIBoQELtO15J/l7UeG8teE0DRIzWyorEsi8UiHWPEvLOdQeYYgbwW1nTsgAAKEB6bv2BOYRtUYKOzmZ6Xcbb2BBfXPOfFUZ4S9+EnoSJcqIG8FtZ07IAACIAWNFeF2KAAAKAIYSMJzlQADAoDBrIcoop8JfZ4HOD9p3nDTiNthj7jjl+ArdHwEMUrvQgitwOr/v3Q==',
          onAccount: pub,
          returnSigned: true
        }
      )).to.be.eventually.rejectedWith(`You are not subscribed for account ${pub}`)
        .with.property('code', 11)
    })

    it('Sign by wallet and broadcast transaction by aepp ', async () => {
      const address = await aepp.address()
      wallet.onSign = () => ({ tx: tx2 })
      const tx2 = await aepp.buildTx(TX_TYPE.spend, {
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend2'
      })
      const tx = await aepp.buildTx(TX_TYPE.spend, {
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })
      const res = await aepp.send(tx)
      decode(res.tx.payload).toString().should.be.equal('zerospend2')
      res.blockHeight.should.be.a('number')
    })

    it('Sign message: rejected', async () => {
      wallet.onMessageSign = () => {
        throw new RpcRejectedByUserError()
      }
      await expect(aepp.signMessage('test')).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4)
    })

    it('Sign message', async () => {
      wallet.onMessageSign = () => {}
      const messageSig = await aepp.signMessage('test')
      messageSig.should.be.instanceof(Buffer)
      const isValid = await aepp.verifyMessage('test', messageSig)
      isValid.should.be.equal(true)
    })

    it('Sign message using custom account', async () => {
      wallet.onMessageSign = (aeppId, params) => {
        if (params.onAccount === account.publicKey) {
          return { onAccount: MemoryAccount({ keypair: account }) }
        }
      }
      const onAccount = account.publicKey
      const messageSig = await aepp.signMessage('test', { onAccount })
      messageSig.should.be.instanceof(Buffer)
      const isValid = await aepp.verifyMessage('test', messageSig, { onAccount })
      isValid.should.be.equal(true)
    })

    it('Sign and broadcast invalid transaction', async () => {
      wallet.onSign = () => {}
      const address = await aepp.address()
      const tx = await aepp.buildTx(TX_TYPE.spend, {
        senderId: address,
        recipientId: address,
        amount: 0,
        fee: '123',
        payload: 'zerospend'
      })

      await expect(aepp.send(tx)).to.be
        .rejectedWith('Transaction verification errors: Fee 123 is too low, minimum fee for this transaction is 16840000000000')
    })

    it('Add new account to wallet: receive notification for update accounts', async () => {
      const connectedLength = Object.keys(aepp._accounts.connected).length
      const accountsPromise = new Promise((resolve) => { aepp.onAddressChange = resolve })
      await wallet.addAccount(MemoryAccount({ keypair: generateKeyPair() }))
      expect(Object.keys((await accountsPromise).connected).length).to.equal(connectedLength + 1)
    })

    it('Receive update for wallet select account', async () => {
      const connectedAccount = Object.keys(aepp._accounts.connected)[0]
      const accountsPromise = new Promise((resolve) => { aepp.onAddressChange = resolve })
      wallet.selectAccount(connectedAccount)
      const { connected, current } = await accountsPromise
      expect(current[connectedAccount]).to.be.eql({})
      expect(Object.keys(connected).includes(connectedAccount)).to.be.equal(false)
    })

    it('Aepp: receive notification for network update', async () => {
      const msg = await new Promise((resolve) => {
        aepp.onNetworkChange = (msg) => resolve(msg)
        wallet.addNode('second_node', node, true)
      })
      msg.networkId.should.be.equal(networkId)
      expect(wallet.selectedNodeName).to.be.equal('second_node')
    })

    it('Try to connect unsupported protocol', async () => {
      await expect(aepp.rpcClient.request(
        METHODS.connect, { name: 'test-aepp', version: 2 }
      )).to.be.eventually.rejectedWith('Unsupported Protocol Version').with.property('code', 5)
    })

    it('Disconnect from wallet', async () => {
      const walletDisconnect = new Promise((resolve) => {
        wallet.onDisconnect = (...args) => resolve(args)
      })
      const aeppDisconnect = new Promise((resolve) => {
        aepp.onDisconnect = (...args) => resolve(args)
      })
      connectionFromWalletToAepp.sendMessage({
        method: METHODS.closeConnection, params: { reason: 'bye' }, jsonrpc: '2.0'
      })
      const [aeppMessage] = await aeppDisconnect
      aeppMessage.reason.should.be.equal('bye')
      connectionFromAeppToWallet.sendMessage({
        method: METHODS.closeConnection, params: { reason: 'bye' }, jsonrpc: '2.0'
      })
      const [, walletMessage] = await walletDisconnect
      walletMessage.reason.should.be.equal('bye')
    })

    it('Remove rpc client', async () => {
      wallet.onConnection = () => {}
      const id = wallet.addRpcClient(new BrowserWindowMessageConnection({
        self: connections.walletWindow,
        target: connections.aeppWindow
      }))
      await aepp.connectToWallet(
        new BrowserWindowMessageConnection({
          self: connections.aeppWindow,
          target: connections.walletWindow
        })
      )

      wallet.removeRpcClient(id)
      Array.from(wallet._clients.keys()).length.should.be.equal(0)
    })

    it('Remove rpc client: client not found', () => {
      expect(() => wallet.removeRpcClient('a1')).to.throw(UnknownRpcClientError, 'RpcClient with id a1 do not exist')
    })
  })

  describe('Rpc helpers', () => {
    after(async () => {
      connectionFromAeppToWallet.disconnect()
    })

    it('Send message from content script', async () => {
      connectionFromWalletToAepp.sendDirection = 'to_aepp'
      const ok = await new Promise((resolve) => {
        connectionFromAeppToWallet.connect((msg) => {
          msg.method.should.be.equal('hey')
          resolve(true)
        }, () => {})
        connectionFromWalletToAepp.sendMessage({ method: 'hey' })
      })
      ok.should.be.equal(true)
    })
  })

  describe('New RPC Wallet-AEPP: Bind wallet node to AEPP', () => {
    const keypair = generateKeyPair()
    let aepp
    let wallet

    before(async () => {
      wallet = await RpcWallet({
        compilerUrl,
        accounts: [MemoryAccount({ keypair: account })],
        nodes: [{ name: 'local', instance: node }],
        id: 'test',
        type: WALLET_TYPE.window,
        name: 'Wallet',
        onConnection () {},
        onSubscription: handlerReject,
        onSign: handlerReject,
        onAskAccounts: handlerReject,
        onMessageSign: handlerReject,
        onDisconnect () {}
      })
      aepp = await RpcAepp({
        name: 'AEPP',
        onNetworkChange () {},
        onAddressChange () {},
        onDisconnect () {}
      })
      wallet.addRpcClient(connectionFromWalletToAepp)
      await aepp.connectToWallet(
        connectionFromAeppToWallet,
        { connectNode: true, name: 'wallet-node', select: true }
      )
    })

    it('Subscribe to address: wallet accept', async () => {
      const accounts = {
        connected: { [keypair.publicKey]: {} },
        current: wallet.addresses().reduce((acc, v) => ({ ...acc, [v]: {} }), {})
      }
      wallet.onSubscription = () => accounts
      await aepp.subscribeAddress('subscribe', 'connected')
      await aepp.subscribeAddress('unsubscribe', 'connected')
      const subscriptionResponse = await aepp.subscribeAddress('subscribe', 'connected')

      subscriptionResponse.subscription.should.be.an('array')
      subscriptionResponse.subscription.filter(e => e === 'connected').length.should.be.equal(1)
      subscriptionResponse.address.current.should.be.an('object')
      Object.keys(subscriptionResponse.address.current)[0].should.be.equal(account.publicKey)
      subscriptionResponse.address.connected.should.be.an('object')
      Object.keys(subscriptionResponse.address.connected).length.should.be.equal(0)
    })

    it('Sign by wallet and broadcast transaction by aepp ', async () => {
      const address = await aepp.address()
      wallet.onSign = () => ({ tx: tx2 })
      const tx2 = await aepp.buildTx(TX_TYPE.spend, {
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend2'
      })
      const tx = await aepp.buildTx(TX_TYPE.spend, {
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })
      const res = await aepp.send(tx)
      decode(res.tx.payload).toString().should.be.equal('zerospend2')
      res.blockHeight.should.be.a('number')
    })

    it('Aepp: receive notification with node for network update', async () => {
      const msg = await new Promise((resolve) => {
        aepp.onNetworkChange = (msg) => resolve(msg)
        wallet.addNode('second_node', node, true)
      })
      msg.networkId.should.be.equal(networkId)
      msg.node.should.be.an('object')
      expect(wallet.selectedNodeName).to.be.equal('second_node')
    })
  })
})
