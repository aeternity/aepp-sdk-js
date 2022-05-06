/**
 * RPC handler for AEPP side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
 * @export AeppRpc
 * @example
 * import ContentScriptBridge
 * from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
 */
import { v4 as uuid } from '@aeternity/uuid'
// @ts-expect-error TODO remove
import AccountResolver from '../../../account/resolver'
// @ts-expect-error TODO remove
import Ae from '../../../ae'
// @ts-expect-error TODO remove
import AccountRpc from '../../../account/rpc'
import { decode, EncodedData } from '../../encoder'
import AsyncInit from '../../../utils/async-init'
import RpcClient, { Connection, Message } from './rpc-client'
// @ts-expect-error TODO remove
import { getHandler, message } from '../helpers'
import { METHODS, RPC_STATUS, VERSION } from '../schema'
import {
  AlreadyConnectedError,
  NoWalletConnectedError,
  UnsubscribedAccountError,
  UnAuthorizedAccountError,
  ArgumentError,
  RpcConnectionError
} from '../../errors'
// @ts-expect-error TODO remove
import Node from '../../../node'

const NOTIFICATIONS = {
  [METHODS.updateAddress]: (instance: Ae) =>
    ({ params }: { params: any }) => {
      instance.rpcClient.accounts = params
      instance.onAddressChange(params)
    },
  [METHODS.updateNetwork]: (instance: Ae) =>
    async ({ params }: { params: any }) => {
      const { node } = params
      if (node != null) instance.addNode(node.name, await Node(node), true)
      instance.onNetworkChange(params)
    },
  [METHODS.closeConnection]: (instance: Ae) =>
    (msg: Message) => {
      instance.disconnectWallet()
      instance.onDisconnect(msg.params)
    }
}

const RESPONSES = {
  [METHODS.address]: (instance: Ae) =>
    (msg: Message) => instance.rpcClient.processResponse(msg),
  [METHODS.connect]: (instance: Ae) =>
    (msg: Message) => {
      if (msg.result != null) instance.rpcClient.info.status = RPC_STATUS.CONNECTED
      instance.rpcClient.processResponse(msg)
    },
  [METHODS.subscribeAddress]: (instance: Ae) =>
    (msg: Message) => {
      if (msg.result != null) {
        if (msg.result.address != null) {
          instance.rpcClient.accounts = msg.result.address
        }
        if (msg.result.subscription != null) {
          instance.rpcClient.addressSubscription = msg.result.subscription
        }
      }

      instance.rpcClient.processResponse(msg, ({ result }: { result: Message['result'] }) => [result])
    },
  [METHODS.sign]: (instance: Ae) =>
    (msg: Message) => {
      instance.rpcClient.processResponse(
        msg,
        ({ result }: { result: Message['result'] }) => [result.signedTransaction ?? result.transactionHash]
      )
    },
  [METHODS.signMessage]: (instance: Ae) =>
    (msg: Message) => {
      instance.rpcClient.processResponse(
        msg, ({ result }: { result: Message['result'] }) => [result.signature])
    }
}

const REQUESTS = {}

interface WalletInfo {
  id: string
  name: string
  networkId: string
  origin: string
  type: string
  node?: object
}

const handleMessage = (instance: Ae) => async (msg: Message) => {
  if (msg.id == null) {
    return getHandler(NOTIFICATIONS, msg, { debug: instance.debug })(instance)(msg)
  } else if (instance.rpcClient.callbacks.has(msg.id) === true) {
    return getHandler(RESPONSES, msg, { debug: instance.debug })(instance)(msg)
  } else {
    return getHandler(REQUESTS, msg, { debug: instance.debug })(instance)(msg)
  }
}

/**
  * Contain functionality for wallet interaction and connect it to sdk
  * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
  * @function
  * @rtype Stamp
  * @param param Init params object
  * @param [param.name] Aepp name
  * @param onAddressChange Call-back function for update address event
  * @param onDisconnect Call-back function for disconnect event
  * @param onNetworkChange Call-back function for update network event
  * @param connection Wallet connection object
  */
export default AccountResolver.compose(AsyncInit, {
  async init ({
    name,
    connection,
    debug = false,
    ...other
  }: {
    name: string
    connection: Connection
    debug: boolean
    [key: string]: any
  }) {
    ['onAddressChange', 'onDisconnect', 'onNetworkChange'].forEach(event => {
      const handler = other[event] ?? (() => {})
      if (typeof handler !== 'function') throw new ArgumentError(event, 'a function', handler)
      this[event] = handler
    })

    this.connection = connection
    this.name = name
    this.debug = debug

    const resolveAccountBase = this._resolveAccount
    this._resolveAccount = (account = this.rpcClient?.currentAccount) => {
      if (typeof account === 'string') {
        const prefix = 'ak'
        decode(account as EncodedData<typeof prefix>, prefix)
        if (this.rpcClient?.hasAccessToAccount(account) === false) {
          throw new UnAuthorizedAccountError(account)
        }
        account = AccountRpc({ rpcClient: this.rpcClient, address: account })
      }
      if (account == null) this._ensureAccountAccess()
      return resolveAccountBase(account)
    }

    if (connection != null) {
      // Init RPCClient
      await this.connectToWallet(connection)
    }
  },
  methods: {
    addresses (): string[] {
      this._ensureAccountAccess()
      return [this.rpcClient.currentAccount, ...Object.keys(this.rpcClient.accounts.connected)]
    },
    /**
      * Connect to wallet
      * @function connectToWallet
      * @instance
      * @rtype (connection: Object) => void
      * @param connection Wallet connection object
      * @param options Options
      * @returns Wallet info
      */
    async connectToWallet (connection: Connection, { connectNode = false, name = 'wallet-node', select = false } = {}): Promise<WalletInfo> {
      if (this.rpcClient?.isConnected() === true) {
        throw new AlreadyConnectedError('You are already connected to wallet ' + JSON.stringify(this.rpcClient))
      }
      this.rpcClient = new RpcClient({
        connection,
        ...connection.connectionInfo,
        id: uuid(),
        handlers: [handleMessage(this), this.onDisconnect]
      })
      const walletInfo = await this.sendConnectRequest(connectNode)
      if (connectNode === true && !('node' in walletInfo)) {
        throw new RpcConnectionError('Missing URLs of the Node')
      }
      if (connectNode === true) this.addNode(name, await Node(walletInfo.node), select)
      return walletInfo
    },
    /**
      * Disconnect from wallet
      * @function disconnectWallet
      * @instance
      * @rtype (force: Boolean = false) => void
      * @param sendDisconnect=false Force sending close connection message
      */
    async disconnectWallet (sendDisconnect = true): Promise<void> {
      this._ensureConnected()
      if (sendDisconnect === true) {
        this.rpcClient.sendMessage(message(METHODS.closeConnection, { reason: 'bye' }), true)
      }
      this.rpcClient.disconnect()
      this.rpcClient = null
    },
    /**
      * Ask address from wallet
      * @function askAddresses
      * @instance
      * @rtype () => Promise
      * @return Address from wallet
      */
    async askAddresses (): Promise<void> {
      this._ensureAccountAccess()
      return this.rpcClient.request(METHODS.address)
    },
    /**
      * Subscribe for addresses from wallet
      * @function subscribeAddress
      * @instance
      * @rtype (type: String, value: String) => Promise
      * @param value Subscription action('subscribe'|'unsubscribe')
      * @param type Should be one of 'current' (the selected account), 'connected' (all)
      * @return Address from wallet
      */
    async subscribeAddress (type: string, value: string): Promise<void> {
      this._ensureConnected()
      return this.rpcClient.request(METHODS.subscribeAddress, { type, value })
    },
    /**
      * Send connection request to wallet
      * @function sendConnectRequest
      * @instance
      * @param {Boolean} connectNode - Request wallet to bind node
      * @rtype () => Promise
      * @return {Promise} Connection response
      */
    async sendConnectRequest (connectNode: boolean): Promise<void> {
      return this.rpcClient.request(
        METHODS.connect, {
          name: this.name,
          version: VERSION,
          connectNode
        }
      )
    },
    _ensureConnected (): void {
      if (this.rpcClient?.isConnected() === true) return
      throw new NoWalletConnectedError('You are not connected to Wallet')
    },
    _ensureAccountAccess (): void {
      this._ensureConnected()
      if (this.rpcClient?.currentAccount != null) return
      throw new UnsubscribedAccountError()
    }
  }
})
