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

import { Node, RpcWallet, RpcAepp } from '../../es'
import { compilerUrl, getFakeConnections, url, internalUrl, networkId } from './'

import { describe, it, before } from 'mocha'
import BrowserWindowMessageConnection from '../../es/utils/aepp-wallet-communication/connection/browser-window-message'
import { verify } from '../../es/utils/crypto'
import { decode } from '../../es/tx/builder/helpers'
import { unpackTx } from '../../es/tx/builder'

describe.only('Aepp<->Wallet', function () {
  // configure(this)
  this.timeout(6000)
  let node
  let aepp
  let wallet
  let connections
  let connectionFromWalletToAepp
  let connectionFromAeppToWallet

  before(async function () {
    node = await Node({ url, internalUrl })
    wallet = await RpcWallet({
      compilerUrl: compilerUrl,
      nodes: [{ name: 'local', instance: node }],
      name: 'Wallet',
      onConnection (aepp, { accept, deny }) {},
      onSubscription (aepp, { accept, deny }) {},
      onSign (aepp, { accept, deny, params }) {},
      onAskAccounts (aepp, { accept, deny }) {},
      onDisconnect (message, client) {
        this.shareWalletInfo(connectionFromWalletToAepp.sendMessage.bind(connectionFromWalletToAepp))
      }
    })
    aepp = await RpcAepp({
      name: 'AEPP',
      nodes: [{ name: 'test', instance: node }],
      onNetworkChange (params) {},
      onAddressChange: (addresses) => {},
      onDisconnect (a) {}
    })
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
    const subscriptionResponse = await aepp.subscribeAddress('subscribe', 'connected')

    subscriptionResponse.subscription.should.be.an('array')
    subscriptionResponse.subscription.filter(e => e === 'connected').length.should.be.equal(1)
    subscriptionResponse.address.current.should.be.an('object')
    Object.keys(subscriptionResponse.address.current)[0].should.be.equal('ak_2a1j2Mk9YSmC1gioUq4PWRm3bsv887MbuRVwyv4KaUGoR1eiKi')
    subscriptionResponse.address.connected.should.be.an('object')
    Object.keys(subscriptionResponse.address.connected).length.should.be.equal(0)
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
})

const getConnections = () => {
  global.chrome = { runtime: {} }
  global.window = { location: { origin: '//test' } }
  return getFakeConnections()
}
