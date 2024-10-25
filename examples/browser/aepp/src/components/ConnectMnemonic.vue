<template>
  <div class="group">
    <div v-if="status">
      <div>Status</div>
      <div>{{ status }}</div>
    </div>
    <template v-else-if="!accountFactory">
      <div>
        <div>Mnemonic phrase</div>
        <div>
          <input placeholder="cross cat upper state flame ..." v-model="mnemonic" />
        </div>
      </div>
      <button @click="connect">Connect</button>
    </template>
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
import { AccountMnemonicFactory } from '@aeternity/aepp-sdk';
import { shallowRef, toRaw } from 'vue';
import { mapState } from 'vuex';

export default {
  data: () => ({
    status: '',
    mnemonic: 'eye quarter chapter suit cruel scrub verify stuff volume control learn dust',
    accountFactory: shallowRef(null),
    accounts: [],
  }),
  computed: mapState(['aeSdk']),
  methods: {
    async connect() {
      try {
        this.status = 'Deriving a wallet from mnemonic phrase';
        this.accountFactory = new AccountMnemonicFactory(this.mnemonic);
        await this.accountFactory.getWallet();
        this.status = '';
      } catch (error) {
        this.accountFactory = null;
        if (error.message === 'Invalid mnemonic') {
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
    async addAccount() {
      this.status = 'Deriving an account';
      const idx = this.accounts.length;
      const account = await this.accountFactory.initialize(idx);
      this.accounts.push(account);
      this.setAccount(toRaw(this.accounts[0]));
      this.status = '';
    },
    switchAccount() {
      this.accounts.push(this.accounts.shift());
      this.setAccount(toRaw(this.accounts[0]));
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
