<template>
  <h2>Sign delegation to contract</h2>
  <div class="group">
    <div>
      <div>Contract address</div>
      <div><input v-model="contractAddress"></div>
    </div>
    <div>
      <label>
        <input v-model="type" type="radio" value="general">
        AENS and oracle
      </label>
    </div>
    <div>
      <label>
        <input v-model="type" type="radio" value="name">
        AENS name
      </label>
      <div><input v-model="name"></div>
    </div>
    <div>
      <label>
        <input v-model="type" type="radio" value="oracle-query">
        Oracle query
      </label>
      <div><input v-model="oracleQueryId"></div>
    </div>
    <button @click="signPromise = sign()">
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
import Value from './components/Value.vue';

export default {
  components: { Value },
  data: () => ({
    type: 'general',
    contractAddress: 'ct_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh',
    name: 'test.chain',
    oracleQueryId: 'oq_6y3N9KqQb74QsvR9NrESyhWeLNiA9aJgJ7ua8CvsTuGot6uzh',
    signPromise: null,
  }),
  computed: mapState(['aeSdk']),
  methods: {
    sign() {
      switch (this.type) {
        case 'general':
          return this.aeSdk.signDelegationToContract(this.contractAddress);
        case 'name':
          return this.aeSdk.signNameDelegationToContract(this.contractAddress, this.name);
        case 'oracle-query':
          return this.aeSdk
            .signOracleQueryDelegationToContract(this.contractAddress, this.oracleQueryId);
        default:
          throw new Error(`Unknown delegation signature type: ${this.type}`)
      }
    },
  },
};
</script>
