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
import verifyTransaction from '../../../tx/validator'
import AccountMultiple, { _AccountMultiple } from '../../../account/multiple'
import RpcClient from './RpcClient'
import {
  METHODS, RPC_STATUS, VERSION, SUBSCRIPTION_TYPES, WALLET_TYPE,
  RpcBroadcastError, RpcInvalidTransactionError,
  RpcNotAuthorizeError, RpcPermissionDenyError, RpcUnsupportedProtocolError
} from '../schema'
import { UnknownRpcClientError } from '../../errors'
import { _AccountBase } from '../../../account/base'
import { Account } from '../../../account/resolver'
import NodePool, { _NodePool } from '../../../node-pool'
import BrowserConnection from '../connection/Browser'
import { Accounts, AeppApi, WalletApi, WalletInfo } from './types'
import { EncodedData } from '../../encoder'

type RpcClientWallet = RpcClient<AeppApi, WalletApi>

type OnConnection = (
  clientId: string, params: Omit<Parameters<WalletApi[METHODS.connect]>[0], 'version'>, origin: string
) => void

type OnSubscription = (
  clientId: string, params: Parameters<WalletApi[METHODS.subscribeAddress]>[0], origin: string
) => void

type OnSign = (
  clientId: string, params: Parameters<WalletApi[METHODS.sign]>[0], origin: string
) => Promise<{ tx?: EncodedData<'tx'>, onAccount?: Account } | undefined>

type OnDisconnect = (
  clientId: string, params: Parameters<WalletApi[METHODS.closeConnection]>[0]
) => void

type OnAskAccounts = (
  clientId: string, params: undefined, origin: string
) => void

type OnMessageSign = (
  clientId: string, params: Parameters<WalletApi[METHODS.signMessage]>[0], origin: string
) => Promise<{ onAccount?: Account } | undefined>

interface RpcClientsInfo {
  id: string
  status: RPC_STATUS
  connectNode: boolean
  addressSubscription: Set<'connected' | 'current'>
  rpc: RpcClientWallet
}

const nodePool = new _NodePool()

/**
 * Contain functionality for aepp interaction and managing multiple aepps
 * @param param Init params object
 * @param param.name Wallet name
 * @param onConnection Call-back function for incoming AEPP connection
 * @param onSubscription Call-back function for incoming AEPP account subscription
 * @param onSign Call-back function for incoming AEPP sign request
 * @param onAskAccounts Call-back function for incoming AEPP get address request
 * @param onMessageSign Call-back function for incoming AEPP sign message request
 * Second argument of incoming call-backs contain function for accept/deny request
 * @param onDisconnect Call-back function for disconnect event
 */
abstract class _WalletRpc extends _AccountMultiple {
  id: string
  _type: WALLET_TYPE
  name: string
  _clients: Map<string, RpcClientsInfo>
  onConnection: OnConnection
  onSubscription: OnSubscription
  onSign: OnSign
  onDisconnect: OnDisconnect
  onAskAccounts: OnAskAccounts
  onMessageSign: OnMessageSign

  get selectedNode (): any { return null }
  abstract send (tx: EncodedData<'tx'>, options: any): EncodedData<'th'>

  async init ({
    name,
    id,
    type,
    onConnection,
    onSubscription,
    onSign,
    onDisconnect,
    onAskAccounts,
    onMessageSign,
    ...options
  }: {
    id: string
    type: WALLET_TYPE
    name: string
    onConnection: OnConnection
    onSubscription: OnSubscription
    onSign: OnSign
    onDisconnect: OnDisconnect
    onAskAccounts: OnAskAccounts
    onMessageSign: OnMessageSign
  } & Parameters<_AccountMultiple['init']>[0]): Promise<void> {
    await super.init(options)
    this.onConnection = onConnection
    this.onSubscription = onSubscription
    this.onSign = onSign
    this.onDisconnect = onDisconnect
    this.onAskAccounts = onAskAccounts
    this.onMessageSign = onMessageSign
    this._clients = new Map()
    this.name = name
    this.id = id
    this._type = type
  }

  _pushAccountsToApps (): void {
    Array.from(this._clients.keys())
      .filter(clientId => this._isRpcClientSubscribed(clientId))
      .map(clientId => this._getClient(clientId).rpc)
      .forEach(client => client.notify(METHODS.updateAddress, this.getAccounts()))
  }

  selectAccount (address: EncodedData<'ak'>): void {
    super.selectAccount(address)
    this._pushAccountsToApps()
  }

  async addAccount (
    account: _AccountBase,
    options: Parameters<_AccountMultiple['addAccount']>[1]
  ): Promise<void> {
    await super.addAccount(account, options)
    this._pushAccountsToApps()
  }

  selectNode (name: string): void {
    nodePool.selectNode.call(this, name)
    Array.from(this._clients.keys())
      .filter(clientId => this._isRpcClientConnected(clientId))
      .map(clientId => this._getClient(clientId))
      .forEach(client => {
        client.rpc.notify(METHODS.updateNetwork, {
          networkId: this.getNetworkId(),
          ...client.connectNode && { node: this.selectedNode }
        })
      })
  }

  _getClient (clientId: string): RpcClientsInfo {
    const client = this._clients.get(clientId)
    if (client == null) throw new UnknownRpcClientError(clientId)
    return client
  }

  _isRpcClientSubscribed (clientId: string): boolean {
    return this._isRpcClientConnected(clientId) &&
      this._getClient(clientId).addressSubscription.size !== 0
  }

  _isRpcClientConnected (clientId: string): boolean {
    return RPC_STATUS.CONNECTED === this._getClient(clientId).status &&
      this._getClient(clientId).rpc.connection.isConnected()
  }

  _disconnectRpcClient (clientId: string): void {
    const client = this._getClient(clientId)
    client.rpc.connection.disconnect()
    client.status = RPC_STATUS.DISCONNECTED
    client.addressSubscription = new Set()
  }

  /**
   * Remove specific RpcClient by ID
   * @param id Client ID
   */
  removeRpcClient (id: string): void {
    this._disconnectRpcClient(id)
    this._clients.delete(id)
  }

  /**
   * Add new client by AEPP connection
   * @param clientConnection AEPP connection object
   * @return Client ID
   */
  addRpcClient (clientConnection: BrowserConnection): string {
    // @TODO  detect if aepp has some history based on origin????
    // if yes use this instance for connection
    const id = uuid()
    let disconnectParams: any
    const client: RpcClientsInfo = {
      id,
      status: RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST,
      addressSubscription: new Set(),
      connectNode: false,
      rpc: new RpcClient<AeppApi, WalletApi>(
        clientConnection,
        () => {
          this._clients.delete(id)
          this.onDisconnect(id, disconnectParams) // also related info
        }, {
          [METHODS.closeConnection]: async (params) => {
            disconnectParams = params
            this._disconnectRpcClient(id)
          },
          // Store client info and prepare two fn for each client `connect` and `denyConnection`
          // which automatically prepare and send response for that client
          [METHODS.connect]: async ({ name, version, icons, connectNode }, origin) => {
            if (version !== VERSION) throw new RpcUnsupportedProtocolError()

            await this.onConnection(id, { name, icons, connectNode }, origin)
            client.status = RPC_STATUS.CONNECTED
            client.connectNode = connectNode
            return {
              ...this.getWalletInfo(),
              ...connectNode && { node: this.selectedNode }
            }
          },
          [METHODS.subscribeAddress]: async ({ type, value }, origin) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError()

            await this.onSubscription(id, { type, value }, origin)

            switch (type) {
              case SUBSCRIPTION_TYPES.subscribe:
                client.addressSubscription.add(value)
                break
              case SUBSCRIPTION_TYPES.unsubscribe:
                client.addressSubscription.delete(value)
                break
            }

            return {
              subscription: Array.from(client.addressSubscription),
              address: this.getAccounts()
            }
          },
          [METHODS.address]: async (params, origin) => {
            if (!this._isRpcClientSubscribed(id)) throw new RpcNotAuthorizeError()
            await this.onAskAccounts(id, params, origin)
            return this.addresses()
          },
          [METHODS.sign]: async ({ tx, onAccount, returnSigned }, origin) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError()
            onAccount ??= await this.address()
            if (!this.addresses().includes(onAccount)) {
              throw new RpcPermissionDenyError(onAccount)
            }

            const overrides = await this.onSign(id, { tx, returnSigned, onAccount }, origin)
            onAccount = overrides?.onAccount ?? onAccount
            tx = overrides?.tx ?? tx
            if (returnSigned) {
              return { signedTransaction: await this.signTransaction(tx, { onAccount }) }
            }
            try {
              return { transactionHash: await this.send(tx, { onAccount, verify: false }) }
            } catch (error) {
              const validation = await verifyTransaction(tx, this.selectedNode.instance)
              if (validation.length > 0) throw new RpcInvalidTransactionError(validation)
              throw new RpcBroadcastError(error.message)
            }
          },
          [METHODS.signMessage]: async ({ message, onAccount }, origin) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError()
            onAccount ??= await this.address()
            if (!this.addresses().includes(onAccount)) {
              throw new RpcPermissionDenyError(onAccount)
            }

            const overrides = await this.onMessageSign(id, { message, onAccount }, origin)
            onAccount = overrides?.onAccount ?? onAccount
            return {
              // TODO: fix signMessage return type
              signature: await this.signMessage(message, { onAccount, returnHex: true }) as
                unknown as string
            }
          }
        })
    }
    this._clients.set(id, client)
    return id
  }

  /**
   * Send shareWalletInfo message to notify AEPP about wallet
   * @param clientId ID of RPC client send message to
   */
  shareWalletInfo (clientId: string): void {
    this._getClient(clientId).rpc.notify(METHODS.readyToConnect, this.getWalletInfo())
  }

  /**
   * Get Wallet info object
   * @return Object with wallet information
   */
  getWalletInfo (): WalletInfo {
    return {
      id: this.id,
      name: this.name,
      networkId: this.getNetworkId(),
      origin: window.location.origin,
      type: this._type
    }
  }

  /**
   * Get Wallet accounts
   * @return Object with accounts information ({ connected: Object, current: Object })
   */
  getAccounts (): Accounts {
    return {
      current: this.selectedAddress != null ? { [this.selectedAddress]: {} } : {},
      connected: this.addresses()
        .filter((a) => a !== this.selectedAddress)
        .reduce((acc, a) => ({ ...acc, [a]: {} }), {})
    }
  }
}

export default Ae.compose(AccountMultiple, NodePool, {
  init: _WalletRpc.prototype.init,
  props: { _clients: new Map() },
  methods: {
    _disconnectRpcClient: _WalletRpc.prototype._disconnectRpcClient,
    _isRpcClientSubscribed: _WalletRpc.prototype._isRpcClientSubscribed,
    _isRpcClientConnected: _WalletRpc.prototype._isRpcClientConnected,
    _getClient: _WalletRpc.prototype._getClient,
    _pushAccountsToApps: _WalletRpc.prototype._pushAccountsToApps,
    removeRpcClient: _WalletRpc.prototype.removeRpcClient,
    addRpcClient: _WalletRpc.prototype.addRpcClient,
    shareWalletInfo: _WalletRpc.prototype.shareWalletInfo,
    getWalletInfo: _WalletRpc.prototype.getWalletInfo,
    getAccounts: _WalletRpc.prototype.getAccounts,
    selectAccount: _WalletRpc.prototype.selectAccount,
    addAccount: _WalletRpc.prototype.addAccount,
    selectNode: _WalletRpc.prototype.selectNode
  }
})
