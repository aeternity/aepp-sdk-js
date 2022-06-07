/**
 * RPC handler for AEPP side
 *
 * @module @aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc
 * @export AeppRpc
 * @example
 * import AeppRpc
 * from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/rpc/aepp-rpc'
 */
import AccountResolver, { _AccountResolver, Account } from '../../../account/resolver'
import { _AccountBase } from '../../../account/base'
import AccountRpc from '../../../account/rpc'
import { decode, EncodedData } from '../../encoder'
import { Accounts, WalletInfo, Network, WalletApi, AeppApi } from './types'
import RpcClient from './RpcClient'
import { METHODS, VERSION } from '../schema'
import {
  AlreadyConnectedError,
  NoWalletConnectedError,
  UnsubscribedAccountError,
  UnAuthorizedAccountError,
  RpcConnectionError
} from '../../errors'
// @ts-expect-error TODO remove
import Node from '../../../node'
import BrowserConnection from '../connection/Browser'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import stampit from '@stamp/it'

/**
 * RPC handler for AEPP side
 * Contain functionality for wallet interaction and connect it to sdk
 * @param param Init params object
 * @param param.name Aepp name
 * @param param.onAddressChange Call-back function for update address event
 * @param param.onDisconnect Call-back function for disconnect event
 * @param param.onNetworkChange Call-back function for update network event
 */
abstract class _AeppRpc extends _AccountResolver {
  name: string
  onAddressChange: (a: Accounts) => void
  onDisconnect: (p: any) => void
  onNetworkChange: (a: { networkId: string }) => void
  rpcClient?: RpcClient<WalletApi, AeppApi>
  _accounts?: Accounts

  init ({
    name,
    onAddressChange = () => {},
    onDisconnect = () => {},
    onNetworkChange = () => {},
    ...other
  }: {
    name: string
    onAddressChange: (a: Accounts) => void
    onDisconnect: (p: any) => void
    onNetworkChange: (a: Network) => void
  } & Parameters<_AccountResolver['init']>[0]): void {
    super.init(other)
    this.onAddressChange = onAddressChange
    this.onDisconnect = onDisconnect
    this.onNetworkChange = onNetworkChange
    this.name = name
  }

  _resolveAccount (account: Account = this.addresses()[0]): _AccountBase {
    if (typeof account === 'string') {
      const address = account as EncodedData<'ak'>
      decode(address)
      if (!this.addresses().includes(address)) throw new UnAuthorizedAccountError(address)
      account = AccountRpc({
        rpcClient: this.rpcClient, address, networkId: this.getNetworkId()
      })
    }
    if (account == null) this._ensureAccountAccess()
    return super._resolveAccount(account)
  }

  addresses (): Array<EncodedData<'ak'>> {
    if (this._accounts == null) return []
    const current = Object.keys(this._accounts.current)[0]
    return [
      ...current != null ? [current] : [], ...Object.keys(this._accounts.connected)
    ] as Array<EncodedData<'ak'>>
  }

  abstract addNode (name: string, node: any, select: boolean): void

  /**
   * Connect to wallet
   * @param connection Wallet connection object
   * @param [options={}]
   * @param [options.connectNode=true] - Request wallet to bind node
   * @param [options.name=wallet-node] - Node name
   * @param [options.select=false] - Select this node as current
   */
  async connectToWallet (
    connection: BrowserConnection,
    { connectNode = false, name = 'wallet-node', select = false }:
    { connectNode?: boolean, name?: string, select?: boolean } = {}
  ): Promise<WalletInfo> {
    if (this.rpcClient != null) throw new AlreadyConnectedError('You are already connected to wallet')
    let disconnectParams: any
    const client = new RpcClient<WalletApi, AeppApi>(
      connection,
      () => {
        delete this.rpcClient
        delete this._accounts
        this.onDisconnect(disconnectParams)
      }, {
        [METHODS.updateAddress]: (params) => {
          this._accounts = params
          this.onAddressChange(params)
        },
        [METHODS.updateNetwork]: async (params) => {
          const { node } = params
          if (node != null) this.addNode(node.name, await Node(node), true)
          this.onNetworkChange(params)
        },
        [METHODS.closeConnection]: (params) => {
          disconnectParams = params
          client.connection.disconnect()
        },
        [METHODS.readyToConnect]: () => {}
      }
    )
    const { node, ...walletInfo } = await client.request(
      METHODS.connect, { name: this.name, version: VERSION, connectNode }
    )
    if (connectNode) {
      if (node == null) throw new RpcConnectionError('Missing URLs of the Node')
      this.addNode(name, await Node(node), select)
    }
    this.rpcClient = client
    return walletInfo
  }

  /**
   * Disconnect from wallet
   */
  disconnectWallet (): void {
    this._ensureConnected()
    this.rpcClient.notify(METHODS.closeConnection, { reason: 'bye' })
    this.rpcClient.connection.disconnect()
  }

  /**
   * Ask addresses from wallet
   * @return Addresses from wallet
   */
  async askAddresses (): Promise<Array<EncodedData<'ak'>>> {
    this._ensureAccountAccess()
    return await this.rpcClient.request(METHODS.address, undefined)
  }

  /**
   * Subscribe for addresses from wallet
   * @param type Should be one of 'current' (the selected account), 'connected' (all)
   * @param value Subscription action
   * @return Accounts from wallet
   */
  async subscribeAddress (
    type: 'current' | 'connected', value: 'subscribe' | 'unsubscribe'
  ): Promise<ReturnType<WalletApi[METHODS.subscribeAddress]>> {
    this._ensureConnected()
    const result = await this.rpcClient.request(METHODS.subscribeAddress, { type, value })
    this._accounts = result.address
    return result
  }

  _ensureConnected (): asserts this is _AeppRpc & { rpcClient: NonNullable<_AeppRpc['rpcClient']> } {
    if (this.rpcClient != null) return
    throw new NoWalletConnectedError('You are not connected to Wallet')
  }

  _ensureAccountAccess (): asserts this is _AeppRpc & { rpcClient: NonNullable<_AeppRpc['rpcClient']> } {
    this._ensureConnected()
    if (this.addresses().length !== 0) return
    throw new UnsubscribedAccountError()
  }
}

export default AccountResolver.compose<_AeppRpc>({
  init: _AeppRpc.prototype.init,
  methods: {
    _resolveAccount: _AeppRpc.prototype._resolveAccount,
    addresses: _AeppRpc.prototype.addresses,
    connectToWallet: _AeppRpc.prototype.connectToWallet,
    disconnectWallet: _AeppRpc.prototype.disconnectWallet,
    askAddresses: _AeppRpc.prototype.askAddresses,
    subscribeAddress: _AeppRpc.prototype.subscribeAddress,
    _ensureConnected: _AeppRpc.prototype._ensureConnected,
    _ensureAccountAccess: _AeppRpc.prototype._ensureAccountAccess
  }
})
