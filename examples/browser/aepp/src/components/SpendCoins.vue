<template>
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
    <button @click="() => { spendPromise = spend(); }">
      Spend
    </button>
    <div v-if="spendPromise">
      <div>Spend result</div>
      <Value :value="spendPromise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { encode, Encoding } from '@aeternity/aepp-sdk';
import Value from './Value.vue';

export default {
  components: { Value },
  data: () => ({
    spendTo: '',
    spendAmount: '',
    spendPayload: '',
    spendPromise: null,
  }),
  computed: mapState(['aeSdk']),
  methods: {
    spend() {
      return this.aeSdk.spend(this.spendAmount, this.spendTo, {
        payload: encode(new TextEncoder().encode(this.spendPayload), Encoding.Bytearray),
      });
    },
  },
};
</script>
