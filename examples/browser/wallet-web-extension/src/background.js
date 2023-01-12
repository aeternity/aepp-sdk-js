import browser from 'webextension-polyfill';
import {
  AeSdkWallet, CompilerHttp, Node, MemoryAccount, generateKeyPair, BrowserRuntimeConnection,
  WALLET_TYPE, RpcConnectionDenyError, RpcRejectedByUserError,
} from '@aeternity/aepp-sdk';

let popupCounter = 0;
async function confirmInPopup(parameters) {
  const popupUrl = new URL(browser.runtime.getURL('./popup.html'));
  const popupId = popupCounter;
  popupCounter += 1;
  popupUrl.searchParams.set('data', JSON.stringify({ ...parameters, popupId }));
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
      await genConfirmCallback('sign transaction')(id, { ...options, transaction }, aeppOrigin);
    }
    return super.signTransaction(transaction, options);
  }

  async signMessage(message, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
    if (id != null) {
      await genConfirmCallback('sign message')(id, { ...options, message }, aeppOrigin);
    }
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
