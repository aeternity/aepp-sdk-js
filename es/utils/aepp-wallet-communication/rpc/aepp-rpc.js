import Ae from '../../../ae'

import { WalletClient } from './wallet-clients'
import { message } from '../helpers'
import { METHODS, REQUESTS, RPC_STATUS, VERSION } from '../schema'
import Account from '../../../account'
import uuid from 'uuid/v4'

const NOTIFICATIONS = {
  [METHODS.wallet.updateAddress]: (instance) =>
    ({ params }) => {
      instance.accounts = params.addresses
      instance.onAddressChange(params)
    },
  [METHODS.updateNetwork]: (instance) =>
    (msg) => {
      instance.onNetworkChange(msg.params)
    },
  [METHODS.closeConnection]: (instance) =>
    (msg) => {
      instance.disconnectWallet()
      instance.onDisconnect(msg.params)
    }
}

const RESPONSES = {
  [METHODS.aepp.connect]: (instance) =>
    (msg) => {
      if (msg.result) instance.rpcClient.info.status = RPC_STATUS.CONNECTED
      processResponse(instance)(msg)
    },
  [METHODS.aepp.subscribeAddress]: (instance) =>
    (msg) => {
      if (msg.result && msg.result.hasOwnProperty('addresses')) instance.accounts = msg.result.addresses

      processResponse(instance)(
        msg,
        ({ id, result }) => {
          return [result]
        }
      )
    },
  [METHODS.aepp.sign]: (instance) =>
    (msg) => {
      processResponse(instance)(msg, ({ id, result }) => [result.signedTransaction || result.transactionHash])
    }
}

const processResponse = (instance) => ({ id, error, result }, transformResult) => {
  if (result) {
    instance.rpcClient.resolveCallback(id, typeof transformResult === 'function' ? transformResult({ id, result }) : [result])
  } else if (error) {
    instance.rpcClient.rejectCallback(id, [error])
  }
}

const handleMessage = (instance) => async (msg) => {
  if (!msg.id) {
    return getHandler(NOTIFICATIONS, msg)(instance)(msg)
  } else if (instance.rpcClient.callbacks.hasOwnProperty(msg.id)) {
    return getHandler(RESPONSES, msg)(instance)(msg)
  } else {
    return getHandler(REQUESTS, msg)(instance)(msg)
  }
}

const getHandler = (schema, msg) => {
  const handler = schema[msg.method]
  if (!handler || typeof handler !== 'function') {
    console.log(`Unknown message method ${msg.method}`)
    return () => () => true
  }
  return handler
}

export const AeppRpc = Ae.compose(Account, {
  init ({ icons, name, onAddressChange, onDisconnect, onNetworkChange, connection }) {
    this.connection = connection
    this.name = name
    this.accounts = {}

    if (connection) {
      // Init RPCClient
      this.rpcClient = WalletClient({
        connection,
        network: this.nodeNetworkId,
        name,
        handlers: [handleMessage(this), this.onDisconnect]
      })
    }

    // Event callbacks
    this.onDisconnect = onDisconnect
    this.onAddressChange = onAddressChange
    this.onNetworkChange = onNetworkChange
  },
  methods: {
    async connectToWallet (connection) {
      if (this.rpcClient && this.rpcClient.isConnected()) throw new Error('You are already connected to wallet ' + this.rpcClient)
      this.rpcClient = WalletClient({
        connection,
        network: this.nodeNetworkId,
        ...connection.connectionInfo,
        id: uuid(),
        handlers: [handleMessage(this), this.onDisconnect]
      })
      return this.sendConnectRequest()
    },
    async disconnectWallet (force = false) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected()) throw new Error('You are not connected')
      force || this.rpcClient.sendMessage(message(METHODS.closeConnection, { reason: 'bye' }), true)
      await this.rpcClient.disconnect().catch(e => console.error(e))
      this.rpcClient = null
      this.accounts = {}
    },
    async address () {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected()) throw new Error('You are not connected')
      if (!this.accounts.current || !Object.keys(this.accounts.current).length) throw new Error('You do not subscribed for account.')
      return Object.keys(this.accounts.current)[0]
    },
    async sign (tx) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected()) throw new Error('You are not connected')
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.sign, { tx }))
      )
    },
    async subscribeAddress (type, value) {
      if (!this.rpcClient || !this.rpcClient.connection.isConnected()) throw new Error('You are not connected')
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.subscribeAddress, { type, value }))
      )
    },
    async sendConnectRequest () {
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.connect, {
          name: this.name,
          version: VERSION,
          network: this.nodeNetworkId
        }))
      )
    }
  }
})

export default AeppRpc
