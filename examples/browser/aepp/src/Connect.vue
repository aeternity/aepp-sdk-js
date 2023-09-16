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
} from '@aeternity/aepp-sdk';
import { mapState } from 'vuex';

export default {
  data: () => ({
    connectMethod: 'default',
    walletConnected: false,
    walletConnecting: null,
    reverseIframe: null,
    reverseIframeWalletUrl: process.env.VUE_APP_WALLET_URL ?? `http://${location.hostname}:9000`,
    walletInfo: null,
    cancelWalletDetection: null,
  }),
  computed: {
    ...mapState(['aeSdk']),
    walletName() {
      if (!this.walletConnected) return 'Wallet is not connected';
      return this.walletInfo.name;
    },
  },
  methods: {
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
    async connect() {
      this.walletConnecting = true;
      this.aeSdk.onDisconnect = () => {
        this.walletConnected = false;
        this.walletInfo = null;
        this.$store.commit('setAddress', undefined);
        if (this.reverseIframe) this.reverseIframe.remove();
      };
      try {
        const connection = await this.detectWallets();
        try {
          this.walletInfo = await this.aeSdk.connectToWallet(connection);
        } catch (error) {
          if (error instanceof RpcConnectionDenyError) connection.disconnect();
          throw error;
        }
        this.walletConnected = true;
        const { address: { current } } = await this.aeSdk.subscribeAddress('subscribe', 'connected');
        this.$store.commit('setAddress', Object.keys(current)[0]);
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
      this.aeSdk.disconnectWallet();
    },
  },
};
</script>
