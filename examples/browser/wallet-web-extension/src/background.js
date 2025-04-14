import browser from 'webextension-polyfill';
import {
  AeSdkWallet,
  CompilerHttp,
  Node,
  MemoryAccount,
  BrowserRuntimeConnection,
  WALLET_TYPE,
  RpcConnectionDenyError,
  RpcRejectedByUserError,
  RpcNoNetworkById,
  unpackTx,
  unpackDelegation,
} from '@aeternity/aepp-sdk';
import { TypeResolver, ContractByteArrayEncoder } from '@aeternity/aepp-calldata';

function stringifyBigint(value) {
  return JSON.stringify(value, (k, v) => (typeof v === 'bigint' ? `${v} (as BigInt)` : v), 2);
}

let popupCounter = 0;
async function confirmInPopup(parameters) {
  const popupUrl = new URL(browser.runtime.getURL('./popup.html'));
  const popupId = popupCounter;
  popupCounter += 1;
  popupUrl.searchParams.set('data', stringifyBigint({ ...parameters, popupId }));
  await browser.windows.create({
    url: popupUrl.toString(),
    type: 'popup',
    height: 600,
    width: 600,
  });
  return new Promise((resolve) => {
    const handler = (message, sender, sendResponse) => {
      if (message.popupId !== popupId) return;
      resolve(message.response);
      sendResponse();
      browser.runtime.onMessage.removeListener(handler);
    };
    browser.runtime.onMessage.addListener(handler);
  });
}

const aeppInfo = {};
const genConfirmCallback = (action) => async (aeppId, parameters, aeppOrigin) => {
  const isConfirmed = await confirmInPopup({
    ...parameters,
    action,
    aeppId,
    aeppInfo: aeppInfo[aeppId],
    aeppOrigin,
  });
  if (!isConfirmed) throw new RpcRejectedByUserError();
};

class AccountMemoryProtected extends MemoryAccount {
  async signTransaction(transaction, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
    if (id != null) {
      const opt = { ...options, transaction, unpackedTx: unpackTx(transaction) };
      if (opt.onCompiler) opt.onCompiler = '<Compiler>';
      if (opt.onNode) opt.onNode = '<Node>';
      await genConfirmCallback('sign transaction')(id, opt, aeppOrigin);
    }
    return super.signTransaction(transaction, options);
  }

  async signMessage(message, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
    if (id != null) {
      await genConfirmCallback('sign message')(id, { ...options, message }, aeppOrigin);
    }
    return super.signMessage(message, options);
  }

  async signTypedData(data, aci, { aeppRpcClientId: id, aeppOrigin, ...options }) {
    if (id != null) {
      const dataType = new TypeResolver().resolveType(aci);
      const decodedData = new ContractByteArrayEncoder().decodeWithType(data, dataType);
      const opt = {
        ...options,
        aci,
        data,
        decodedData,
      };
      await genConfirmCallback('sign typed data')(id, opt, aeppOrigin);
    }
    return super.signTypedData(data, aci, options);
  }

  async unsafeSign(data, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
    if (id != null) {
      await genConfirmCallback(`sign raw data ${data}`)(id, options, aeppOrigin);
    }
    return super.unsafeSign(data, options);
  }

  async signDelegation(delegation, { aeppRpcClientId: id, aeppOrigin, ...options }) {
    if (id != null) {
      const opt = { ...options, ...unpackDelegation(delegation) };
      await genConfirmCallback('sign delegation')(id, opt, aeppOrigin);
    }
    return super.signDelegation(delegation, options);
  }

  static generate() {
    return new AccountMemoryProtected(super.generate().secretKey);
  }
}

const aeSdk = new AeSdkWallet({
  onCompiler: new CompilerHttp('https://v8.compiler.aepps.com'),
  nodes: [
    { name: 'ae_uat', instance: new Node('https://testnet.aeternity.io') },
    { name: 'ae_mainnet', instance: new Node('https://mainnet.aeternity.io') },
  ],
  accounts: [
    new AccountMemoryProtected('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf'),
    AccountMemoryProtected.generate(),
  ],
  id: browser.runtime.id,
  type: WALLET_TYPE.extension,
  name: 'Wallet WebExtension',
  async onConnection(aeppId, params, aeppOrigin) {
    const isConfirmed = await confirmInPopup({
      action: 'connect',
      aeppId,
      aeppInfo: params,
      aeppOrigin,
    });
    if (!isConfirmed) throw new RpcConnectionDenyError();
    aeppInfo[aeppId] = params;
  },
  onDisconnect(aeppId, payload) {
    console.log('Client disconnected:', aeppId, payload);
  },
  onSubscription: genConfirmCallback('subscription'),
  onAskAccounts: genConfirmCallback('get accounts'),
  async onAskToSelectNetwork(aeppId, parameters, origin) {
    await genConfirmCallback('select network')(aeppId, parameters, origin);
    if (parameters.networkId) {
      if (!this.pool.has(parameters.networkId)) throw new RpcNoNetworkById(parameters.networkId);
      await this.selectNode(parameters.networkId);
    } else {
      this.pool.delete('by-aepp');
      this.addNode('by-aepp', new Node(parameters.nodeUrl));
      await this.selectNode('by-aepp');
    }
  },
});
// The `ExtensionProvider` uses the first account by default.
// You can change active account using `selectAccount(address)` function

browser.runtime.onConnect.addListener((port) => {
  // create connection
  const connection = new BrowserRuntimeConnection({ port });
  // add new aepp to wallet
  const clientId = aeSdk.addRpcClient(connection);
  // share wallet details
  aeSdk.shareWalletInfo(clientId);
  const interval = setInterval(() => aeSdk.shareWalletInfo(clientId), 3000);
  port.onDisconnect.addListener(() => clearInterval(interval));
});

console.log('Wallet initialized!');
