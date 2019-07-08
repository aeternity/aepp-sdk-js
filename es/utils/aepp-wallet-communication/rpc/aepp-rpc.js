import Ae from '../../../ae'

import { WalletClient } from './wallet-clients'
import { message } from '../helpers'
import { METHODS } from '../schema'
import Account from '../../../account'

const WALLET_NOTIFICATION = {
  [METHODS.wallet.updateAddress]: (instance) =>
    (msg) => {
      instance.onAddressChange(msg.params)
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

const AEPP_RESPONSES = {
  [METHODS.aepp.connect]: (instance) =>
    ({ id, result, error }) => {
      result ? instance.rpcClient.resolveCallback(id) : instance.rpcClient.rejectCallback(id, [error])
    },
  [METHODS.aepp.subscribeAddress]: (instance) =>
    ({ id, result, error }) => {
      if (result) {
        instance.accounts = result.addresses
        instance.rpcClient.resolveCallback(id, [result])
      } else {
        instance.rpcClient.rejectCallback(id, [error])
      }
    },
  [METHODS.aepp.sign]: (instance) =>
    ({ id, result, error }) => {
      if (result) {
        const { signedTransaction, transactionHash } = result
        instance.rpcClient.resolveCallback(id, [signedTransaction || transactionHash])
      } else if (error) {
        instance.rpcClient.rejectCallback(id, [error])
      }
    }
}

const sendConnectRequest = (instance) =>
  () => instance.rpcClient.addCallback(
    instance.rpcClient.sendMessage(message(METHODS.aepp.connect, {
      name: instance.name,
      version: 1,
      network: instance.nodeNetworkId
    }))
  )

const subscribeAddress = (instance) =>
  (type, value) => instance.rpcClient.addCallback(
    instance.rpcClient.sendMessage(message(METHODS.aepp.subscribeAddress, { type, value }))
  )

const address = (instance) => instance.getAddress()

const sign = (instance) =>
  (tx) => instance.rpcClient.addCallback(
    instance.rpcClient.sendMessage(message(METHODS.aepp.sign, { tx }))
  )

//

const handleMessage = (instance) => async (msg) => {
  if (!msg.id) {
    return WALLET_NOTIFICATION[msg.method](instance)(msg)
  }
  if (instance.rpcClient.callbacks.hasOwnProperty(msg.id)) {
    return AEPP_RESPONSES[msg.method](instance)(msg)
  }
}

export const AeppRpc = Ae.compose(Account, {
  init ({ icons, name, onAddressChange, onDisconnect, onNetworkChange, connection }) {
    this.connection = connection
    this.name = name
    this.account = {}

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

    // METHODS
    this.sendConnectRequest = sendConnectRequest(this)
    this.subscribeAddress = subscribeAddress(this)
  },
  methods: {
    getAddress () {
      if (!this.accounts.current || !Object.keys(this.accounts.current).length) throw new Error('You do not subscribed for any accounts.')
      return Object.keys(this.accounts.current)[0]
    },
    sign (tx) {},
    signTransaction (tx) {
      return sign(this)(tx)
    },
    address () {
      return address(this)
    }
  }
})

export default AeppRpc
