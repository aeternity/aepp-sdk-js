<template>
  <h2>Domain</h2>
  <div class="group">
    <div>
      <div>Name</div>
      <div>
        <input
          :value="domain.name"
          @input="domain.name = $event.target.value || null"
        >
      </div>
    </div>
    <div>
      <div>Version</div>
      <div>
        <input
          :value="domain.version"
          @input="domain.version = $event.target.value || null"
        >
      </div>
    </div>
    <div>
      <div>Network id</div>
      <div>
        <input
          :value="domain.networkId"
          @input="domain.networkId = $event.target.value || null"
        >
      </div>
    </div>
    <div>
      <div>Contract address</div>
      <div>
        <input
          :value="domain.contractAddress"
          @input="domain.contractAddress = $event.target.value || null"
        >
      </div>
    </div>
  </div>

  <h2>Data</h2>
  <div class="group">
    <div>
      <div>Type</div>
      <div>
        <textarea
          v-model="aci"
          placeholder="Type as ACI JSON"
        />
      </div>
    </div>
    <div>
      <div>Data</div>
      <div>
        <textarea v-model="data" />
      </div>
    </div>
    <div>
      <div>Encoded data</div>
      <Value :value="toPromise(() => dataEncoded)" />
    </div>
    <div>
      <div>Hash</div>
      <Value :value="toPromise(() => hash.toString('base64'))" />
    </div>
  </div>

  <h2>Sign</h2>
  <div class="group">
    <button @click="() => { signPromise = signTypedData(); }">
      Sign
    </button>
    <div v-if="signPromise">
      <div>Signature</div>
      <Value :value="signPromise" />
    </div>
  </div>

  <h2>Verify</h2>
  <div class="group">
    <div>
      <div>Signature</div>
      <div>
        <input
          v-model="verifySignature"
          placeholder="sg-encoded"
        >
      </div>
    </div>
    <div>
      <div>Signer address</div>
      <div>
        <input
          v-model="verifyAddress"
          placeholder="ak_..."
        >
      </div>
    </div>
    <button @click="() => { verifyPromise = verifyTypedData(); }">
      Verify
    </button>
    <div v-if="verifyPromise">
      <div>Is signature correct</div>
      <Value :value="verifyPromise" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import {
  hashTypedData, encodeFateValue, verify, decode,
} from '@aeternity/aepp-sdk';
import Value from './components/Value.vue';

export default {
  components: {
    Value,
  },
  data: () => ({
    domain: {
      name: 'Simple æpp',
      version: 2,
      networkId: 'ae_uat',
      contractAddress: null,
    },
    aci: Value.methods.valueToString({
      record: [
        { name: 'operation', type: 'string' },
        { name: 'parameter', type: 'int' },
      ],
    }),
    data: Value.methods.valueToString({
      operation: 'test',
      parameter: 42,
    }),
    signPromise: null,
    verifySignature: null,
    verifyAddress: null,
    verifyPromise: null,
  }),
  computed: {
    ...mapState(['aeSdk']),
    dataParsed() {
      return JSON.parse(this.data);
    },
    aciParsed() {
      return JSON.parse(this.aci);
    },
    dataEncoded() {
      return encodeFateValue(this.dataParsed, this.aciParsed);
    },
    hash() {
      return hashTypedData(this.dataEncoded, this.aciParsed, this.domain);
    },
  },
  methods: {
    async toPromise(getter) {
      return getter();
    },
    signTypedData() {
      return this.aeSdk.signTypedData(this.dataEncoded, this.aciParsed, this.domain);
    },
    async verifyTypedData() {
      return verify(this.hash, decode(this.verifySignature), this.verifyAddress);
    },
  },
};
</script>
