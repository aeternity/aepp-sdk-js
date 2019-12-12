import Ae from '../../../ae'

import { RpcClient } from './rpc-clients'
import { getHandler, message } from '../helpers'
import { METHODS, RPC_STATUS, VERSION } from '../schema'
import Account from '../../../account'
import uuid from 'uuid/v4'
import * as R from 'ramda'

/**
 * Content Script Bridge module
 *
 * @module @aeternity/aepp-sdk/es/utils/wallet-aepp-wallet-communication/browser-runtime
 * @export ContentScriptBridge
 * @example import ContentScriptBridge from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/browser-runtime'
 */
const NOTIFICATIONS = {
  [METHODS.wallet.updateAddress]: (instance) =>
    ({ params }) => {
      instance.rpcClient.accounts = params
      instance.onAddressChange(params)
    },
  [METHODS.updateNetwork]: (instance) =>
    (msg) => {
      instance.rpcClient.info.networkId = msg.params.networkId
      instance.onNetworkChange(msg.params)
    },
  [METHODS.closeConnection]: (instance) =>
    (msg) => {
      instance.disconnectWallet()
      instance.onDisconnect(msg.params)
    }
}

const RESPONSES = {
  [METHODS.aepp.address]: (instance) =>
    (msg) => instance.rpcClient.processResponse(msg),
  [METHODS.aepp.connect]: (instance) =>
    (msg) => {
      if (msg.result) instance.rpcClient.info.status = RPC_STATUS.CONNECTED
      instance.rpcClient.processResponse(msg)
    },
  [METHODS.aepp.subscribeAddress]: (instance) =>
    (msg) => {
      if (
        msg.result &&
        Object.prototype.hasOwnProperty.call(msg.result, 'address')
      ) instance.rpcClient.accounts = msg.result.address

      instance.rpcClient.processResponse(
        msg,
        ({ id, result }) => {
          return [result]
        }
      )
    },
  [METHODS.aepp.sign]: (instance) =>
    (msg) => {
      instance.rpcClient.processResponse(msg, ({ id, result }) => [result.signedTransaction || result.transactionHash])
    }
}

const REQUESTS = {}

const handleMessage = (instance) => async (msg) => {
  if (!msg.id) {
    return getHandler(NOTIFICATIONS, msg)(instance)(msg)
  } else if (Object.prototype.hasOwnProperty.call(instance.rpcClient.callbacks, msg.id)) {
    return getHandler(RESPONSES, msg)(instance)(msg)
  } else {
    return getHandler(REQUESTS, msg)(instance)(msg)
  }
}

export const AeppRpc = Ae.compose(Account, {
  async init ({ icons, name, onAddressChange, onDisconnect, onNetworkChange, connection }) {
    this.connection = connection
    this.name = name
    this.accounts = {}

    if (connection) {
      // Init RPCClient
      await this.connectToWallet(connection)
    }

    // Event callbacks
    this.onDisconnect = onDisconnect
    this.onAddressChange = onAddressChange
    this.onNetworkChange = onNetworkChange
  },
  methods: {
    sign () {},
    async connectToWallet (connection) {
      if (this.rpcClient && this.rpcClient.isConnected()) throw new Error('You are already connected to wallet ' + this.rpcClient)
      this.rpcClient = RpcClient({
        connection,
        networkId: this.getNetworkId(),
        ...connection.connectionInfo,
        id: uuid(),
        handlers: [handleMessage(this), this.onDisconnect]
      })
      return this.sendConnectRequest()
    },
    async disconnectWallet (force = false) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      force || this.rpcClient.sendMessage(message(METHODS.closeConnection, { reason: 'bye' }), true)
      this.rpcClient.disconnect()
      this.rpcClient = null
    },
    async address ({ onAccount } = {}) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.getCurrentAccount()) throw new Error('You do not subscribed for account.')
      return this.rpcClient.getCurrentAccount({ onAccount })
    },
    async askAddresses () {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.getCurrentAccount()) throw new Error('You do not subscribed for account.')
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.address))
      )
    },
    async signTransaction (tx, opt = {}) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.getCurrentAccount()) throw new Error('You do not subscribed for account.')
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.sign, { ...opt, tx, returnSigned: true }))
      )
    },
    async subscribeAddress (type, value) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.subscribeAddress, { type, value }))
      )
    },
    async sendConnectRequest () {
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.connect, {
          name: this.name,
          version: VERSION,
          networkId: this.getNetworkId()
        }))
      )
    },
    async send (tx, options) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected() || !this.rpcClient.isConnected()) throw new Error('You are not connected to Wallet')
      if (!this.rpcClient.getCurrentAccount()) throw new Error('You do not subscribed for account.')
      const opt = R.merge(this.Ae.defaults, { walletBroadcast: true, ...options })
      if (!opt.walletBroadcast) {
        const signed = await this.signTransaction(tx, opt)
        return this.sendTransaction(signed, opt)
      }
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.sign, { ...opt, tx, returnSigned: false }))
      )
    }
  }
})

export default AeppRpc
