/**
 * RPC handler for WAELLET side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc
 * @export WalletRpc
 * @example
 * import WalletRpc from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc'
 */
import { v4 as uuid } from '@aeternity/uuid'
// @ts-expect-error TODO remove
import Ae from '../../../ae'
// @ts-expect-error TODO remove
import verifyTransaction from '../../../tx/validator'
// @ts-expect-error TODO remove
import AccountMultiple from '../../../account/multiple'
// @ts-expect-error TODO remove
import TxObject from '../../../tx/tx-object'
import RpcClient, { Accounts, Connection, Message, RpcClientInfo } from './rpc-client'
// @ts-expect-error TODO remove
import { getBrowserAPI, getHandler, isValidAccounts, message, sendResponseMessage } from '../helpers'
import { ERRORS, METHODS, RPC_STATUS, VERSION, WALLET_TYPE } from '../schema'
import { ArgumentError, TypeError, UnknownRpcClientError } from '../../errors'
// @ts-expect-error TODO remove
import { isAccountBase } from '../../../account/base'
import { filterObject } from '../../other'

const resolveOnAccount = (
  addresses: string[],
  onAccount: string | object,
  opt: {onAccount?: object} = {}): string | object => {
  if (addresses.find(a => a === onAccount) == null) {
    if (typeof opt.onAccount !== 'object' || !isAccountBase(opt.onAccount)) throw new TypeError('Provided onAccount should be an AccountBase')
    onAccount = opt.onAccount
  }
  return onAccount
}

const NOTIFICATIONS = {
  [METHODS.closeConnection]: (instance: Ae, { client }: {client: RpcClient}) =>
    async (msg: Message) => {
      client.disconnect(true)
      instance.onDisconnect(msg.params, client)
    }
}

const RESPONSES = {}

const REQUESTS = {
  // Store client info and prepare two fn for each client `connect` and `denyConnection`
  // which automatically prepare and send response for that client
  [METHODS.connect] (
    callInstance: Function,
    instance: Ae,
    client: RpcClient,
    { name, version, icons, connectNode }: {
      name: RpcClientInfo['name']
      version: RpcClientInfo['version']
      icons: RpcClientInfo['icons']
      connectNode: RpcClientInfo['connectNode']
    }) {
    // Check if protocol and network is compatible with wallet
    if (version !== VERSION) return { error: ERRORS.unsupportedProtocol() }
    // Store new AEPP and wait for connection approve
    client.updateInfo({
      status: RPC_STATUS.WAITING_FOR_CONNECTION_APPROVE,
      name,
      icons,
      version,
      origin: window.location.origin,
      connectNode
    })

    // Call onConnection callBack to notice Wallet about new AEPP
    return callInstance(
      'onConnection',
      { name, version },
      ({ shareNode }: { shareNode?: boolean} = {}) => {
        client.updateInfo({
          status: shareNode === true ? RPC_STATUS.NODE_BINDED : RPC_STATUS.CONNECTED
        })
        return {
          result: {
            ...instance.getWalletInfo(),
            ...(shareNode === true && { node: instance.selectedNode })
          }
        }
      },
      (error: any) => {
        client.updateInfo({ status: RPC_STATUS.CONNECTION_REJECTED })
        return { error: ERRORS.connectionDeny(error) }
      }
    )
  },
  [METHODS.subscribeAddress] (
    callInstance: Function,
    instance: Ae,
    client: RpcClient,
    { type, value }: { type: string, value: string }) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }

    return callInstance(
      'onSubscription',
      { type, value },
      async ({ accounts }: { accounts?: RpcClient['accounts'] } = {}) => {
        try {
          const clientAccounts = accounts ?? instance.getAccounts()
          if (!isValidAccounts(clientAccounts)) {
            throw new TypeError('Invalid provided accounts object')
          }
          const subscription = client.updateSubscription(type, value)
          client.setAccounts(clientAccounts, { forceNotification: true })
          return {
            result: {
              subscription,
              address: clientAccounts
            }
          }
        } catch (e) {
          if (instance.debug === true) console.error(e)
          return { error: ERRORS.internalError(e.message) }
        }
      },
      (error: any) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.address] (callInstance: Function, instance: Ae, client: RpcClient) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    if (!client.isSubscribed()) return { error: ERRORS.notAuthorize() }

    return callInstance(
      'onAskAccounts',
      {},
      ({ accounts }: { accounts?: RpcClient['accounts'] } = {}) => ({
        result: accounts ??
          [...Object.keys(client.accounts.current ?? {}),
            ...Object.keys(client.accounts.connected ?? {})]
      }),
      (error: any) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.sign] (
    callInstance: Function,
    instance: Ae,
    client: RpcClient,
    options: {tx: string, onAccount: string, returnSigned: boolean}) {
    const { tx, onAccount, returnSigned = false } = options
    const address = onAccount ?? client.currentAccount
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    // Account permission check
    if (!client.hasAccessToAccount(address)) {
      return { error: ERRORS.permissionDeny(address) }
    }

    return callInstance(
      'onSign',
      { tx, returnSigned, onAccount: address, txObject: TxObject.fromString(tx) },
      async (rawTx: string, opt = {}) => {
        let onAcc
        try {
          onAcc = resolveOnAccount(instance.addresses(), address, opt)
        } catch (e) {
          if (instance.debug === true) console.error(e)
          return { error: ERRORS.internalError(e.message) }
        }
        try {
          const t = rawTx ?? tx
          const result = returnSigned
            ? { signedTransaction: await instance.signTransaction(t, { onAccount: onAcc }) }
            : { transactionHash: await instance.send(t, { onAccount: onAcc, verify: false }) }
          return { result }
        } catch (e) {
          if (!returnSigned) {
            // Validate transaction
            const validation = await verifyTransaction(rawTx ?? tx, instance.selectedNode.instance)
            if (validation.length > 0) return { error: ERRORS.invalidTransaction(validation) }
            // Send broadcast failed error to aepp
            return { error: ERRORS.broadcastFailed(e.message) }
          }
          throw e
        }
      },
      (error: any) => ({ error: ERRORS.rejectedByUser(error) })
    )
  },
  [METHODS.signMessage] (
    callInstance: Function,
    instance: Ae,
    client: RpcClient,
    { message, onAccount }: { message: string, onAccount: string }) {
    // Authorization check
    if (!client.isConnected()) return { error: ERRORS.notAuthorize() }
    const address = onAccount ?? client.currentAccount
    if (!client.hasAccessToAccount(address)) {
      return { error: ERRORS.permissionDeny(address) }
    }

    return callInstance(
      'onMessageSign',
      { message, onAccount: address },
      async (opt = {}) => {
        try {
          const onAcc = resolveOnAccount(instance.addresses(), address, opt)
          return {
            result: {
              signature: await instance.signMessage(message, {
                onAccount: onAcc,
                returnHex: true
              })
            }
          }
        } catch (e) {
          if (instance.debug === true) console.error(e)
          return { error: ERRORS.internalError(e.message) }
        }
      },
      (error: any) => ({ error: ERRORS.rejectedByUser(error) })
    )
  }
}
const handleMessage = (instance: Ae, id: string) => async (msg: Message, origin: string) => {
  const client: RpcClient = instance.rpcClients[id]
  if (Number.isNaN(msg.id)) {
    return getHandler(
      NOTIFICATIONS, msg, { debug: instance.debug }
    )(instance, { client })(msg, origin)
  }
  if (client.callbacks.has(msg.id)) {
    return getHandler(RESPONSES, msg, { debug: instance.debug })(instance, { client })(msg, origin)
  } else {
    const { id, method } = msg
    const callInstance = (
      methodName: string,
      params: any,
      accept: Function,
      deny: Function) => async () => await new Promise(resolve => {
      instance[methodName](
        client,
        {
          id,
          method,
          params,
          accept: (...args: any[]) => resolve(accept(...args)),
          deny: (...args: any[]) => resolve(deny(...args))
        },
        origin
      )
    })
    // TODO make one structure for handler functions
    const errorObjectOrHandler = getHandler(REQUESTS, msg, { debug: instance.debug })(
      callInstance, instance, client, msg.params
    )
    const response = typeof errorObjectOrHandler === 'function' ? await errorObjectOrHandler() : errorObjectOrHandler
    sendResponseMessage(client)(id, method, response)
  }
}

/**
 * Contain functionality for aepp interaction and managing multiple aepps
 * @alias module:@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/wallet-rpc
 * @function
 * @rtype Stamp
 * @param param Init params object
 * @param [param.name] Wallet name
 * @param onConnection Call-back function for incoming AEPP connection
 * @param onSubscription Call-back function for incoming AEPP account subscription
 * @param onSign Call-back function for incoming AEPP sign request
 * @param onAskAccounts Call-back function for incoming AEPP get address request
 * @param onMessageSign Call-back function for incoming AEPP sign message request
   * Second argument of incoming call-backs contain function for accept/deny request
 * @param onDisconnect Call-back function for disconnect event
 */
export default Ae.compose(AccountMultiple, {
  init ({
    name,
    debug = false,
    ...other
  }: {
    name?: string
    debug?: boolean
    [key: string]: any
  } = {}) {
    [
      'onConnection', 'onSubscription', 'onSign', 'onDisconnect', 'onAskAccounts', 'onMessageSign'
    ].forEach(event => {
      const handler = other[event]
      if (typeof handler !== 'function') throw new ArgumentError(event, 'a function', handler)
      this[event] = handler
    })

    this.debug = debug
    this.rpcClients = {}
    this.name = name
    this.id = uuid()

    const _selectAccount = this.selectAccount.bind(this)
    const _addAccount = this.addAccount.bind(this)
    const _selectNode = this.selectNode.bind(this)

    // Overwrite AE methods
    this.selectAccount = (address: string, { condition = () => true } = {}) => {
      _selectAccount(address)
      Object.values(this.rpcClients)
        .filter((client: RpcClient) => client.isConnected() &&
         client.isSubscribed() &&
         client.hasAccessToAccount(address) && condition())
        .forEach((client: RpcClient) => client.setAccounts({
          current: { [address]: {} },
          connected: {
            ...client.accounts.current,
            ...filterObject(client.accounts.connected ?? {}, ([k]) => k !== address)
          }
        }))
    }
    this.addAccount = async (
      account: {address: Function},
      { select, meta = {}, condition = () => true }:
      {
        select?: boolean
        meta?: object
        condition?: () => true
      } = {}) => {
      await _addAccount(account, { select })
      const address: string = await account.address()
      // Send notification 'update.address' to all Aepp which are subscribed for connected accounts
      Object.values(this.rpcClients)
        .filter(
          (client: RpcClient) => client.isConnected() && client.isSubscribed() && condition())
        .forEach((client: RpcClient) => client.setAccounts({
          current: { ...select === true ? { [address]: meta } : client.accounts.current },
          connected: {
            ...select === true ? client.accounts.current : { [address]: meta },
            ...client.accounts.connected
          }
        }))
    }
    this.selectNode = (name: string) => {
      _selectNode(name)
      // Send notification 'update.network' to all Aepp which connected
      Object.values(this.rpcClients)
        .filter((client: RpcClient) => client.isConnected())
        .forEach((client: RpcClient) => {
          client.sendMessage(
            message(METHODS.updateNetwork, {
              networkId: this.getNetworkId(),
              ...client.info.status === RPC_STATUS.NODE_BINDED && { node: this.selectedNode }
            }), true)
        })
    }
  },
  methods: {
    /**
     * Remove specific RpcClient by ID
     * @function removeRpcClient
     * @instance
     * @rtype (id: string) => void
     * @param id Client ID
     * @param [opt = {}]
     */
    removeRpcClient (
      id: string,
      { forceConnectionClose = false }: { forceConnectionClose?: boolean} = {}): void {
      const client: RpcClient = this.rpcClients[id]
      if (client == null) throw new UnknownRpcClientError(id)
      client.disconnect(forceConnectionClose)
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.rpcClients[id]
    },
    /**
     * Add new client by AEPP connection
     * @function addRpcClient
     * @instance
     * @rtype (clientConnection: Object) => Object
     * @param {Object} clientConnection AEPP connection object
     * @return {String} Client ID
     */
    addRpcClient (clientConnection: Connection): string {
      // @TODO  detect if aepp has some history based on origin????
      // if yes use this instance for connection
      const id = uuid()
      this.rpcClients[id] = new RpcClient({
        id,
        info: { status: RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST },
        connection: clientConnection,
        handlers: [handleMessage(this, id), this.onDisconnect]
      })
      return id
    },
    /**
     * Share wallet info
     * Send shareWalletInfo message to notify AEPP about wallet
     * @function shareWalletInfo
     * @instance
     * @rtype (postFn: Function) => void
     * @param postFn Send message function like `(msg) => void`
     */
    shareWalletInfo (postFn: (msg: Message) => void): void {
      postFn({
        jsonrpc: '2.0',
        ...message(METHODS.readyToConnect, this.getWalletInfo())
      })
    },
    /**
     * Get Wallet info object
     * @function getWalletInfo
     * @instance
     * @rtype () => Object
     * @return Object with wallet information(id, name, network, ...)
     */
    getWalletInfo (): {
      id: string
      name: string
      networkId: string
      origin: string
      type: WALLET_TYPE
    } {
      const runtime = getBrowserAPI(true).runtime
      return {
        id: runtime?.id ?? this.id,
        name: this.name,
        networkId: this.getNetworkId(),
        origin: window.location.origin,
        type: runtime?.id != null ? WALLET_TYPE.extension : WALLET_TYPE.window
      }
    },
    /**
     * Get Wallet accounts
     * @function getAccounts
     * @instance
     * @rtype () => Object
     * @return Object with accounts information({ connected: Object, current: Object })
     */
    getAccounts (): Accounts {
      return {
        current: this.selectedAddress != null ? { [this.selectedAddress]: {} } : {},
        connected: this.addresses()
          .filter((a: string) => a !== this.selectedAddress)
          .reduce((acc: object, a: string) => ({ ...acc, [a]: {} }), {})
      }
    }
  }
})
