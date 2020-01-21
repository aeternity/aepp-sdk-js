/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
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

import { Aepp, Wallet, Node, RpcWallet, RpcAepp } from '../../es'
import { compilerUrl, getFakeConnections, url, internalUrl, networkId } from './'

import { describe, it, before } from 'mocha'
import BrowserWindowMessageConnection from '../../es/utils/aepp-wallet-communication/connection/browser-window-message'
import { generateKeyPair, verify } from '../../es/utils/crypto'
import { decode } from '../../es/tx/builder/helpers'
import { unpackTx } from '../../es/tx/builder'
import MemoryAccount from '../../es/account/memory'
import {
  getBrowserAPI,
  getHandler,
  getWindow, isInIframe,
  message,
  receive
} from '../../es/utils/aepp-wallet-communication/helpers'
import { METHODS, RPC_STATUS } from '../../es/utils/aepp-wallet-communication/schema'

describe('Aepp<->Wallet', function () {
  this.timeout(6000)
  let node
  let connections
  let connectionFromWalletToAepp
  let connectionFromAeppToWallet

  before(async function () {
    node = await Node({ url, internalUrl })
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
    let aepp
    let wallet
    before(async () => {
      wallet = await RpcWallet({
        compilerUrl: compilerUrl,
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
        onDisconnect (message, client) {
          this.shareWalletInfo(connectionFromWalletToAepp.sendMessage.bind(connectionFromWalletToAepp))
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
      const errors = [
        await aepp.send().catch(e => e.message === 'You are not connected to Wallet'),
        await aepp.subscribeAddress().catch(e => e.message === 'You are not connected to Wallet'),
        await aepp.askAddresses().catch(e => e.message === 'You are not connected to Wallet'),
        await aepp.address().catch(e => e.message === 'You are not connected to Wallet'),
        await aepp.disconnectWallet().catch(e => e.message === 'You are not connected to Wallet')
      ]
      errors.filter(e => e).length.should.be.equal(5)
    })
    it('Should receive `announcePresence` message from wallet', async () => {
      const isReceived = new Promise((resolve, reject) => {
        connections.aeppConnection.addEventListener('message', (msg) => {
          resolve(msg.data.method === 'connection.announcePresence')
        })
      })

      wallet.addRpcClient(connectionFromWalletToAepp)
      await wallet.shareWalletInfo(connectionFromWalletToAepp.sendMessage.bind(connectionFromWalletToAepp))
      const is = await isReceived
      is.should.be.equal(true)
    })
    it('AEPP connect to wallet: wallet reject connection', async () => {
      wallet.onConnection = (aepp, actions) => {
        actions.deny()
      }
      try {
        await aepp.connectToWallet(connectionFromAeppToWallet)
      } catch (e) {
        e.code.should.be.equal(9)
        e.message.should.be.equal('Wallet deny your connection request')
      }
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
      try {
        await aepp.address()
      } catch (e) {
        e.message.should.be.equal('You do not subscribed for account.')
      }
    })
    it('Try to ask for address', async () => {
      try {
        await aepp.askAddresses()
      } catch (e) {
        e.message.should.be.equal('You do not subscribed for account.')
      }
    })
    it('Try to sign and send transaction to wallet without subscription', async () => {
      const errors = [
        await aepp.signTransaction('tx_asdasd').catch(e => e.message === 'You do not subscribed for account.'),
        await aepp.send('tx_asdasd').catch(e => e.message === 'You do not subscribed for account.')
      ]
      errors.filter(e => e).length.should.be.equal(2)
    })
    it('Subscribe to address: wallet reject', async () => {
      wallet.onSubscription = (aepp, actions) => {
        actions.deny()
      }
      try {
        await aepp.subscribeAddress('subscribe', 'connected')
      } catch (e) {
        e.code.should.be.equal(4)
        e.message.should.be.equal('Operation rejected by user')
      }
    })
    it('Subscribe to address: wallet accept', async () => {
      wallet.onSubscription = (aepp, actions) => {
        actions.accept()
      }
      await aepp.subscribeAddress('subscribe', 'connected')
      await aepp.subscribeAddress('unsubscribe', 'connected')
      const subscriptionResponse = await aepp.subscribeAddress('subscribe', 'connected')

      subscriptionResponse.subscription.should.be.an('array')
      subscriptionResponse.subscription.filter(e => e === 'connected').length.should.be.equal(1)
      subscriptionResponse.address.current.should.be.an('object')
      Object.keys(subscriptionResponse.address.current)[0].should.be.equal('ak_2a1j2Mk9YSmC1gioUq4PWRm3bsv887MbuRVwyv4KaUGoR1eiKi')
      subscriptionResponse.address.connected.should.be.an('object')
      Object.keys(subscriptionResponse.address.connected).length.should.be.equal(0)
    })
    it('Try to use `onAccount` for not existent account', async () => {
      try {
        const { publicKey } = generateKeyPair()
        await aepp.spend(100, publicKey, { onAccount: publicKey })
      } catch (e) {
        e.message.indexOf('You do not subscribed for connected account\'s').should.not.be.equal(-1)
      }
    })
    it('Get address: subscribed for accounts', async () => {
      (await aepp.address()).should.be.equal('ak_2a1j2Mk9YSmC1gioUq4PWRm3bsv887MbuRVwyv4KaUGoR1eiKi')
    })
    it('Ask for address: subscribed for accounts -> wallet deny', async () => {
      wallet.onAskAccounts = (aepp, actions) => {
        actions.deny()
      }
      try {
        await aepp.askAddresses()
      } catch (e) {
        e.code.should.be.equal(4)
        e.message.should.be.equal('Operation rejected by user')
      }
    })
    it('Ask for address: subscribed for accounts -> wallet accept', async () => {
      wallet.onAskAccounts = (aepp, actions) => {
        actions.accept()
      }
      const addressees = await aepp.askAddresses()
      addressees.length.should.be.equal(1)
      addressees[0].should.be.equal('ak_2a1j2Mk9YSmC1gioUq4PWRm3bsv887MbuRVwyv4KaUGoR1eiKi')
    })
    it('Not authorize', async () => {
      const rpcClients = wallet.getClients()
      const client = Array.from(rpcClients.clients.values())[0]
      rpcClients.updateClientInfo(client.id, { status: RPC_STATUS.DISCONNECTED })
      try {
        await aepp.askAddresses()
      } catch (e) {
        e.code.should.be.equal(10)
        e.message.should.be.equal('You are not connected to the wallet')
        rpcClients.updateClientInfo(client.id, { status: RPC_STATUS.CONNECTED })
      }
    })
    it('Sign transaction: wallet deny', async () => {
      wallet.onSign = (aepp, action) => {
        action.deny()
      }
      try {
        const address = await aepp.address()
        const tx = await aepp.spendTx({
          senderId: address,
          recipientId: address,
          amount: 0,
          payload: 'zerospend'
        })
        await aepp.signTransaction(tx)
      } catch (e) {
        e.code.should.be.equal(4)
        e.message.should.be.equal('Operation rejected by user')
      }
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
      const { tx: { signatures: [signature] } } = unpackTx(signedTx)
      const txWithNetwork = Buffer.concat([Buffer.from(networkId), decode(tx)])
      const valid = verify(txWithNetwork, signature, decode(address))
      valid.should.be.equal(true)
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
      const tx = await aepp.spendTx({
        senderId: address,
        recipientId: address,
        amount: 0,
        payload: 'zerospend'
      })

      const { blockHeight } = await aepp.send(tx, { walletBroadcast: false })
      blockHeight.should.be.a('number')
    })
    it('Sign and broadcast invalid transaction', async () => {
      const address = await aepp.address()
      const tx = await aepp.spendTx({
        senderId: address,
        recipientId: address,
        amount: 0,
        fee: '123',
        payload: 'zerospend'
      })

      try {
        await aepp.send(tx)
      } catch (e) {
        e.message.should.be.equal('Invalid transaction')
        e.code.should.be.equal(2)
      }
    })
    it('Add new account to wallet: receive notification for update accounts', async () => {
      const keypair = generateKeyPair()
      const received = await new Promise((resolve, reject) => {
        aepp.onAddressChange = ({ connected }) => {
          resolve(Object.keys(connected).length === 1)
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
    it('Resolve/Reject callback for undefined message', async () => {
      try {
        aepp.rpcClient.resolveCallback(0)
      } catch (e) {
        e.message.should.be.equal('Can\'t find callback for this messageId 0')
      }
      try {
        aepp.rpcClient.rejectCallback(0)
      } catch (e) {
        e.message.should.be.equal('Can\'t find callback for this messageId 0')
      }
    })
    it('Try to connect unsupported protocol', async () => {
      try {
        await aepp.rpcClient.addCallback(
          aepp.rpcClient.sendMessage(message(METHODS.aepp.connect, {
            name: 'test-aepp',
            version: 2,
            networkId: aepp.getNetworkId()
          }))
        )
      } catch (e) {
        e.code.should.be.equal(5)
        e.message.should.be.equal('Unsupported Protocol Version')
      }
    })
    it('Try to connect unsupported network', async () => {
      try {
        await aepp.rpcClient.addCallback(
          aepp.rpcClient.sendMessage(message(METHODS.aepp.connect, {
            name: 'test-aepp',
            version: 1,
            networkId: 'ae_test'
          }))
        )
      } catch (e) {
        e.code.should.be.equal(8)
        e.message.should.be.equal('Unsupported Network')
      }
    })
    it('Try to connect unsupported network', async () => {
      try {
        await aepp.rpcClient.addCallback(
          aepp.rpcClient.sendMessage(message(METHODS.aepp.connect, {
            name: 'test-aepp',
            version: 1,
            networkId: 'ae_test'
          }))
        )
      } catch (e) {
        e.code.should.be.equal(8)
        e.message.should.be.equal('Unsupported Network')
      }
    })
    it('Try add already existed callback/action', async () => {
      try {
        aepp.rpcClient.callbacks = { 1: {} }
        await aepp.rpcClient.addCallback(1)
      } catch (e) {
        e.message.should.be.equal('Callback Already exist')
      }
      try {
        aepp.rpcClient.addAction({ id: 1 }, [])
      } catch (e) {
        e.message.should.be.equal('Action for this request already exist')
      }
    })
    it('Process response ', async () => {
      try {
        await aepp.rpcClient.processResponse({ id: 11, error: {} })
      } catch (e) {
        e.message.should.be.equal('Can\'t find callback for this messageId ' + 11)
      }
    })
    it('Try to get wallet clients', async () => {
      const clients = wallet.getClients()
      clients.should.be.a('Object')
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
        connectionFromWalletToAepp.sendMessage({ method: METHODS.closeConnection, params: { reason: 'bye' }, jsonrpc: '2.0' })
      })
      received.should.be.equal(true)
    })
  })
  describe('Old RPC Wallet-AEPP', () => {
    let wallet
    let aepp
    let connections
    before(async () => {
      connections = getConnections(true)
      wallet = await Wallet({
        compilerUrl,
        nodes: [{ name: 'test', instance: node }],
        self: connections.waelletConnection
      })
      aepp = await Aepp({ parent: Object.assign({}, connections.aeppConnection), self: connections.aeppConnection })
    })
    it('Call wallet method without guards', async () => {
      const errors = [
        await aepp.address().catch(e => e === 'Address rejected'),
        await aepp.height().catch(e => e === 'Chain operation [height] rejected'),
        await aepp.spendTx({}).catch(e => e === 'Creating transaction [spendTx] rejected'),
        await aepp.getCompilerVersion().catch(e => e === 'Contract operation [getCompilerVersion] rejected'),
        await aepp.sign('tx_asdasd').catch(e => e === 'Signing rejected')
      ]
      errors.filter(e => e).length.should.be.equal(5)
    })
    it('Connect to the wallet', async () => {
      wallet.onAccount = (m, p, s) => {
        return true
      }
      const address = await aepp.address()
      address.should.be.equal('ak_2a1j2Mk9YSmC1gioUq4PWRm3bsv887MbuRVwyv4KaUGoR1eiKi')
    })
    it('Reject address retrieving', async () => {
      wallet.onAccount = (m, p, s) => false
      try {
        await aepp.address()
      } catch (e) {
        e.should.be.equal('Address rejected')
      }
      wallet.onAccount = (m, p, s) => true
    })
    it('Send invalid message to AEPP', async () => {
      connections.waelletConnection.postMessage(true)
    })
    it('Call node method through wallet', async () => {
      wallet.onChain = () => true
      const height = await aepp.height()
      height.should.be.an('number')
    })
    it('Call compiler through Wallet', async () => {
      wallet.onContract = () => true
      const compilerVersion = await aepp.getCompilerVersion()
      compilerVersion.should.be.a('string')
      compilerVersion.split('.').length.should.be.equal(3)
    })
    it('Can spend', async () => {
      wallet.onTx = () => true
      const spendResult = await aepp.spend(0, await aepp.address())
      spendResult.should.be.an('object')
      spendResult.blockHeight.should.be.a('number')
    })
    it('Send invalid method to Wallet', () => {
      connections.aeppConnection.postMessage({ method: 'blabla', jsonrpc: '2.0' })
    })
  })
  describe('Rpc helpers', () => {
    it('Receive invalid message', () => {
      (!receive(() => true, 1)(false)).should.be.equal(true)
    })
    it('receive unknown method', () => {
      getHandler({}, { method: 'hey' })()().should.be.equal(true)
    })
    it('getBrowserAPI: not in browser', () => {
      global.chrome = null
      global.browser = null
      global.window = null
      try {
        getBrowserAPI()
      } catch (e) {
        e.message.should.be.equal('Browser is not detected')
      }
    })
    it('getBrowserAPI: not in browser(force error)', () => {
      global.chrome = null
      global.browser = null
      global.window = null
      getBrowserAPI(true).should.be.an('object')
    })
    it('getBrowserAPI: chrome', () => {
      global.chrome = { runtime: {}, chrome: true }
      getBrowserAPI().chrome.should.be.equal(true)
    })
    it('getBrowserAPI: firefox', () => {
      global.chrome = null
      global.browser = { runtime: {}, firefox: true }
      getBrowserAPI().firefox.should.be.equal(true)
    })
    it('isInIframe/getWindow', () => {
      global.window = null
      try {
        getWindow()
      } catch (e) {
        e.message.should.be.equal('Browser is not detected')
      }
      global.window = {}
      isInIframe().should.be.equal(true)
      getWindow().should.be.an('Object')
    })
    it('Send message from content script', async () => {
      connectionFromWalletToAepp.disconnect()
      connectionFromWalletToAepp.debug = true
      connectionFromAeppToWallet.debug = true
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

const getConnections = (direct) => {
  global.chrome = { runtime: {} }
  global.window = { location: { origin: '//test' } }
  return getFakeConnections(direct)
}
