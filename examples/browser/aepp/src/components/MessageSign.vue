<template>
  <FieldAction
    title="Sign a message"
    arg-title="Message to sign"
    arg-placeholder="I want to <action name> at <time> on <network name>"
    action-title="Sign message"
    :action-handler="messageSign"
    result-title="Message sign result"
  />
</template>

<script>
import { mapState } from 'vuex';
import { verifyMessage } from '@aeternity/aepp-sdk';
import FieldAction from './FieldAction.vue';

export default {
  components: { FieldAction },
  computed: mapState(['aeSdk']),
  methods: {
    async messageSign(message) {
      const signature = await this.aeSdk.signMessage(message);
      if (!verifyMessage(message, signature, this.aeSdk.address)) {
        throw new Error('Invalid message signature returned by account');
      }
      return signature;
    },
  },
};
</script>
