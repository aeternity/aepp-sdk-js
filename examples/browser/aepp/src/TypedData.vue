<template>
  <h2>Domain</h2>
  <div class="group">
    <div>
      <div>Name</div>
      <div>
        <input :value="domain.name" @input="domain.name = $event.target.value || null" />
      </div>
    </div>
    <div>
      <div>Version</div>
      <div>
        <input :value="domain.version" @input="domain.version = $event.target.value || null" />
      </div>
    </div>
    <div>
      <div>Network id</div>
      <div>
        <input :value="domain.networkId" @input="domain.networkId = $event.target.value || null" />
      </div>
    </div>
    <div>
      <div>Contract address</div>
      <div>
        <input
          :value="domain.contractAddress"
          @input="domain.contractAddress = $event.target.value || null"
        />
      </div>
    </div>
  </div>

  <h2>Data</h2>
  <div class="group">
    <div>
      <div>Type</div>
      <div>
        <textarea v-model="aci" placeholder="Type as ACI JSON" />
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

  <FieldAction
    title="Sign"
    action-title="Sign"
    :action-handler="signTypedData"
    result-title="Signature"
  />

  <h2>Verify</h2>
  <div class="group">
    <div>
      <div>Signature</div>
      <div>
        <input v-model="verifySignature" placeholder="sg-encoded" />
      </div>
    </div>
    <div>
      <div>Signer address</div>
      <div>
        <input v-model="verifyAddress" placeholder="ak_..." />
      </div>
    </div>
    <button
      @click="
        () => {
          verifyPromise = verifyTypedData();
        }
      "
    >
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
import { hashTypedData, verifySignature, decode } from '@aeternity/aepp-sdk';
import { TypeResolver, ContractByteArrayEncoder } from '@aeternity/aepp-calldata';
import Value from './components/Value.vue';
import FieldAction from './components/FieldAction.vue';

export default {
  components: {
    Value,
    FieldAction,
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
      const dataType = new TypeResolver().resolveType(this.aciParsed);
      return new ContractByteArrayEncoder().encodeWithType(this.dataParsed, dataType);
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
      return verifySignature(this.hash, decode(this.verifySignature), this.verifyAddress);
    },
  },
};
</script>
