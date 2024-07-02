<template>
  <input id="toggle-aepp" type="checkbox" />
  <h2>
    Wallet Iframe
    <label for="toggle-aepp" />
  </h2>

  <div class="group">
    <div>
      <div>Aepp URL</div>
      <form
        novalidate
        @submit.prevent="navigate"
      >
        <input
          type="url"
          v-model="nextAeppUrl"
          @focus="$event.target.select()"
        >
      </form>
    </div>
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
  RpcConnectionDenyError, RpcRejectedByUserError, unpackTx, unpackDelegation,
} from '@aeternity/aepp-sdk';
import { TypeResolver, ContractByteArrayEncoder } from '@aeternity/aepp-calldata';
import Value from './Value.vue';

export default {
  components: { Value },
  data: () => ({
    nextAeppUrl: process.env.VUE_APP_AEPP_URL ?? `http://${location.hostname}:9001`,
    aeppUrl: '',
    runningInFrame: window.parent !== window,
    nodeName: '',
    address: '',
    balancePromise: null,
    clientId: null,
    clientStatus: null,
    stopSharingWalletInfo: null,
  }),
  methods: {
    navigate() {
      if (!/^https?:\/\//.test(this.nextAeppUrl) && !this.nextAeppUrl.startsWith('.')) {
        this.nextAeppUrl = 'http://' + this.nextAeppUrl;
      }
      this.aeppUrl = '';
      this.$nextTick(() => {
        this.aeppUrl = this.nextAeppUrl;
      });
    },
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
      const names = (await this.aeSdk.getNodesInPool()).map(({ name }) => name);
      this.nodeName = names[(names.indexOf(this.nodeName) + 1) % names.length];
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
    this.navigate();

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
          const dataType = new TypeResolver().resolveType(aci);
          const decodedData = new ContractByteArrayEncoder().decodeWithType(data, dataType);
          const opt = { ...options, aci, decodedData };
          genConfirmCallback(`sign typed data ${data}`)(id, opt, aeppOrigin);
        }
        return super.signTypedData(data, aci, options);
      }

      async sign(data, { aeppRpcClientId: id, aeppOrigin, ...options } = {}) {
        if (id != null) {
          genConfirmCallback(`sign raw data ${data}`)(id, options, aeppOrigin);
        }
        return super.sign(data, options);
      }

      async signDelegation(delegation, { aeppRpcClientId: id, aeppOrigin, ...options }) {
        if (id != null) {
          const opt = { ...options, ...unpackDelegation(delegation) };
          genConfirmCallback('sign delegation')(id, opt, aeppOrigin);
        }
        return super.signDelegation(delegation, options);
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
        new AccountMemoryProtected('sk_2CuofqWZHrABCrM7GY95YSQn8PyFvKQadnvFnpwhjUnDCFAWmf'),
        AccountMemoryProtected.generate(),
      ],
      onCompiler: new CompilerHttp('https://v8.compiler.aepps.com'),
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

<style lang="scss" scoped>
input[id=toggle-aepp] {
  display: none;
}

label[for=toggle-aepp]::after {
  font-size: initial;
  font-weight: initial;
  text-decoration: underline dotted;
  cursor: pointer;
}

@media (max-width: 450px), (max-height: 650px) {
  input[id=toggle-aepp] {
    &:checked ~ {
      h2 label[for=toggle-aepp]::after {
        content: 'Hide aepp';
      }

      .group {
        display: none;
      }
    }

    &:not(:checked) ~ {
      h2 label[for=toggle-aepp]::after {
        content: 'Show aepp';
      }

      iframe {
        display: none;
      }
    }
  }
}
</style>
