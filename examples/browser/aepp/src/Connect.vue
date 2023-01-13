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
      v-if="connectMethod && !walletConnected"
      :disabled="walletConnecting"
      @click="connect"
    >
      Connect
    </button>
    <button
      v-if="walletConnected"
      @click="disconnect"
    >
      Disconnect
    </button>
  </div>

  <div class="group">
    <div>
      <div>SDK status</div>
      <div>
        {{
          (walletConnected && 'Wallet connected')
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
  walletDetector, BrowserWindowMessageConnection, RpcConnectionDenyError,
} from '@aeternity/aepp-sdk';
import { mapGetters } from 'vuex';

export default {
  data: () => ({
    connectMethod: 'default',
    walletConnected: false,
    walletConnecting: null,
    reverseIframe: null,
    reverseIframeWalletUrl: 'http://localhost:9000',
    walletInfo: null,
  }),
  computed: {
    ...mapGetters('aeSdk', ['aeSdk']),
    walletName() {
      if (!this.aeSdk) return 'SDK is not ready';
      if (!this.walletConnected) return 'Wallet is not connected';
      return this.walletInfo.name;
    },
  },
  methods: {
    async scanForWallets() {
      return new Promise((resolve) => {
        let stopScan;

        const handleWallets = async ({ wallets, newWallet }) => {
          newWallet = newWallet || Object.values(wallets)[0];
          if (confirm(`Do you want to connect to wallet ${newWallet.info.name} with id ${newWallet.info.id}`)) {
            stopScan();
            resolve(newWallet.getConnection());
          }
        };

        const scannerConnection = new BrowserWindowMessageConnection();
        stopScan = walletDetector(scannerConnection, handleWallets);
      });
    },
    async connect() {
      this.walletConnecting = true;
      try {
        if (this.connectMethod === 'reverse-iframe') {
          this.reverseIframe = document.createElement('iframe');
          this.reverseIframe.src = this.reverseIframeWalletUrl;
          this.reverseIframe.style.display = 'none';
          document.body.appendChild(this.reverseIframe);
        }
        await this.$store.dispatch('aeSdk/initialize');
        const connection = await this.scanForWallets();
        try {
          this.walletInfo = await this.aeSdk.connectToWallet(connection);
        } catch (error) {
          if (error instanceof RpcConnectionDenyError) connection.disconnect();
          throw error;
        }
        this.walletConnected = true;
        const { address: { current } } = await this.aeSdk.subscribeAddress('subscribe', 'connected');
        this.$store.commit('aeSdk/setAddress', Object.keys(current)[0]);
      } finally {
        this.walletConnecting = false;
      }
    },
    async disconnect() {
      await this.aeSdk.disconnectWallet();
      this.walletConnected = false;
      if (this.reverseIframe) this.reverseIframe.remove();
      this.$emit('aeSdk', null);
    },
  },
};
</script>
