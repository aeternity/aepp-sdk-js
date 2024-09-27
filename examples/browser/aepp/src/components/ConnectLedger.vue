<template>
  <div class="group">
    <div v-if="status">
      <div>Connection status</div>
      <div>{{ status }}</div>
    </div>
    <button v-else-if="!accountFactory" @click="connect">Connect</button>
    <template v-else>
      <button @click="disconnect">Disconnect</button>
      <button @click="addAccount">Add Account</button>
      <button v-if="accounts.length > 1" @click="switchAccount">Switch Account</button>
      <button @click="switchNode">Switch Node</button>
      <div v-if="accounts.length">
        <div>Accounts</div>
        <div>{{ accounts.map((account) => account.address.slice(0, 8)).join(', ') }}</div>
      </div>
    </template>
  </div>
</template>

<script>
import { AccountLedgerFactory } from '@aeternity/aepp-sdk';
import { mapState } from 'vuex';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

export default {
  data: () => ({
    status: '',
    accountFactory: null,
    accounts: [],
  }),
  computed: mapState(['aeSdk']),
  methods: {
    async connect() {
      try {
        this.status = 'Waiting for Ledger response';
        const transport = await TransportWebUSB.create();
        this.accountFactory = new AccountLedgerFactory(transport);
      } catch (error) {
        if (error.name === 'TransportOpenUserCancelled') return;
        throw error;
      } finally {
        this.status = '';
      }
    },
    async disconnect() {
      this.accountFactory = null;
      this.accounts = [];
      this.$store.commit('setAddress', undefined);
      if (Object.keys(this.aeSdk.accounts).length) this.aeSdk.removeAccount(this.aeSdk.address);
    },
    async addAccount() {
      try {
        this.status = 'Waiting for Ledger response';
        const idx = this.accounts.length;
        const account = await this.accountFactory.initialize(idx);
        this.status = `Ensure that ${account.address} is displayed on Ledger HW screen`;
        await this.accountFactory.getAddress(idx, true);
        this.accounts.push(account);
        this.setAccount(this.accounts[0]);
      } catch (error) {
        if (error.statusCode === 0x6985) return;
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
