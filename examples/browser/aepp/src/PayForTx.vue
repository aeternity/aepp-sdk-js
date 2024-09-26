<template>
  <GenerateSpendTx />

  <FieldAction
    title="Sign inner transaction"
    arg-title="Transaction"
    arg-placeholder="tx_..."
    action-title="Sign"
    :action-handler="signInnerTx"
    result-title="Signed inner transaction"
  />

  <FieldAction
    title="Pay for transaction"
    arg-title="Signed inner transaction"
    arg-placeholder="tx_..."
    action-title="Pay for transaction"
    :action-handler="payForTx"
    result-title="Result"
  />
</template>

<script>
import { mapState } from 'vuex';
import FieldAction from './components/FieldAction.vue';
import SpendCoins from './components/SpendCoins.vue';
import MessageSign from './components/MessageSign.vue';
import GenerateSpendTx from './components/GenerateSpendTx.vue';

export default {
  components: {
    FieldAction,
    SpendCoins,
    MessageSign,
    GenerateSpendTx,
  },
  computed: mapState(['aeSdk']),
  methods: {
    signInnerTx(txToPayFor) {
      return this.aeSdk.signTransaction(txToPayFor, { innerTx: true });
    },
    payForTx(innerTx) {
      return this.aeSdk.payForTransaction(innerTx);
    },
  },
};
</script>
