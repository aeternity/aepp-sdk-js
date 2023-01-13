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

  <h2>Spend coins</h2>
  <div class="group">
    <div>
      <div>Recipient address</div>
      <div>
        <input
          v-model="spendTo"
          placeholder="ak_..."
        >
      </div>
    </div>
    <div>
      <div>Coins amount</div>
      <div><input v-model="spendAmount"></div>
    </div>
    <div>
      <div>Payload</div>
      <div><input v-model="spendPayload"></div>
    </div>
    <button
      :disabled="!aeSdk"
      @click="spendPromise = spend()"
    >
      Spend
    </button>
    <div v-if="spendPromise">
      <div>Spend result</div>
      <Value :value="spendPromise" />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { encode, Encoding } from '@aeternity/aepp-sdk';
import Value from './Value.vue';

export default {
  components: { Value },
  data: () => ({
    balancePromise: null,
    heightPromise: null,
    nodeInfoPromise: null,
    compilerVersionPromise: null,
    spendTo: '',
    spendAmount: '',
    spendPayload: '',
    spendPromise: null,
  }),
  computed: {
    ...mapState('aeSdk', ['address', 'networkId']),
    ...mapGetters('aeSdk', ['aeSdk']),
  },
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
  methods: {
    spend() {
      return this.aeSdk.spend(this.spendAmount, this.spendTo, {
        payload: encode(new TextEncoder().encode(this.spendPayload), Encoding.Bytearray),
      });
    },
  },
};
</script>
