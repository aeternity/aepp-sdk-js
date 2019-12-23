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
  let connectionW
  let connectionA

  before(async function () {
    node = await Node({ url, internalUrl })
    wallet = await RpcWallet({
      compilerUrl: compilerUrl,
      nodes: [{ name: 'local', instance: node }],
      name: 'Wallet',
      async onConnection (aepp, { accept, deny }) {
        // if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to connect`)) {
        //   accept()
        // } else { deny() }
      },
      async onSubscription (aepp, { accept, deny }) {
        // if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to subscribe address`)) {
        //   accept()
        // } else { deny() }
      },
      async onSign (aepp, { accept, deny, params }) {
        // if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to ${params.returnSigned ? 'sign' : 'sign and broadcast'} ${JSON.stringify(params.tx)}`)) {
        //   accept()
        // } else {
        //   deny()
        // }
      },
      onAskAccounts (aepp, { accept, deny }) {
        // if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to get accounts`)) {
        //   accept()
        // } else {
        //   deny()
        // }
      },
      onDisconnect (message, client) {
        this.shareWalletInfo(connectionW.sendMessage.bind(connectionW))
      }
    })
    connections = getConnections()
    connectionW = BrowserWindowMessageConnection({
      connectionInfo: { id: 'waellet' },
      self: connections.waelletConnection,
      target: connections.aeppConnection
    })
    connectionA = BrowserWindowMessageConnection({
      connectionInfo: { id: 'aepp' },
      self: connections.aeppConnection,
      target: connections.waelletConnection
    })
  })
  it('Should receive announcePresence message from wallet', async () => {
    const isReceived = new Promise((resolve, reject) => {
      connections.aeppConnection.addEventListener('message', (msg) => {
        resolve(msg.data.method === 'connection.announcePresence')
      })
    })
    wallet.addRpcClient(connectionW)
    await wallet.shareWalletInfo(connectionW.sendMessage.bind(connectionW))
    const is = await isReceived
    is.should.be.equal(true)
  })
  it('Init AEPP and connect to wallet', async () => {
    aepp = await RpcAepp({
      name: 'AEPP',
      onNetworkChange (params) {
      },
      onAddressChange: (addresses) => {
      },
      onDisconnect (a) {
      }
    })
    wallet.onConnection = (aepp, actions) => {
      console.log(aepp)
      console.log(actions)
    }
    await aepp.connectToWallet(connectionA)
  })
})

const getConnections = () => {
  global.chrome = { runtime: {} }
  global.window = { location: { origin: '//test' } }
  return getFakeConnections()
}
