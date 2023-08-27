<template>
  <h2>Generate spend transaction</h2>
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
    <div>
      <div>Increment nonce by 1</div>
      <div>
        <input
          type="checkbox"
          v-model="incrementNonce"
        >
        (only if you want to pay for this transaction yourself)
      </div>
    </div>
    <button @click="() => { generatePromise = generate(); }">
      Generate
    </button>
    <div v-if="generatePromise">
      <div>Spend transaction</div>
      <Value :value="generatePromise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import {
  encode, Encoding, Tag, unpackTx, buildTx,
} from '@aeternity/aepp-sdk';
import Value from './Value.vue';

export default {
  components: { Value },
  data: () => ({
    spendTo: '',
    spendAmount: '',
    spendPayload: '',
    incrementNonce: true,
    generatePromise: null,
  }),
  computed: mapState(['aeSdk']),
  methods: {
    async generate() {
      let spendTx = await this.aeSdk.buildTx({
        tag: Tag.SpendTx,
        senderId: this.aeSdk.address,
        recipientId: this.spendTo,
        amount: this.spendAmount,
        payload: encode(new TextEncoder().encode(this.spendPayload), Encoding.Bytearray),
      });
      if (this.incrementNonce) {
        const spendTxParams = unpackTx(spendTx);
        spendTxParams.nonce += 1;
        spendTx = buildTx(spendTxParams);
      }
      return spendTx;
    },
  },
};
</script>
