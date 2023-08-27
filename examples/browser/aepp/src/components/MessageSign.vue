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
import FieldAction from './FieldAction.vue';

export default {
  components: { FieldAction },
  computed: mapState(['aeSdk']),
  methods: {
    messageSign(messageToSign) {
      return this.aeSdk.signMessage(messageToSign);
    },
  },
};
</script>
