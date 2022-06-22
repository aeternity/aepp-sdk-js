import browser from 'webextension-polyfill';
import {
  AeSdkWallet, Node, MemoryAccount, generateKeyPair, BrowserRuntimeConnection, WALLET_TYPE,
  RpcConnectionDenyError, RpcRejectedByUserError,
} from '@aeternity/aepp-sdk';

(async () => {
  const aeppInfo = {};

  const aeSdk = new AeSdkWallet({
    compilerUrl: 'https://compiler.aepps.com',
    nodes: [{
      name: 'testnet',
      instance: new Node('https://testnet.aeternity.io'),
    }],
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
    onSubscription(aeppId) {
      const { name } = aeppInfo[aeppId];
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to subscribe for accounts`)) {
        throw new RpcRejectedByUserError();
      }
    },
    onSign(aeppId, params) {
      const { name } = aeppInfo[aeppId];
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to sign tx ${params.tx}`)) {
        throw new RpcRejectedByUserError();
      }
    },
    onAskAccounts(aeppId) {
      const { name } = aeppInfo[aeppId];
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to get accounts`)) {
        throw new RpcRejectedByUserError();
      }
    },
    onMessageSign(aeppId, params) {
      const { name } = aeppInfo[aeppId];
      if (!confirm(`Aepp ${name} with id ${aeppId} wants to sign msg ${params.message}`)) {
        throw new RpcRejectedByUserError();
      }
    },
  });
  // The `ExtensionProvider` uses the first account by default.
  // You can change active account using `selectAccount(address)` function
  await aeSdk.addAccount(new MemoryAccount({
    keypair: {
      publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
      secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b',
    },
  }), { select: true });
  await aeSdk.addAccount(new MemoryAccount({ keypair: generateKeyPair() }));

  browser.runtime.onConnect.addListener((port) => {
    // create connection
    const connection = new BrowserRuntimeConnection({ port });
    // add new aepp to wallet
    const clientId = aeSdk.addRpcClient(connection);
    // share wallet details
    aeSdk.shareWalletInfo(clientId);
  });

  console.log('Wallet initialized!');
})();
