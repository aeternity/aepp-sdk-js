import { v4 as uuid } from '@aeternity/uuid';
import AeSdk from './AeSdk';
import verifyTransaction from './tx/validator';
import RpcClient from './aepp-wallet-communication/rpc/RpcClient';
import {
  METHODS, RPC_STATUS, SUBSCRIPTION_TYPES, WALLET_TYPE,
  RpcInvalidTransactionError,
  RpcNotAuthorizeError, RpcPermissionDenyError, RpcUnsupportedProtocolError,
} from './aepp-wallet-communication/schema';
import { InternalError, UnknownRpcClientError } from './utils/errors';
import AccountBase from './account/Base';
import BrowserConnection from './aepp-wallet-communication/connection/Browser';
import {
  Accounts,
  AeppApi,
  Network,
  RPC_VERSION,
  WalletApi,
  WalletInfo,
} from './aepp-wallet-communication/rpc/types';
import { Encoded } from './utils/encoder';
import jsonBig from './utils/json-big';

type RpcClientWallet = RpcClient<AeppApi, WalletApi>;

type OnConnection = (
  clientId: string, params: Omit<Parameters<WalletApi[METHODS.connect]>[0], 'version'>, origin: string
) => void;

type OnSubscription = (
  clientId: string, params: Parameters<WalletApi[METHODS.subscribeAddress]>[0], origin: string
) => void;

type OnDisconnect = (
  clientId: string, params: Parameters<WalletApi[METHODS.closeConnection]>[0]
) => void;

type OnAskAccounts = (
  clientId: string, params: undefined, origin: string
) => void;

interface RpcClientsInfo {
  id: string;
  status: RPC_STATUS;
  connectNode: boolean;
  addressSubscription: Set<'connected' | 'current'>;
  rpc: RpcClientWallet;
}

/**
 * Contain functionality for aepp interaction and managing multiple aepps
 * @category aepp wallet communication
 */
export default class AeSdkWallet extends AeSdk {
  id: string;

  _type: WALLET_TYPE;

  name: string;

  _clients = new Map<string, RpcClientsInfo>();

  onConnection: OnConnection;

  onSubscription: OnSubscription;

  onDisconnect: OnDisconnect;

  onAskAccounts: OnAskAccounts;

  /**
   * @param options - Options
   * @param options.name - Wallet name
   * @param options.id - Wallet id
   * @param options.type - Wallet type
   * @param options.onConnection - Call-back function for incoming AEPP connection
   * @param options.onSubscription - Call-back function for incoming AEPP account subscription
   * @param options.onAskAccounts - Call-back function for incoming AEPP get address request
   * @param options.onDisconnect - Call-back function for disconnect event
   */
  constructor({
    name,
    id,
    type,
    onConnection,
    onSubscription,
    onDisconnect,
    onAskAccounts,
    ...options
  }: {
    id: string;
    type: WALLET_TYPE;
    name: string;
    onConnection: OnConnection;
    onSubscription: OnSubscription;
    onDisconnect: OnDisconnect;
    onAskAccounts: OnAskAccounts;
  } & ConstructorParameters<typeof AeSdk>[0]) {
    super(options);
    this.onConnection = onConnection;
    this.onSubscription = onSubscription;
    this.onDisconnect = onDisconnect;
    this.onAskAccounts = onAskAccounts;
    this.name = name;
    this.id = id;
    this._type = type;
  }

  _getAccountsForClient({ addressSubscription }: RpcClientsInfo): Accounts {
    const { current, connected } = this.getAccounts();
    return {
      current: addressSubscription.has('current') || addressSubscription.has('connected')
        ? current : {},
      connected: addressSubscription.has('connected') ? connected : {},
    };
  }

  _pushAccountsToApps(): void {
    if (this._clients == null) return;
    Array.from(this._clients.keys())
      .filter((clientId) => this._isRpcClientConnected(clientId))
      .map((clientId) => this._getClient(clientId))
      .filter((client) => client.addressSubscription.size !== 0)
      .forEach((client) => client.rpc
        .notify(METHODS.updateAddress, this._getAccountsForClient(client)));
  }

  override selectAccount(address: Encoded.AccountAddress): void {
    super.selectAccount(address);
    this._pushAccountsToApps();
  }

  override addAccount(account: AccountBase, options?: Parameters<AeSdk['addAccount']>[1]): void {
    super.addAccount(account, options);
    this._pushAccountsToApps();
  }

  _getNode(): { node: Network['node'] } {
    this.ensureNodeConnected();
    return { node: { url: this.api.$host, name: this.selectedNodeName } };
  }

  override async selectNode(name: string): Promise<void> {
    super.selectNode(name);
    const networkId = await this.api.getNetworkId();
    Array.from(this._clients.keys())
      .filter((clientId) => this._isRpcClientConnected(clientId))
      .map((clientId) => this._getClient(clientId))
      .forEach((client) => {
        client.rpc.notify(METHODS.updateNetwork, {
          networkId,
          ...client.connectNode && this._getNode(),
        });
      });
  }

  _getClient(clientId: string): RpcClientsInfo {
    const client = this._clients.get(clientId);
    if (client == null) throw new UnknownRpcClientError(clientId);
    return client;
  }

  _isRpcClientConnected(clientId: string): boolean {
    return RPC_STATUS.CONNECTED === this._getClient(clientId).status
      && this._getClient(clientId).rpc.connection.isConnected();
  }

  _disconnectRpcClient(clientId: string): void {
    const client = this._getClient(clientId);
    client.rpc.connection.disconnect();
    client.status = RPC_STATUS.DISCONNECTED;
    client.addressSubscription = new Set();
  }

  /**
   * Remove specific RpcClient by ID
   * @param id - Client ID
   */
  removeRpcClient(id: string): void {
    this._disconnectRpcClient(id);
    this._clients.delete(id);
  }

  /**
   * Add new client by AEPP connection
   * @param clientConnection - AEPP connection object
   * @returns Client ID
   */
  addRpcClient(clientConnection: BrowserConnection): string {
    // @TODO  detect if aepp has some history based on origin????
    // if yes use this instance for connection
    const id = uuid();
    let disconnectParams: any;
    const client: RpcClientsInfo = {
      id,
      status: RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST,
      addressSubscription: new Set(),
      connectNode: false,
      rpc: new RpcClient<AeppApi, WalletApi>(
        clientConnection,
        () => {
          this._clients.delete(id);
          this.onDisconnect(id, disconnectParams); // also related info
        },
        {
          [METHODS.closeConnection]: (params) => {
            disconnectParams = params;
            this._disconnectRpcClient(id);
          },
          // Store client info and prepare two fn for each client `connect` and `denyConnection`
          // which automatically prepare and send response for that client
          [METHODS.connect]: async ({
            name, version, icons, connectNode,
          }, origin) => {
            if (version !== RPC_VERSION) throw new RpcUnsupportedProtocolError();

            await this.onConnection(id, { name, icons, connectNode }, origin);
            client.status = RPC_STATUS.CONNECTED;
            client.connectNode = connectNode;
            return {
              ...await this.getWalletInfo(),
              ...connectNode && this._getNode(),
            };
          },
          [METHODS.subscribeAddress]: async ({ type, value }, origin) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError();

            switch (type) {
              case SUBSCRIPTION_TYPES.subscribe:
                // TODO: remove `type` as it always subscribe
                await this.onSubscription(id, { type, value }, origin);
                client.addressSubscription.add(value);
                break;
              case SUBSCRIPTION_TYPES.unsubscribe:
                client.addressSubscription.delete(value);
                break;
              default:
                throw new InternalError(`Unknown subscription type: ${type}`);
            }

            return {
              subscription: Array.from(client.addressSubscription),
              address: this._getAccountsForClient(client),
            };
          },
          [METHODS.address]: async (params, origin) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError();
            await this.onAskAccounts(id, params, origin);
            return this.addresses();
          },
          [METHODS.sign]: async (
            {
              tx, onAccount = this.address, returnSigned, innerTx,
            },
            origin,
          ) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError();
            if (!this.addresses().includes(onAccount)) {
              throw new RpcPermissionDenyError(onAccount);
            }

            const parameters = {
              onAccount, aeppOrigin: origin, aeppRpcClientId: id, innerTx,
            };
            if (returnSigned || innerTx === true) {
              return { signedTransaction: await this.signTransaction(tx, parameters) };
            }
            try {
              return jsonBig.parse(jsonBig.stringify({
                transactionHash: await this.sendTransaction(tx, { ...parameters, verify: false }),
              }));
            } catch (error) {
              const validation = await verifyTransaction(tx, this.api);
              if (validation.length > 0) throw new RpcInvalidTransactionError(validation);
              throw error;
            }
          },
          [METHODS.signMessage]: async ({ message, onAccount = this.address }, origin) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError();
            if (!this.addresses().includes(onAccount)) {
              throw new RpcPermissionDenyError(onAccount);
            }

            const parameters = { onAccount, aeppOrigin: origin, aeppRpcClientId: id };
            return {
              signature: Buffer.from(await this.signMessage(message, parameters)).toString('hex'),
            };
          },
          [METHODS.signTypedData]: async ({
            domain, aci, data, onAccount = this.address,
          }, origin) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError();
            if (!this.addresses().includes(onAccount)) {
              throw new RpcPermissionDenyError(onAccount);
            }

            const parameters = {
              ...domain, onAccount, aeppOrigin: origin, aeppRpcClientId: id,
            };
            return {
              signature: await this.signTypedData(data, aci, parameters),
            };
          },
          [METHODS.signDelegationToContract]: async ({
            contractAddress, name, oracleQueryId, onAccount = this.address,
          }, origin) => {
            if (!this._isRpcClientConnected(id)) throw new RpcNotAuthorizeError();
            if (!this.addresses().includes(onAccount)) {
              throw new RpcPermissionDenyError(onAccount);
            }

            const parameters = { onAccount, aeppOrigin: origin, aeppRpcClientId: id };
            const signature = await (
              (name == null ? null : this
                .signNameDelegationToContract(contractAddress, name, parameters))
              ?? (oracleQueryId == null ? null : this
                .signOracleQueryDelegationToContract(contractAddress, oracleQueryId, parameters))
              ?? this.signDelegationToContract(contractAddress, parameters)
            );
            return { signature };
          },
        },
      ),
    };
    this._clients.set(id, client);
    return id;
  }

  /**
   * Send shareWalletInfo message to notify AEPP about wallet
   * @param clientId - ID of RPC client send message to
   */
  async shareWalletInfo(clientId: string): Promise<void> {
    this._getClient(clientId).rpc.notify(METHODS.readyToConnect, await this.getWalletInfo());
  }

  /**
   * Get Wallet info object
   * @returns Object with wallet information
   */
  async getWalletInfo(): Promise<WalletInfo> {
    return {
      id: this.id,
      name: this.name,
      networkId: await this.api.getNetworkId(),
      origin: window.location.origin,
      type: this._type,
    };
  }

  /**
   * Get Wallet accounts
   * @returns Object with accounts information (\{ connected: Object, current: Object \})
   */
  getAccounts(): Accounts {
    return {
      current: this.selectedAddress != null ? { [this.selectedAddress]: {} } : {},
      connected: this.addresses()
        .filter((a) => a !== this.selectedAddress)
        .reduce((acc, a) => ({ ...acc, [a]: {} }), {}),
    };
  }
}
