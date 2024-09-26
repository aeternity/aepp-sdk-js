<template>
  <h2>Select network</h2>
  <div class="group">
    <div>
      <div>Select by</div>
      <div>
        <label>
          <input
            type="radio"
            value="networkId"
            v-model="mode"
          >
          Network ID
        </label>
        <label>
          <input
            type="radio"
            value="nodeUrl"
            v-model="mode"
          >
          Node URL
        </label>
      </div>
    </div>
    <div>
      <div>Payload</div>
      <div>
        <input
          v-model="payload"
          placeholder="Network ID or node URL"
        >
      </div>
    </div>
    <button @click="() => { promise = selectNetwork(); }">
      Select network
    </button>
    <div v-if="promise">
      <div>Select network result</div>
      <Value :value="promise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Value from './Value.vue';

export default {
  components: { Value },
  props: {
    select: { type: Function, required: true },
  },
  data: () => ({
    mode: 'networkId',
    payload: 'ae_mainnet',
    promise: null,
  }),
  methods: {
    async selectNetwork() {
      await this.select({ [this.mode]: this.payload });
      return 'Accepted by wallet';
    },
  },
};
</script>
