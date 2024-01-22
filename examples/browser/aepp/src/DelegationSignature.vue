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
import { DelegationTag } from '@aeternity/aepp-sdk';
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
    sign() {
      switch (this.type) {
        case DelegationTag.AensPreclaim:
          return this.aeSdk.signDelegationToContract(this.contractAddress, { isOracle: false });
        case DelegationTag.Oracle:
          return this.aeSdk.signDelegationToContract(this.contractAddress, { isOracle: true });
        case DelegationTag.AensName:
          return this.aeSdk.signNameDelegationToContract(this.contractAddress, this.name);
        case DelegationTag.AensWildcard:
          return this.aeSdk.signAllNamesDelegationToContract(this.contractAddress);
        case DelegationTag.OracleResponse:
          return this.aeSdk
            .signOracleQueryDelegationToContract(this.contractAddress, this.oracleQueryId);
        default:
          throw new Error(`Unknown delegation signature type: ${DelegationTag[this.type]}`);
      }
    },
  },
};
</script>
