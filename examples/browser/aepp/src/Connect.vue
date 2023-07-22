<template>
  <div class="group">
    <div>
      <label>
        <input v-model="connectMethod" type="radio" value="default">
        Iframe or WebExtension
      </label>
    </div>
    <div>
      <label>
        <input v-model="connectMethod" type="radio" value="reverse-iframe">
        Reverse iframe
      </label>
      <div><input v-model="reverseIframeWalletUrl"></div>
    </div>

    <button
      v-if="walletConnected"
      @click="disconnect"
    >
      Disconnect
    </button>
    <button
      v-else-if="connectMethod"
      :disabled="walletConnecting"
      @click="connect"
    >
      Connect
    </button>

    <button
      v-if="cancelWalletDetection"
      @click="cancelWalletDetection"
    >
      Cancel detection
    </button>

    <template v-if="walletConnected">
      <br>
      <button @click="getAccounts">
        Get accounts
      </button>
      <button @click="subscribeAccounts('subscribe', 'current')">
        Subscribe current
      </button>
      <button @click="subscribeAccounts('unsubscribe', 'current')">
        Unsubscribe current
      </button>
      <button @click="subscribeAccounts('subscribe', 'connected')">
        Subscribe connected
      </button>
      <button @click="subscribeAccounts('unsubscribe', 'connected')">
        Unsubscribe connected
      </button>

      <div>
        <div>Accounts</div>
        <div>{{ rpcAccounts.map((account) => account.address.slice(0, 8)).join(', ') }}</div>
      </div>
    </template>
  </div>

  <div class="group">
    <div>
      <div>SDK status</div>
      <div>
        {{
          (walletConnected && 'Wallet connected')
          || (cancelWalletDetection && 'Wallet detection')
          || (walletConnecting && 'Wallet connecting')
          || 'Ready to connect to wallet'
        }}
      </div>
    </div>
    <div>
      <div>Wallet name</div>
      <div>{{ walletName }}</div>
    </div>
  </div>
</template>

<script>
import {
  walletDetector, BrowserWindowMessageConnection, RpcConnectionDenyError, RpcRejectedByUserError,
  WalletConnectorFrame,
} from '@aeternity/aepp-sdk';
import { mapState } from 'vuex';

export default {
  data: () => ({
    connectMethod: 'default',
    walletConnected: false,
    walletConnecting: null,
    reverseIframe: null,
    reverseIframeWalletUrl: process.env.VUE_APP_WALLET_URL ?? 'http://localhost:9000',
    walletInfo: null,
    cancelWalletDetection: null,
    rpcAccounts: [],
  }),
  computed: {
    ...mapState(['aeSdk']),
    walletName() {
      if (!this.walletConnected) return 'Wallet is not connected';
      return this.walletInfo.name;
    },
  },
  methods: {
    async getAccounts() {
      this.rpcAccounts = await this.walletConnector.getAccounts();
      if (this.rpcAccounts.length) this.setAccount(this.rpcAccounts[0]);
    },
    async subscribeAccounts(type, value) {
      await this.walletConnector.subscribeAccounts(type, value);
    },
    async detectWallets() {
      if (this.connectMethod === 'reverse-iframe') {
        this.reverseIframe = document.createElement('iframe');
        this.reverseIframe.src = this.reverseIframeWalletUrl;
        this.reverseIframe.style.display = 'none';
        document.body.appendChild(this.reverseIframe);
      }
      const connection = new BrowserWindowMessageConnection();
      return new Promise((resolve, reject) => {
        const stopDetection = walletDetector(connection, async ({ newWallet }) => {
          if (confirm(`Do you want to connect to wallet ${newWallet.info.name} with id ${newWallet.info.id}`)) {
            stopDetection();
            resolve(newWallet.getConnection());
            this.cancelWalletDetection = null;
            this.walletInfo = newWallet.info;
          }
        });
        this.cancelWalletDetection = () => {
          reject(new Error('Wallet detection cancelled'));
          stopDetection();
          this.cancelWalletDetection = null;
          if (this.reverseIframe) this.reverseIframe.remove();
        };
      });
    },
    async setNode(networkId) {
      const [{ name }] = (await this.aeSdk.getNodesInPool())
        .filter((node) => node.nodeNetworkId === networkId);
      this.aeSdk.selectNode(name);
      this.$store.commit('setNetworkId', networkId);
    },
    setAccount(account) {
      if (Object.keys(this.aeSdk.accounts).length) this.aeSdk.removeAccount(this.aeSdk.address);
      this.aeSdk.addAccount(account, { select: true });
      this.$store.commit('setAddress', account.address);
    },
    async connect() {
      this.walletConnecting = true;
      try {
        const connection = await this.detectWallets();
        try {
          this.walletConnector = await WalletConnectorFrame.connect('Simple æpp', connection);
        } catch (error) {
          if (error instanceof RpcConnectionDenyError) connection.disconnect();
          throw error;
        }
        this.walletConnector.on('disconnect', () => {
          this.walletConnected = false;
          this.walletInfo = null;
          this.rpcAccounts = [];
          this.$store.commit('setAddress', undefined);
          if (this.reverseIframe) this.reverseIframe.remove();
        });
        this.walletConnected = true;

        this.setNode(this.walletConnector.networkId);
        this.walletConnector.on('networkIdChange', (networkId) => this.setNode(networkId));

        this.walletConnector.on('accountsChange', (accounts) => {
          this.rpcAccounts = accounts;
          if (accounts.length) this.setAccount(accounts[0]);
        });
      } catch (error) {
        if (
          error.message === 'Wallet detection cancelled'
          || error instanceof RpcConnectionDenyError
          || error instanceof RpcRejectedByUserError
        ) return;
        throw error;
      } finally {
        this.walletConnecting = false;
      }
    },
    disconnect() {
      this.walletConnector.disconnect();
    },
  },
};
</script>
