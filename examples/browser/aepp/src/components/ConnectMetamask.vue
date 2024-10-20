<template>
  <div class="group">
    <button v-if="!accountFactory" @click="connect">Connect</button>
    <template v-else>
      <button @click="disconnect">Disconnect</button>
      <button @click="installSnap">Install Aeternity Snap</button>
      <button @click="addAccount">Add Account</button>
      <button v-if="accounts.length > 1" @click="switchAccount">Switch Account</button>
      <button @click="switchNode">Switch Node</button>
      <div v-if="accounts.length">
        <div>Accounts</div>
        <div>{{ accounts.map((account) => account.address.slice(0, 8)).join(', ') }}</div>
      </div>
    </template>
    <div v-if="status">
      <div>Status</div>
      <Value :value="status" />
    </div>
  </div>
</template>

<script>
import { AccountMetamaskFactory, UnsupportedPlatformError } from '@aeternity/aepp-sdk';
import { mapState } from 'vuex';
import Value from './Value.vue';

export default {
  components: { Value },
  created() {
    this.accountFactory = null;
  },
  data: () => ({
    status: '',
    accounts: [],
  }),
  computed: mapState(['aeSdk']),
  methods: {
    connect() {
      try {
        this.status = 'Waiting for MetaMask response';
        this.accountFactory = new AccountMetamaskFactory();
        this.status = '';
      } catch (error) {
        if (error instanceof UnsupportedPlatformError) {
          this.status = error.message;
          return;
        }
        this.status = '';
        throw error;
      }
    },
    disconnect() {
      this.accountFactory = null;
      this.accounts = [];
      this.$store.commit('setAddress', undefined);
      if (Object.keys(this.aeSdk.accounts).length) this.aeSdk.removeAccount(this.aeSdk.address);
    },
    async installSnap() {
      try {
        this.status = 'Waiting for MetaMask response';
        this.status = await this.accountFactory.installSnap();
      } catch (error) {
        if (error instanceof UnsupportedPlatformError) {
          this.status = error.message;
          return;
        }
        this.status = '';
        if (error.code === 4001) return;
        throw error;
      }
    },
    async addAccount() {
      try {
        this.status = 'Waiting for MetaMask response';
        const idx = this.accounts.length;
        const account = await this.accountFactory.initialize(idx);
        this.accounts.push(account);
        this.setAccount(this.accounts[0]);
      } catch (error) {
        if (error.code === 4001) return;
        throw error;
      } finally {
        this.status = '';
      }
    },
    switchAccount() {
      this.accounts.push(this.accounts.shift());
      this.setAccount(this.accounts[0]);
    },
    async switchNode() {
      const networkId = this.$store.state.networkId === 'ae_mainnet' ? 'ae_uat' : 'ae_mainnet';
      const [{ name }] = (await this.aeSdk.getNodesInPool()).filter(
        (node) => node.nodeNetworkId === networkId,
      );
      this.aeSdk.selectNode(name);
      this.$store.commit('setNetworkId', networkId);
    },
    setAccount(account) {
      if (Object.keys(this.aeSdk.accounts).length) this.aeSdk.removeAccount(this.aeSdk.address);
      this.aeSdk.addAccount(account, { select: true });
      this.$store.commit('setAddress', account.address);
    },
  },
};
</script>
