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
    <div>
      <div>RPC client</div>
      <div>status: {{ clientStatus ?? 'no client' }}, id: {{ clientId ?? 'not defined' }}</div>
    </div>

    <button @click="switchAccount">Switch Account</button>
    <button @click="switchNode">Switch Node</button>

    <button
      v-if="clientStatus === 'CONNECTED'"
      @click="disconnect"
    >
      Disconnect
    </button>
    <button
      v-else
      @click="() => (stopSharingWalletInfo ?? shareWalletInfo)()"
    >
      {{ stopSharingWalletInfo ? 'Stop sharing' : 'Share wallet info' }}
    </button>
  </div>

  <iframe
    v-if="!runningInFrame"
    ref="aepp"
    :src="aeppUrl"
  />
</template>

<script>
import {
  MemoryAccount, generateKeyPair, AeSdkWallet, Node, CompilerHttp,
  BrowserWindowMessageConnection, METHODS, WALLET_TYPE, RPC_STATUS,
  RpcConnectionDenyError, RpcRejectedByUserError, unpackTx, decodeFateValue,
} from '@aeternity/aepp-sdk';
import Value from './Value.vue';

export default {
  components: { Value },
  data: () => ({
    aeppUrl: process.env.VUE_APP_AEPP_URL ?? 'http://localhost:9001',
    runningInFrame: window.parent !== window,
    nodeName: '',
    address: '',
    balancePromise: null,
    clientId: null,
    clientStatus: null,
    stopSharingWalletInfo: null,
  }),
  methods: {
    shareWalletInfo({ interval = 5000, attempts = 5 } = {}) {
      const target = this.runningInFrame ? window.parent : this.$refs.aepp.contentWindow;
      const connection = new BrowserWindowMessageConnection({ target });
      this.clientId = this.aeSdk.addRpcClient(connection);

      this.aeSdk.shareWalletInfo(this.clientId);
      const intervalId = setInterval(() => {
        this.aeSdk.shareWalletInfo(this.clientId);
        attempts -= 1;
        if (!attempts) return this.stopSharingWalletInfo();
      }, interval);

      this.stopSharingWalletInfo = () => {
        clearInterval(intervalId);
        // TODO: replace with clientStatus
        const client = this.aeSdk._getClient(this.clientId);
        if (client.status === RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST) {
          this.aeSdk.removeRpcClient(this.clientId);
        }
        this.stopSharingWalletInfo = null;
      }
    },
    disconnect() {
      // TODO: move to removeRpcClient (would be a semi-breaking change)
      const client = this.aeSdk._getClient(this.clientId);
      if (client.status === RPC_STATUS.CONNECTED) {
        client.rpc.notify(METHODS.closeConnection, null);
      }

      this.aeSdk.removeRpcClient(this.clientId);
      this.clientId = null;
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
    updateClientStatus() {
      if (!this.clientId) {
        this.clientStatus = null;
        return;
      }
      const client = this.aeSdk._getClient(this.clientId);
      this.clientStatus = client.status;
    },
  },
  mounted() {
    const aeppInfo = {};
    const genConfirmCallback = (actionName) => (aeppId, parameters, origin) => {
      if (!confirm([
        `Client ${aeppInfo[aeppId].name} with id ${aeppId} at ${origin} want to ${actionName}`,
        Value.methods.valueToString(parameters),
      ].join('\n'))) {
        throw new RpcRejectedByUserError();
      }
    };

    class AccountMemoryProtected extends MemoryAccount {
      async signTransaction(tx, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
        if (id != null) {
          const opt = { ...options, unpackedTx: unpackTx(tx) };
          if (opt.onCompiler) opt.onCompiler = '<Compiler>';
          if (opt.onNode) opt.onNode = '<Node>';
          genConfirmCallback(`sign transaction ${tx}`)(id, opt, aeppOrigin);
        }
        return super.signTransaction(tx, options);
      }

      async signMessage(message, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
        if (id != null) {
          genConfirmCallback(`sign message ${message}`)(id, options, aeppOrigin);
        }
        return super.signMessage(message, options);
      }

      async signTypedData(data, aci, { aeppRpcClientId: id, aeppOrigin, ...options }) {
        if (id != null) {
          const opt = { ...options, aci, decodedData: decodeFateValue(data, aci) };
          genConfirmCallback(`sign typed data ${data}`)(id, opt, aeppOrigin);
        }
        return super.signTypedData(data, aci, options);
      }

      static generate() {
        // TODO: can inherit parent method after implementing https://github.com/aeternity/aepp-sdk-js/issues/1672
        return new AccountMemoryProtected(generateKeyPair().secretKey);
      }
    }

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
      onCompiler: new CompilerHttp('https://v7.compiler.aepps.com'),
      name: 'Wallet Iframe',
      onConnection: (aeppId, params, origin) => {
        if (!confirm(`Client ${params.name} with id ${aeppId} at ${origin} want to connect`)) {
          throw new RpcConnectionDenyError();
        }
        aeppInfo[aeppId] = params;
        setTimeout(() => this.stopSharingWalletInfo());
      },
      onSubscription: genConfirmCallback('subscription'),
      onAskAccounts: genConfirmCallback('get accounts'),
      onDisconnect: (clientId) => {
        console.log('disconnected client', clientId);
        this.clientId = null;
      },
    });

    if (this.runningInFrame) this.shareWalletInfo();

    this.nodeName = this.aeSdk.selectedNodeName;
    [this.address] = this.aeSdk.addresses();

    this.$watch(
      ({ address, nodeName }) => [address, nodeName],
      ([address]) => {
        this.balancePromise = this.aeSdk.getBalance(address);
      },
      { immediate: true },
    );

    // TODO: replace setInterval with subscription after refactoring
    setInterval(() => this.updateClientStatus(), 1000);
    this.$watch(({ clientId }) => [clientId], () => this.updateClientStatus(), { immediate: true });
  },
};
</script>

<style lang="scss" src="./styles.scss" />
