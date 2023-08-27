<template>
  <h2>Contract Instance</h2>
  <div class="group">
    <div>
      <div>Contract Source Code</div>
      <div>
        <textarea
          v-model="contractSourceCode"
          placeholder="Contact source code"
        />
      </div>
    </div>
    <button @click="() => { createPromise = create(); }">
      Create
    </button>
    <div v-if="createPromise">
      <div>Contract Instance</div>
      <Value :value="createPromise.then(() => 'Ready')" />
    </div>
  </div>

  <template v-if="contract">
    <FieldAction
      title="Compile Contract"
      action-title="Compile"
      :action-handler="compile"
      result-title="Bytecode"
    />
  </template>

  <template v-if="contract">
    <FieldAction
      title="Deploy Contract"
      arg-title="Deploy argument"
      arg-placeholder="Deploy argument"
      arg-default-value="5"
      action-title="Deploy"
      :action-handler="deploy"
      result-title="Deployed Contract"
    />
  </template>

  <template v-if="deployPromise">
    <FieldAction
      title="Call Contract"
      arg-title="Call argument"
      arg-placeholder="Call argument"
      arg-default-value="7"
      action-title="Call"
      :action-handler="call"
      result-title="Call Result"
    />
  </template>
</template>

<script>
import { shallowRef } from 'vue';
import { mapState } from 'vuex';
import Value from './components/Value.vue';
import FieldAction from './components/FieldAction.vue';

const contractSourceCode = `
contract Multiplier =
  record state = { factor: int }
  entrypoint init(f : int) : state = { factor = f }
  entrypoint calc(x : int) = x * state.factor
`.trim();

export default {
  components: { Value, FieldAction },
  data: () => ({
    contractSourceCode,
    createPromise: null,
    contract: null,
    deployPromise: null,
  }),
  computed: mapState(['aeSdk']),
  methods: {
    async create() {
      // Contract instance can't be in deep reactive https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/README.md#vue3
      this.contract = shallowRef(
        await this.aeSdk.initializeContract({ sourceCode: this.contractSourceCode }),
      );
    },
    async compile() {
      return this.contract.$compile();
    },
    async deploy(arg) {
      this.deployPromise = this.contract.$deploy([arg]);
      return this.deployPromise;
    },
    async call(arg) {
      return this.contract.calc(arg);
    },
  },
};
</script>
