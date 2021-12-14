/*
 * ISC License (ISC)
 * Copyright (c) 2021 aeternity developers
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

import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import { MemoryAccount, Node, RpcAepp, RpcWallet } from '../../src'
import { unpackTx } from '../../src/tx/builder'
import { decode } from '../../src/tx/builder/helpers'
import BrowserWindowMessageConnection from '../../src/utils/aepp-wallet-communication/connection/browser-window-message'
import { getBrowserAPI, getHandler } from '../../src/utils/aepp-wallet-communication/helpers'
import { METHODS, RPC_STATUS } from '../../src/utils/aepp-wallet-communication/schema'
import { generateKeyPair, verify, hash } from '../../src/utils/crypto'
import { compilerUrl, genesisAccount, internalUrl, networkId, publicKey, url, ignoreVersion } from './'
import {
  NoBrowserFoundError,
  NoWalletConnectedError,
  TypeError,
  UnAuthorizedAccountError,
  UnsubscribedAccountError,
  UnknownRpcClientError
} from '../../src/utils/errors'

describe('Aepp<->Wallet', function () {
  this.timeout(6000)
  let node
  let connections
  let connectionFromWalletToAepp
  let connectionFromAeppToWallet

  before(async function () {
    node = await Node({ url, internalUrl, ignoreVersion })
    connections = getConnections()
    connectionFromWalletToAepp = BrowserWindowMessageConnection({
      connectionInfo: { id: 'from_wallet_to_aepp' },
      self: connections.waelletConnection,
      target: connections.aeppConnection
    })
    connectionFromAeppToWallet = BrowserWindowMessageConnection({
      connectionInfo: { id: 'from_aepp_to_wallet' },
      self: connections.aeppConnection,
      target: connections.waelletConnection
    })
  })

  describe('New RPC Wallet-AEPP', () => {
    const keypair = generateKeyPair()
    let aepp
    let wallet

    before(async () => {
      wallet = await RpcWallet({
        compilerUrl: compilerUrl,
        accounts: [genesisAccount],
        nodes: [{ name: 'local', instance: node }],
        name: 'Wallet',
        onConnection (aepp, { accept, deny }) {
        },
        onSubscription (aepp, { accept, deny }) {
        },
        onSign (aepp, { accept, deny, params }) {
        },
        onAskAccounts (aepp, { accept, deny }) {
        },
        onMessageSign (message, { accept }) {
        },
        onDisconnect (message, client) {
          this.shareWalletInfo(
            connectionFromWalletToAepp.sendMessage.bind(connectionFromWalletToAepp)
          )
        }
      })
      aepp = await RpcAepp({
        name: 'AEPP',
        nodes: [{ name: 'test', instance: node }],
        onNetworkChange (params) {
        },
        onAddressChange: (addresses) => {
        },
        onDisconnect (a) {
        }
      })
    })

    it('Fail on not connected', async () => {
      await Promise.all(
        ['send', 'subscribeAddress', 'askAddresses', 'address', 'disconnectWallet']
          .map(method => expect(aepp[method]()).to.be.rejectedWith(NoWalletConnectedError, 'You are not connected to Wallet'))
      )
    })

    it('Should receive `announcePresence` message from wallet', async () => {
      const isReceived = new Promise((resolve, reject) => {
        connections.aeppConnection.addEventListener('message', (msg) => {
          resolve(msg.data.method === 'connection.announcePresence')
        })
      })

      wallet.addRpcClient(connectionFromWalletToAepp)
      await wallet.shareWalletInfo(
        connectionFromWalletToAepp.sendMessage.bind(connectionFromWalletToAepp)
      )
      const is = await isReceived
      is.should.be.equal(true)
    })

    it('AEPP connect to wallet: wallet reject connection', async () => {
      wallet.onConnection = (aepp, actions) => {
        actions.deny()
      }
      await expect(aepp.connectToWallet(connectionFromAeppToWallet)).to.be.eventually
        .rejectedWith('Wallet deny your connection request')
        .with.property('code', 9)
    })

    it('AEPP connect to wallet: wallet accept connection', async () => {
      wallet.onConnection = (aepp, actions) => {
        actions.accept()
      }
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
      wallet.onSubscription = (aepp, actions) => {
        actions.deny()
      }
      await expect(aepp.subscribeAddress('subscribe', 'connected')).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4)
    })

    it('Subscribe to address: invalid accounts', async () => {
      wallet.onSubscription = (aepp, actions) => {
        actions.accept({ accounts: {} })
      }
      await expect(aepp.subscribeAddress('subscribe', 'connected'))
        .to.be.rejectedWith('Invalid provided accounts object')
    })

    it('Subscribe to address: wallet accept', async () => {
      const accounts = {
        connected: { [keypair.publicKey]: {} },
        current: wallet.addresses().reduce((acc, v) => ({ ...acc, [v]: {} }), {})
      }
      wallet.onSubscription = (aepp, actions) => {
        actions.accept({ accounts })
      }
      await aepp.subscribeAddress('subscribe', 'connected')
      await aepp.subscribeAddress('unsubscribe', 'connected')
      const subscriptionResponse = await aepp.subscribeAddress('subscribe', 'connected')

      subscriptionResponse.subscription.should.be.an('array')
      subscriptionResponse.subscription.filter(e => e === 'connected').length.should.be.equal(1)
      subscriptionResponse.address.current.should.be.an('object')
      Object.keys(subscriptionResponse.address.current)[0].should.be.equal(publicKey)
      subscriptionResponse.address.connected.should.be.an('object')
      Object.keys(subscriptionResponse.address.connected).length.should.be.equal(1)
    })

    it('Try to use `onAccount` for not existent account', async () => {
      const { publicKey } = generateKeyPair()
      await expect(aepp.spend(100, publicKey, { onAccount: publicKey }))
        .to.be.rejectedWith(UnAuthorizedAccountError, `You do not have access to account ${publicKey}`)
    })

    it('Get address: subscribed for accounts', async () => {
      (await aepp.address()).should.be.equal(publicKey)
    })

    it('Ask for address: subscribed for accounts -> wallet deny', async () => {
      wallet.onAskAccounts = (aepp, actions) => {
        actions.deny()
      }
      await expect(aepp.askAddresses()).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4)
    })

    it('Ask for address: subscribed for accounts -> wallet accept', async () => {
      wallet.onAskAccounts = (aepp, actions) => {
        actions.accept()
      }
      const addressees = await aepp.askAddresses()
      addressees.length.should.be.equal(2)
      addressees[0].should.be.equal(publicKey)
    })

    it('Not authorize', async () => {
      const client = Object.entries(wallet.rpcClients)[0][1]
      client.updateInfo({ status: RPC_STATUS.DISCONNECTED })
      await expect(aepp.askAddresses()).to.be.eventually
        .rejectedWith('You are not connected to the wallet')
        .with.property('code', 10)
      client.updateInfo({ status: RPC_STATUS.CONNECTED })
    })

    it('Sign transaction: wallet deny', async () => {
      wallet.onSign = (aepp, action) => {
        action.deny()
      }
      const address = await aepp.address()
      const tx = await aepp.spendTx({
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })
      await expect(aepp.signTransaction(tx)).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4)
    })

    it('Sign transaction: invalid account object in action', async () => {
      wallet.onSign = (aepp, action) => {
        action.accept(null, { onAccount: {} })
      }
      const tx = await aepp.spendTx({
        senderId: keypair.publicKey,
        recipientId: keypair.publicKey,
        amount: 0,
        payload: 'zerospend'
      })
      await expect(aepp.signTransaction(tx, { onAccount: keypair.publicKey }))
        .to.be.rejectedWith('Provided onAccount should be an AccountBase')
    })

    it('Sign transaction: wallet allow', async () => {
      wallet.onSign = (aepp, action) => {
        action.accept()
      }
      const address = await aepp.address()
      const tx = await aepp.spendTx({
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })

      const signedTx = await aepp.signTransaction(tx)
      const { tx: { signatures: [signature], encodedTx: { rlpEncoded } } } = unpackTx(signedTx)
      const txWithNetwork = Buffer.concat([Buffer.from(networkId), hash(rlpEncoded)])
      const valid = verify(txWithNetwork, signature, decode(address))
      valid.should.be.equal(true)
    })

    it('Try to sing using unpermited account', async () => {
      const { publicKey: pub } = generateKeyPair()
      await expect(aepp.rpcClient.request(
        METHODS.aepp.sign, {
          tx: 'tx_+NkLAfhCuECIIeWttRUiZ32uriBdmM1t+dCg90KuG2ABxOiuXqzpAul6uTWvsyfx3EFJDah6trudrityh+6XSX3mkPEimhgGuJH4jzIBoQELtO15J/l7UeG8teE0DRIzWyorEsi8UiHWPEvLOdQeYYgbwW1nTsgAAKEB6bv2BOYRtUYKOzmZ6Xcbb2BBfXPOfFUZ4S9+EnoSJcqIG8FtZ07IAACIAWNFeF2KAAAKAIYSMJzlQADAoDBrIcoop8JfZ4HOD9p3nDTiNthj7jjl+ArdHwEMUrvQgitwOr/v3Q==',
          onAccount: pub,
          returnSigned: true
        }
      )).to.be.eventually.rejectedWith(`You are not subscribed for account ${pub}`)
        .with.property('code', 11)
    })

    it('Sign and broadcast transaction by wallet', async () => {
      const address = await aepp.address()
      const tx = await aepp.spendTx({
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })

      const { blockHeight } = await aepp.send(tx)
      blockHeight.should.be.a('number')
    })

    it('Sign by wallet and broadcast transaction by aepp ', async () => {
      const address = await aepp.address()
      wallet.onSign = (aepp, action) => {
        action.accept(tx2)
      }
      const tx2 = await aepp.spendTx({
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend2'
      })
      const tx = await aepp.spendTx({
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })
      const res = await aepp.send(tx, { walletBroadcast: false })
      decode(res.tx.payload).toString().should.be.equal('zerospend2')
      res.blockHeight.should.be.a('number')
    })

    it('Sign message: rejected', async () => {
      wallet.onMessageSign = (aepp, action) => {
        action.deny()
      }
      await expect(aepp.signMessage('test')).to.be.eventually
        .rejectedWith('Operation rejected by user').with.property('code', 4)
    })

    it('Sign message', async () => {
      wallet.onMessageSign = (aepp, action) => {
        action.accept()
      }
      const messageSig = await aepp.signMessage('test')
      messageSig.should.be.a('string')
      const isValid = await aepp.verifyMessage('test', messageSig)
      isValid.should.be.equal(true)
    })

    it('Sign message using account not from sdk instance: do not provide account', async () => {
      wallet.onMessageSign = (aepp, action) => {
        action.accept({})
      }
      const onAccount = aepp.addresses()[1]
      await expect(aepp.signMessage('test', { onAccount })).to.be.eventually
        .rejectedWith('Provided onAccount should be an AccountBase')
        .with.property('code', 12)
    })

    it('Sign message using account not from sdk instance', async () => {
      wallet.onMessageSign = (aepp, action) => {
        if (action.params.onAccount === keypair.publicKey) {
          action.accept({ onAccount: MemoryAccount({ keypair }) })
        }
      }
      const onAccount = keypair.publicKey
      const messageSig = await aepp.signMessage('test', { onAccount })
      messageSig.should.be.a('string')
      const isValid = await aepp.verifyMessage('test', messageSig, { onAccount })
      isValid.should.be.equal(true)
    })

    it('Sign and broadcast invalid transaction', async () => {
      wallet.onSign = (aepp, action) => {
        action.accept()
      }
      const address = await aepp.address()
      const tx = await aepp.spendTx({
        senderId: address,
        recipientId: address,
        amount: 0,
        fee: '123',
        payload: 'zerospend'
      })

      await expect(aepp.send(tx)).to.be.eventually
        .rejectedWith('Invalid transaction').with.property('code', 2)
    })

    it('Add new account to wallet: receive notification for update accounts', async () => {
      const keypair = generateKeyPair()
      const connectedLength = Object.keys(aepp.rpcClient.accounts.connected).length
      const received = await new Promise((resolve, reject) => {
        aepp.onAddressChange = (accounts) => {
          resolve(Object.keys(accounts.connected).length === connectedLength + 1)
        }
        wallet.addAccount(MemoryAccount({ keypair }))
      })
      received.should.be.equal(true)
    })

    it('Receive update for wallet select account', async () => {
      const connectedAccount = Object.keys(aepp.rpcClient.accounts.connected)[0]
      const received = await new Promise((resolve, reject) => {
        aepp.onAddressChange = ({ connected, current }) => {
          Object.hasOwnProperty.call(current, connectedAccount).should.be.equal(true)
          resolve(Object.keys(connected)[0] !== connectedAccount)
        }
        wallet.selectAccount(connectedAccount)
      })
      received.should.be.equal(true)
    })

    it('Aepp: receive notification for network update', async () => {
      const received = await new Promise((resolve, reject) => {
        aepp.onNetworkChange = (msg, from) => {
          msg.networkId.should.be.equal(networkId)
          resolve(wallet.selectedNode.name === 'second_node')
        }
        wallet.addNode('second_node', node, true)
      })
      received.should.be.equal(true)
    })

    it('RPC client set invalid account', () => {
      const current = aepp.rpcClient.getCurrentAccount()
      current.should.be.equal(aepp.rpcClient.currentAccount)
      aepp.rpcClient.origin.should.be.an('object')
      expect(() => aepp.rpcClient.setAccounts(true))
        .to.throw(TypeError, 'Invalid accounts object. Should be object like: `{ connected: {}, selected: {} }`')
    })

    it('Resolve/Reject callback for undefined message', async () => {
      expect(() => aepp.rpcClient.processResponse({ id: 0 }))
        .to.throw('Can\'t find callback for this messageId 0')
    })

    it('Try to connect unsupported protocol', async () => {
      await expect(aepp.rpcClient.request(
        METHODS.aepp.connect, {
          name: 'test-aepp',
          version: 2,
          networkId: aepp.getNetworkId()
        }
      )).to.be.eventually.rejectedWith('Unsupported Protocol Version').with.property('code', 5)
    })

    it.skip('Try to connect unsupported network', async () => {
      // TODO: fix this assertion
      await expect(aepp.rpcClient.request(
        METHODS.aepp.connect, {
          name: 'test-aepp',
          version: 1,
          networkId: 'ae_test'
        }
      )).to.be.eventually.rejectedWith('Unsupported Network').with.property('code', 8)
    })

    it('Process response ', () => {
      expect(() => aepp.rpcClient.processResponse({ id: 11, error: {} }))
        .to.throw('Can\'t find callback for this messageId ' + 11)
    })

    it('Disconnect from wallet', async () => {
      const received = await new Promise((resolve, reject) => {
        let received = false
        wallet.onDisconnect = (msg, from) => {
          msg.reason.should.be.equal('bye')
          from.info.status.should.be.equal('DISCONNECTED')
          if (received) resolve(true)
          received = true
        }
        aepp.onDisconnect = (msg) => {
          if (received) resolve(true)
          received = true
        }
        connectionFromWalletToAepp.sendMessage({
          method: METHODS.closeConnection, params: { reason: 'bye' }, jsonrpc: '2.0'
        })
      })
      received.should.be.equal(true)
    })

    it('Remove rpc client', async () => {
      wallet.onConnection = (aepp, actions) => {
        actions.accept()
      }
      const id = wallet.addRpcClient(BrowserWindowMessageConnection({
        connectionInfo: { id: 'from_wallet_to_aepp_2' },
        self: connections.waelletConnection,
        target: connections.aeppConnection
      }))
      await aepp.connectToWallet(BrowserWindowMessageConnection({
        connectionInfo: { id: 'from_aepp_to_wallet_2' },
        self: connections.aeppConnection,
        target: connections.waelletConnection
      }))

      wallet.removeRpcClient(id)
      Object.keys(wallet.rpcClients).length.should.be.equal(1)
    })

    it('Remove rpc client: client not found', () => {
      expect(() => wallet.removeRpcClient('a1')).to.throw(UnknownRpcClientError, 'RpcClient with id a1 do not exist')
    })
  })

  describe('Rpc helpers', () => {
    it('receive unknown method', async () => {
      (await getHandler({}, { method: 'hey' })()()).should.be.equal(true)
    })

    it('getBrowserAPI: not in browser', () => {
      global.window = {}
      expect(() => getBrowserAPI()).to.throw(NoBrowserFoundError, 'Browser is not detected')
    })

    it('getBrowserAPI: not in browser(force error)', () => {
      global.window = {}
      getBrowserAPI(true).should.be.an('object')
    })

    it('getBrowserAPI: chrome', () => {
      global.window = { location: { origin: '//test' }, chrome: { runtime: {}, chrome: true } }
      getBrowserAPI().chrome.should.be.equal(true)
    })

    it('getBrowserAPI: firefox', () => {
      global.window = { location: { origin: '//test' }, browser: { runtime: {}, firefox: true } }
      getBrowserAPI().firefox.should.be.equal(true)
    })
    it('Send message from content script', async () => {
      connectionFromWalletToAepp.disconnect()
      connectionFromWalletToAepp.sendDirection = 'to_aepp'
      const ok = await new Promise((resolve) => {
        connectionFromAeppToWallet.connect((msg) => {
          msg.method.should.be.equal('hey')
          resolve(true)
        })
        connectionFromWalletToAepp.sendMessage({ method: 'hey' })
      })
      ok.should.be.equal(true)
    })
  })
})

const WindowPostMessageFake = (name) => ({
  name,
  messages: [],
  addEventListener (onEvent, listener) {
    this.listener = listener
  },
  removeEventListener (onEvent, listener) {
    return () => null
  },
  postMessage (msg) {
    this.messages.push(msg)
    setTimeout(() => { if (typeof this.listener === 'function') this.listener({ data: msg, origin: 'testOrigin', source: this }) }, 0)
  }
})

const getFakeConnections = (direct = false) => {
  const waelletConnection = WindowPostMessageFake('wallet')
  const aeppConnection = WindowPostMessageFake('aepp')
  if (direct) {
    const waelletP = waelletConnection.postMessage
    const aeppP = aeppConnection.postMessage
    waelletConnection.postMessage = aeppP.bind(aeppConnection)
    aeppConnection.postMessage = waelletP.bind(waelletConnection)
  }
  return { waelletConnection, aeppConnection }
}

const getConnections = (direct) => {
  global.chrome = { runtime: {} }
  global.window = { location: { origin: '//test' }, chrome: global.chrome }
  global.location = { protocol: 'http://test.com' }
  return getFakeConnections(direct)
}
