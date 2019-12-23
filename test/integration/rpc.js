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
import { compilerUrl, getFakeConnections, configure, url, internalUrl } from './'

import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import BrowserWindowMessageConnection from '../../es/utils/aepp-wallet-communication/connection/browser-window-message'

describe.only('Aepp<->Wallet', function () {
  // configure(this)

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
      async onConnection (aepp, { accept, deny }) {
      },
      async onSubscription (aepp, { accept, deny }) {
      },
      async onSign (aepp, { accept, deny, params }) {
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
})

const getConnections = () => {
  global.chrome = { runtime: {} }
  global.window = { location: { origin: '//test' } }
  return getFakeConnections()
}
