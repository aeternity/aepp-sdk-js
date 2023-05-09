<template>
  <h2>Sign a message</h2>
  <div class="group">
    <div>
      <div>Message to sign</div>
      <div>
        <input
          v-model="messageToSign"
          placeholder="I want to <action name> at <time> on <network name>"
        >
      </div>
    </div>
    <button @click="messageSignPromise = messageSign()">
      Sign message
    </button>
    <div v-if="messageSignPromise">
      <div>Message sign result</div>
      <Value :value="messageSignPromise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Value from './Value.vue';

export default {
  components: { Value },
  data: () => ({
    messageToSign: '',
    messageSignPromise: null,
  }),
  computed: mapState(['aeSdk']),
  methods: {
    messageSign() {
      return this.aeSdk.signMessage(this.messageToSign);
    },
  },
};
</script>
