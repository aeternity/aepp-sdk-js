import browser from 'webextension-polyfill';
import {
  AeSdkWallet, CompilerHttp, Node, MemoryAccount, generateKeyPair, BrowserRuntimeConnection,
  WALLET_TYPE, RpcConnectionDenyError, RpcRejectedByUserError,
} from '@aeternity/aepp-sdk';

const aeppInfo = {};
const genConfirmCallback = (actionName) => (aeppId) => {
  if (!confirm(`Client ${aeppInfo[aeppId].name} with id ${aeppId} want to ${actionName}`)) {
    throw new RpcRejectedByUserError();
  }
};

class AccountMemoryProtected extends MemoryAccount {
  async signTransaction(tx, { aeppRpcClientId: id, ...options } = {}) {
    if (id != null) genConfirmCallback(`sign transaction ${tx}`)(id);
    return super.signTransaction(tx, options);
  }

  async signMessage(message, { aeppRpcClientId: id, ...options } = {}) {
    if (id != null) genConfirmCallback(`sign message ${message}`)(id);
    return super.signMessage(message, options);
  }

  static generate() {
    // TODO: can inherit parent method after implementing https://github.com/aeternity/aepp-sdk-js/issues/1672
    return new AccountMemoryProtected(generateKeyPair().secretKey);
  }
}

const aeSdk = new AeSdkWallet({
  onCompiler: new CompilerHttp('https://v7.compiler.aepps.com'),
  nodes: [{
    name: 'testnet',
    instance: new Node('https://testnet.aeternity.io'),
  }],
  accounts: [
    new AccountMemoryProtected('bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b'),
    AccountMemoryProtected.generate(),
  ],
  id: browser.runtime.id,
  type: WALLET_TYPE.extension,
  name: 'Wallet WebExtension',
  // Hook for sdk registration
  onConnection(aeppId, params) {
    if (!confirm(`Aepp ${params.name} with id ${aeppId} wants to connect`)) {
      throw new RpcConnectionDenyError();
    }
    aeppInfo[aeppId] = params;
  },
  onDisconnect(msg, client) {
    console.log('Client disconnected:', client);
  },
  onSubscription: genConfirmCallback('subscription'),
  onAskAccounts: genConfirmCallback('get accounts'),
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
  setInterval(() => aeSdk.shareWalletInfo(clientId), 3000);
});

console.log('Wallet initialized!');
