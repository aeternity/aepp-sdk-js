<template>
  <h2>Sign delegation to contract</h2>
  <div class="group">
    <div>
      <div>Contract address</div>
      <div><input v-model="contractAddress"></div>
    </div>
    <div>
      <label>
        <input v-model="type" type="radio" :value="DelegationTag.AensPreclaim">
        AENS preclaim
      </label>
    </div>
    <div>
      <label>
        <input v-model="type" type="radio" :value="DelegationTag.Oracle">
        Oracle
      </label>
    </div>
    <div>
      <label>
        <input v-model="type" type="radio" :value="DelegationTag.AensName">
        AENS name
      </label>
      <div><input v-model="name"></div>
    </div>
    <div>
      <label>
        <input v-model="type" type="radio" :value="DelegationTag.AensWildcard">
        All AENS names
      </label>
    </div>
    <div>
      <label>
        <input v-model="type" type="radio" :value="DelegationTag.OracleResponse">
        Response to oracle query
      </label>
      <div><input v-model="oracleQueryId"></div>
    </div>
    <button @click="() => { signPromise = sign(); }">
      Sign
    </button>
    <div v-if="signPromise">
      <div>Signature</div>
      <Value :value="signPromise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { DelegationTag, packDelegation } from '@aeternity/aepp-sdk';
import Value from './components/Value.vue';

export default {
  components: { Value },
  data: () => ({
    DelegationTag,
    type: DelegationTag.AensPreclaim,
    contractAddress: 'ct_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh',
    name: 'test.chain',
    oracleQueryId: 'oq_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh',
    signPromise: null,
  }),
  computed: mapState(['aeSdk']),
  methods: {
    getDelegationParams() {
      switch (this.type) {
        case DelegationTag.AensPreclaim:
          return { tag: DelegationTag.AensPreclaim };
        case DelegationTag.Oracle:
          return { tag: DelegationTag.Oracle };
        case DelegationTag.AensName:
          return { tag: DelegationTag.AensName, nameId: this.name };
        case DelegationTag.AensWildcard:
          return { tag: DelegationTag.AensWildcard };
        case DelegationTag.OracleResponse:
          return { tag: DelegationTag.OracleResponse, queryId: this.oracleQueryId };
        default:
          throw new Error(`Unknown delegation signature type: ${DelegationTag[this.type]}`);
      }
    },
    sign() {
      const delegation = packDelegation({
        ...this.getDelegationParams(),
        contractAddress: this.contractAddress,
        accountAddress: this.aeSdk.address,
      });
      return this.aeSdk.signDelegation(delegation);
    },
  },
};
</script>
