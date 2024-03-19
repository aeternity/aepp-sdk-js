<template>
  <FieldAction
    title="Sign a jwt message"
    arg-title="JWT Message to sign"
    arg-placeholder='{"test": true}'
    action-title="JWT Sign message"
    :action-handler="messageSignJWT"
    result-title="JWT Message sign result"
  />
</template>

<script>
import { mapState } from 'vuex';
import FieldAction from './FieldAction.vue';

export default {
  components: { FieldAction },
  computed: mapState(['aeSdk']),
  methods: {
    messageSignJWT(messageToSign) {
      return this.aeSdk.signMessageJWT(JSON.parse(messageToSign));
    },
  },
};
</script>
