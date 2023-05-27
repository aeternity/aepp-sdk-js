<template>
  <GenerateSpendTx />

  <h2>Sign inner transaction</h2>
  <div class="group">
    <div>
      <div>Transaction</div>
      <div>
        <input
          v-model="txToPayFor"
          placeholder="tx_..."
        >
      </div>
    </div>
    <button @click="signInnerTxPromise = signInnerTx()">
      Sign
    </button>
    <div v-if="signInnerTxPromise">
      <div>Signed inner transaction</div>
      <Value :value="signInnerTxPromise" />
    </div>
  </div>

  <h2>Pay for transaction</h2>
  <div class="group">
    <div>
      <div>Signed inner transaction</div>
      <div>
        <input
          v-model="innerTx"
          placeholder="tx_..."
        >
      </div>
    </div>
    <button @click="payForTxPromise = payForTx()">
      Pay for transaction
    </button>
    <div v-if="payForTxPromise">
      <div>Result</div>
      <Value :value="payForTxPromise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Value from './components/Value.vue';
import SpendCoins from './components/SpendCoins.vue';
import MessageSign from './components/MessageSign.vue';
import GenerateSpendTx from './components/GenerateSpendTx.vue';

export default {
  components: {
    Value, SpendCoins, MessageSign, GenerateSpendTx,
  },
  data: () => ({
    innerTx: '',
    txToPayFor: '',
    signInnerTxPromise: null,
    payForTxPromise: null,
  }),
  computed: mapState(['aeSdk']),
  methods: {
    signInnerTx() {
      return this.aeSdk.signTransaction(this.txToPayFor, { innerTx: true });
    },
    payForTx() {
      return this.aeSdk.payForTransaction(this.innerTx);
    },
  },
};
</script>
