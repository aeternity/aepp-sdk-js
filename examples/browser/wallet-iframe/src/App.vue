<template>
  <h2>Wallet Iframe</h2>

  <div class="group">
    <div>
      <div>Address</div>
      <div>{{ address }}</div>
    </div>
    <div>
      <div>Node</div>
      <div>{{ nodeName }}</div>
    </div>
    <div>
      <div>Balance</div>
      <Value :value="balancePromise" />
    </div>

    <button @click="switchAccount">Switch Account</button>
    <button @click="switchNode">Switch Node</button>
    <button @click="disconnect">Disconnect</button>
  </div>

  <iframe
    v-if="!runningInFrame"
    ref="aepp"
    src="http://localhost:9001"
  />
</template>

<script>
import {
  MemoryAccount, generateKeyPair, AeSdkWallet, Node, CompilerHttp,
  BrowserWindowMessageConnection, METHODS, WALLET_TYPE,
  RpcConnectionDenyError, RpcRejectedByUserError,
} from '@aeternity/aepp-sdk';
import Value from './Value.vue';

export default {
  components: { Value },
  data() {
    return {
      runningInFrame: window.parent !== window,
      nodeName: '',
      address: '',
      balancePromise: null,
    };
  },
  methods: {
    async shareWalletInfo(clientId, { interval = 5000, attemps = 5 } = {}) {
      this.aeSdk.shareWalletInfo(clientId);
      while (attemps) {
        await new Promise((resolve) => {
          setTimeout(resolve, interval);
        });
        this.aeSdk.shareWalletInfo(clientId);
        attemps -= 1;
      }
      console.log('Finish sharing wallet info');
    },
    disconnect() {
      Object.values(this.aeSdk.rpcClients).forEach((client) => {
        client.notify(METHODS.closeConnection);
        client.disconnect();
      });
    },
    async switchAccount() {
      this.address = this.aeSdk.addresses().find((a) => a !== this.address);
      this.aeSdk.selectAccount(this.address);
    },
    async switchNode() {
      this.nodeName = (await this.aeSdk.getNodesInPool())
        .map(({ name }) => name)
        .find((name) => name !== this.nodeName);
      this.aeSdk.selectNode(this.nodeName);
    },
  },
  mounted() {
    const aeppInfo = {};
    const genConfirmCallback = (actionName) => (aeppId, parameters, origin) => {
      if (!confirm([
        `Client ${aeppInfo[aeppId].name} with id ${aeppId} at ${origin} want to ${actionName}`,
        JSON.stringify(parameters, null, 2),
      ].join('\n'))) {
        throw new RpcRejectedByUserError();
      }
    };

    class AccountMemoryProtected extends MemoryAccount {
      async signTransaction(tx, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
        if (id != null) {
          genConfirmCallback(`sign transaction ${tx}`)(id, options, aeppOrigin);
        }
        return super.signTransaction(tx, options);
      }

      async signMessage(message, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
        if (id != null) {
          genConfirmCallback(`sign message ${message}`)(id, options, aeppOrigin);
        }
        return super.signMessage(message, options);
      }

      static generate() {
        // TODO: can inherit parent method after implementing https://github.com/aeternity/aepp-sdk-js/issues/1672
        return new AccountMemoryProtected(generateKeyPair().secretKey);
      }
    }

    let clientId;
    this.aeSdk = new AeSdkWallet({
      id: window.origin,
      type: WALLET_TYPE.window,
      nodes: [
        { name: 'ae_uat', instance: new Node('https://testnet.aeternity.io') },
        { name: 'ae_mainnet', instance: new Node('https://mainnet.aeternity.io') },
      ],
      accounts: [
        new AccountMemoryProtected('9ebd7beda0c79af72a42ece3821a56eff16359b6df376cf049aee995565f022f840c974b97164776454ba119d84edc4d6058a8dec92b6edc578ab2d30b4c4200'),
        AccountMemoryProtected.generate(),
      ],
      onCompiler: new CompilerHttp('https://v7.compiler.stg.aepps.com'),
      name: 'Wallet Iframe',
      onConnection: (aeppId, params, origin) => {
        if (!confirm(`Client ${params.name} with id ${aeppId} at ${origin} want to connect`)) {
          throw new RpcConnectionDenyError();
        }
        aeppInfo[aeppId] = params;
      },
      onSubscription: genConfirmCallback('subscription'),
      onAskAccounts: genConfirmCallback('get accounts'),
      onDisconnect() {
        this.shareWalletInfo(clientId);
      },
    });

    this.nodeName = this.aeSdk.selectedNodeName;
    [this.address] = this.aeSdk.addresses();

    const target = this.runningInFrame ? window.parent : this.$refs.aepp.contentWindow;
    const connection = new BrowserWindowMessageConnection({ target });
    clientId = this.aeSdk.addRpcClient(connection);
    this.shareWalletInfo(clientId);

    this.$watch(
      ({ address, nodeName }) => [address, nodeName],
      ([address]) => {
        this.balancePromise = this.aeSdk.getBalance(address);
      },
      { immediate: true },
    );
  },
};
</script>

<style lang="scss" src="./styles.scss" />
