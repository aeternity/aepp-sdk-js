<template>
  <h2>General information</h2>
  <div class="group">
    <div>
      <div>Address</div>
      <div>{{ address }}</div>
    </div>
    <div>
      <div>Balance</div>
      <Value :value="balancePromise" />
    </div>
    <div>
      <div>Height</div>
      <Value :value="heightPromise" />
    </div>
    <div>
      <div>Node info</div>
      <Value :value="nodeInfoPromise" />
    </div>
    <div>
      <div>Compiler version</div>
      <Value :value="compilerVersionPromise" />
    </div>
  </div>

  <SpendCoins />
</template>

<script>
import { mapState } from 'vuex';
import Value from './components/Value.vue';
import SpendCoins from './components/SpendCoins.vue';

export default {
  components: { Value, SpendCoins },
  data: () => ({
    balancePromise: null,
    heightPromise: null,
    nodeInfoPromise: null,
    compilerVersionPromise: null,
  }),
  computed: mapState(['aeSdk', 'address', 'networkId']),
  mounted() {
    this.$watch(
      ({ aeSdk, address, networkId }) => [aeSdk, address, networkId],
      ([aeSdk, address]) => {
        if (!aeSdk) return;
        this.compilerVersionPromise = aeSdk.compilerApi.version();
        this.balancePromise = aeSdk.getBalance(address);
        this.heightPromise = aeSdk.getHeight();
        this.nodeInfoPromise = aeSdk.getNodeInfo();
      },
      { immediate: true },
    );
  },
};
</script>
