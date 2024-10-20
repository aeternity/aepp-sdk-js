<template>
  <h2>Generate a JWT</h2>
  <div class="group">
    <div>
      <div>Payload as JSON</div>
      <div>
        <input :value="payloadAsJson" @input="payloadAsJson = $event.target.value || '{}'" />
      </div>
    </div>
    <div>
      <div>Include "sub_jwk"</div>
      <div>
        <input type="checkbox" v-model="includeSubJwk" />
      </div>
    </div>
    <button
      @click="
        () => {
          signPromise = sign();
        }
      "
    >
      Sign
    </button>
    <div v-if="signPromise">
      <div>Signed JWT</div>
      <Value :value="signPromise" />
    </div>
  </div>

  <h2>Unpack and verify JWT</h2>
  <div class="group">
    <div>
      <div>JWT to unpack</div>
      <div>
        <input :value="jwt" @input="jwt = $event.target.value || null" />
      </div>
    </div>
    <div>
      <div>Signer address</div>
      <div>
        <input :value="address" @input="address = $event.target.value || null" />
      </div>
    </div>
    <button
      @click="
        () => {
          unpackPromise = unpack();
        }
      "
    >
      Unpack
    </button>
    <div v-if="unpackPromise">
      <div>Unpack result</div>
      <Value :value="unpackPromise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { unpackJwt, signJwt } from '@aeternity/aepp-sdk';
import Value from './components/Value.vue';

export default {
  components: { Value },
  computed: mapState(['aeSdk']),
  data: () => ({
    payloadAsJson: '{ "test": true }',
    includeSubJwk: true,
    signPromise: null,
    jwt: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJzdWJfandrIjp7ImNydiI6IkVkMjU1MTkiLCJrdHkiOiJPS1AiLCJ4IjoiaEF5WFM1Y1dSM1pGUzZFWjJFN2NUV0JZcU43SksyN2NWNHF5MHd0TVFnQSJ9LCJ0ZXN0IjoiZGF0YSJ9.u9El4b2O2LRhvTTW3g46vk1hx0xXWPkJEaEeEy-rLzLr2yuQlNc7qIdcr_z06BgHx5jyYv2CpUL3hqLpc0RzBA',
    address: null,
    unpackPromise: null,
  }),
  methods: {
    async sign() {
      const payload = JSON.parse(this.payloadAsJson);
      if (!this.includeSubJwk) payload.sub_jwk = undefined;
      // TODO: expose account used in aepp-wallet connection
      return signJwt(payload, this.aeSdk._resolveAccount(this.aeSdk.address));
    },
    async unpack() {
      return unpackJwt(this.jwt, this.address);
    },
  },
};
</script>
