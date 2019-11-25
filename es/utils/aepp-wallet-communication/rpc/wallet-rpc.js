import Ae from '../../../ae'
import Accounts from '../../../accounts'
import Selector from '../../../account/selector'

import { WalletClients } from './wallet-clients'
import { getBrowserAPI, getHandler, message, sendResponseMessage } from '../helpers'
import { ERRORS, METHODS, RPC_STATUS, VERSION, WALLET_TYPE, SUBSCRIPTION_VALUES } from '../schema'
import uuid from 'uuid/v4'

const rpcClients = WalletClients()

const NOTIFICATIONS = {
  [METHODS.closeConnection]: (instance, { client }) =>
    (msg) => {
      client.info.status = RPC_STATUS.DISCONNECTED
      instance.onDisconnect(msg.params, client)
    }
}

const RESPONSES = {}

const REQUESTS = {
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.aepp.connect]: (instance, { client }) =>
    ({ id, method, params: { name, networkId, version, icons } }) => {
      // Check if protocol and network is compatible with wallet
      if (version !== VERSION) return sendResponseMessage(client)(id, method, { error: ERRORS.unsupportedProtocol() })
      if (networkId !== instance.getNetworkId()) return sendResponseMessage(client)(id, method, { error: ERRORS.unsupportedNetwork() })

      // Action methods
      const accept = (id) => () => {
        rpcClients.updateClientInfo(client.id, { status: RPC_STATUS.CONNECTED })
        sendResponseMessage(client)(id, method, { result: instance.getWalletInfo() })
      }
      const deny = (id) => (error) => {
        rpcClients.updateClientInfo(client.id, { status: RPC_STATUS.CONNECTION_REJECTED })
        sendResponseMessage(client)(id, METHODS.aepp.connect, { error: ERRORS.connectionDeny(error) })
      }

      // Store new AEPP and wait for connection approve
      rpcClients.updateClientInfo(client.id, {
        status: RPC_STATUS.WAITING_FOR_CONNECTION_APPROVE,
        name,
        networkId,
        icons,
        version
      })

      // Call onConnection callBack to notice Wallet about new AEPP
      instance.onConnection(client, client.addAction({
        id,
        method,
        params: { name, networkId, version }
      }, [accept(id), deny(id)]))
    },
  [METHODS.aepp.subscribeAddress]: (instance, { client }) =>
    ({ id, method, params: { type, value } }) => {
      // Authorization check
      if (!client.isConnected()) return sendResponseMessage(client)(id, method, { error: ERRORS.notAuthorize() })

      const accept = (id) =>
        () => sendResponseMessage(client)(
          id,
          method,
          {
            result: {
              subscription: client.updateSubscription(type, value),
              address: instance.getAccounts()
            }
          })
      const deny = (id) => (error) => sendResponseMessage(client)(id, method, { error: ERRORS.rejectedByUser(error) })

      instance.onSubscription(client, client.addAction({ id, method, params: { type, value } }, [accept(id), deny(id)]))
    },
  [METHODS.aepp.address]: (instance, { client }) =>
    ({ id, method }) => {
      // Authorization check
      if (!client.isConnected()) return sendResponseMessage(client)(id, method, { error: ERRORS.notAuthorize() })

      const accept = (id) =>
        () => sendResponseMessage(client)(
          id,
          method,
          {
            result: instance.addresses()
          })
      const deny = (id) => (error) => sendResponseMessage(client)(id, method, { error: ERRORS.rejectedByUser(error) })

      instance.onAskAccounts(client, client.addAction({ id, method }, [accept(id), deny(id)]))
    },
  [METHODS.aepp.sign]: (instance, { client }) =>
    async ({ id, method, params: { tx, onAccount, returnSigned = false } }) => {
      // Authorization check
      if (!client.isConnected()) return sendResponseMessage(client)(id, method, { error: ERRORS.notAuthorize() })
      // NetworkId check
      if (client.info.networkId !== instance.getNetworkId()) return sendResponseMessage(client)(id, method, { error: ERRORS.unsupportedNetwork() })

      const accept = (id) => async (rawTx) => {
        try {
          const result = {
            result: {
              ...returnSigned
                ? { signedTransaction: await instance.signTransaction(rawTx || tx, { onAccount }) }
                : { transactionHash: await instance.send(rawTx || tx, { onAccount }) }
            }
          }
          sendResponseMessage(client)(
            id,
            method,
            result
          )
        } catch (e) {
          if (!returnSigned) {
            // Validate transaction
            const validationResult = await instance.unpackAndVerify(tx)
            if (validationResult.validation.length) return sendResponseMessage(client)(id, method, { error: ERRORS.invalidTransaction(validationResult) })
            // Send broadcast failed error to aepp
            sendResponseMessage(client)(id, method, { error: ERRORS.broadcastFailde(e.message) })
          }
          throw e
        }
      }

      const deny = (id) => (error) => sendResponseMessage(client)(id, method, { error: ERRORS.rejectedByUser(error) })

      instance.onSign(client, client.addAction({ id, method, params: { tx, returnSigned, onAccount } }, [accept(id), deny(id)]))
    }
}

const handleMessage = (instance, id) => async (msg) => {
  const client = rpcClients.getClient(id)
  if (!msg.id) {
    return getHandler(NOTIFICATIONS, msg)(instance, { client })(msg)
  }
  if (Object.prototype.hasOwnProperty.call(client.callbacks, msg.id)) {
    return getHandler(RESPONSES, msg)(instance, { client })(msg)
  } else {
    return getHandler(REQUESTS, msg)(instance, { client })(msg)
  }
}

export const WalletRpc = Ae.compose(Accounts, Selector, {
  init ({ icons, name, onConnection, onSubscription, onSign, onDisconnect, onAskAccounts }) {
    // CallBacks for events
    this.onConnection = onConnection
    this.onSubscription = onSubscription
    this.onSign = onSign
    this.onDisconnect = onDisconnect
    this.onAskAccounts = onAskAccounts
    //
    this.name = name
    this.id = uuid()

    const _selectAccount = this.selectAccount.bind(this)
    const _addAccount = this.addAccount.bind(this)
    const _selectNode = this.selectNode.bind(this)

    // Overwrite AE methods
    this.selectAccount = (address) => {
      _selectAccount(address)
      rpcClients.sentNotificationByCondition(
        message(METHODS.wallet.updateAddress, this.getAccounts()),
        (client) =>
          (
            client.addressSubscription.includes(SUBSCRIPTION_VALUES.current) ||
            client.addressSubscription.includes(SUBSCRIPTION_VALUES.connected)
          ) &&
          client.isConnected())
    }
    this.addAccount = async (account, { select, meta }) => {
      await _addAccount(account, { select })
      // Send notification 'update.address' to all Aepp which are subscribed for connected accounts
      rpcClients.sentNotificationByCondition(
        message(METHODS.wallet.updateAddress, this.getAccounts()),
        (client) =>
          client.isConnected() &&
          (
            client.addressSubscription.includes(SUBSCRIPTION_VALUES.connected) ||
            (select && client.addressSubscription.includes(SUBSCRIPTION_VALUES.current))
          )
      )
    }
    this.selectNode = (name) => {
      _selectNode(name)
      // Send notification 'update.network' to all Aepp which connected
      rpcClients.sentNotificationByCondition(
        message(METHODS.updateNetwork, { networkId: this.getNetworkId() }),
        (client) => client.isConnected()
      )
    }
  },
  methods: {
    getClients () {
      return rpcClients
    },
    addRpcClient (clientConnection) {
      // @TODO  detect if aepp has some history based on origin????: if yes use this instance for connection
      const id = uuid()
      rpcClients.addClient(
        id,
        {
          id,
          info: { status: RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST },
          connection: clientConnection,
          handlers: [handleMessage(this, id), this.onDisconnect]
        }
      )
    },
    shareWalletInfo (postFn) {
      postFn({
        jsonrpc: '2.0',
        ...message(METHODS.wallet.readyToConnect, { ...this.getWalletInfo() })
      })
    },
    getWalletInfo () {
      return {
        id: getBrowserAPI().runtime.id || this.id,
        name: this.name,
        networkId: this.getNetworkId(),
        origin: window.location.origin,
        type: getBrowserAPI().runtime.id ? WALLET_TYPE.extension : WALLET_TYPE.window
      }
    },
    getAccounts () {
      return {
        current: this.Selector.address ? { [this.Selector.address]: {} } : {},
        connected: this.addresses()
          .filter(a => a !== this.Selector.address)
          .reduce((acc, a) => ({ ...acc, [a]: {} }), {})
      }
    }
  }
})

export default WalletRpc
