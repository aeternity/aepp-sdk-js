import Ae from '../../../ae'

import { WalletClient } from './wallet-clients'
import { message } from '../helpers'
import { METHODS, REQUESTS } from '../schema'
import Account from '../../../account'

const NOTIFICATIONS = {
  [METHODS.wallet.updateAddress]: (instance) =>
    ({ params }) => {
      instance.accounts = params.addresses
      instance.onAddressChange(params)
    },
  [METHODS.wallet.updateNetwork]: (instance) =>
    (msg) => {
      instance.onNetworkChange(msg.params)
    },
  [METHODS.wallet.closeConnection]: (instance) =>
    (msg) => {
      instance.onDisconnect(msg.params)
    }
}

const RESPONSES = {
  [METHODS.aepp.connect]: (instance) =>
    (msg) => {
      processResponse(instance)(msg)
    },
  [METHODS.aepp.subscribeAddress]: (instance) =>
    (msg) => {
      processResponse(instance)(
        msg,
        ({ id, result }) => {
          instance.accounts = result.addresses
          return [result]
        }
      )
    },
  [METHODS.aepp.sign]: (instance) =>
    (msg) => {
      processResponse(instance)(msg, ({ id, result }) => [result.signedTransaction || result.transactionHash])
    }
}

const processResponse = (instance) => ({ id, error, result }, fn) => {
  if (result) {
    instance.rpcClient.resolveCallback(id, fn({ id, result, error }))
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
  if (!handler || typeof handler !== 'function') console.warning(`Unknown message method ${msg.method}`)
  return handler
}

export const AeppRpc = Ae.compose(Account, {
  init ({ icons, name, onAddressChange, onDisconnect, onNetworkChange, connection }) {
    this.connection = connection
    this.name = name
    this.accounts = {}

    // Init RPCClient
    this.rpcClient = WalletClient({
      connection,
      network: this.nodeNetworkId,
      name,
      handlers: [handleMessage(this), this.onDisconnect]
    })

    // Event callbacks
    this.onDisconnect = onDisconnect
    this.onAddressChange = onAddressChange
    this.onNetworkChange = onNetworkChange
  },
  methods: {
    address () {
      if (!this.accounts.current || !Object.keys(this.accounts.current).length) throw new Error('You do not subscribed for account.')
      return Object.keys(this.accounts.current)[0]
    },
    sign (tx) {
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.sign, { tx }))
      )
    },
    subscribeAddress (type, value) {
      return this.rpcClient.addCallback(
        this.rpcClient.sendMessage(message(METHODS.aepp.subscribeAddress, { type, value }))
      )
    },
    sendConnectRequest () {
      return this.rpcClient.sendMessage(message(METHODS.aepp.connect, {
        name: instance.name,
        version: 1,
        network: instance.nodeNetworkId
      }))
    }
  }
})

export default AeppRpc
