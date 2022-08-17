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
    <button @click="createPromise = create()">
      Create
    </button>
    <div v-if="createPromise">
      <div>Contract Instance</div>
      <Value :value="createPromise.then(() => 'Ready')" />
    </div>
  </div>

  <template v-if="createPromise">
    <h2>Compile Contract</h2>
    <div class="group">
      <button @click="compilePromise = compile()">
        Compile
      </button>
      <div v-if="compilePromise">
        <div>Bytecode</div>
        <Value :value="compilePromise" />
      </div>
    </div>
  </template>

  <template v-if="createPromise">
    <h2>Deploy Contract</h2>
    <div class="group">
      <div>
        <div>Deploy argument</div>
        <div>
          <input
            v-model="deployArg"
            placeholder="Deploy argument"
          >
        </div>
      </div>
      <button @click="deployPromise = deploy()">
        Deploy
      </button>
      <div v-if="deployPromise">
        <div>Deployed Contract</div>
        <Value :value="deployPromise" />
      </div>
    </div>
  </template>

  <template v-if="deployPromise">
    <h2>Call Contract</h2>
    <div class="group">
      <div>
        <div>Call argument</div>
        <div>
          <input
            v-model="callArg"
            placeholder="Call argument"
          >
        </div>
      </div>
      <button @click="callPromise = call()">
        Call
      </button>
      <div v-if="callPromise">
        <div>Call Result</div>
        <Value :value="callPromise" />
      </div>
    </div>
  </template>
</template>

<script>
import Value from './Value.vue'
import { mapState, mapGetters } from 'vuex'

const contractSourceCode = `
contract Multiplier =
  record state = { factor: int }
  entrypoint init(f : int) : state = { factor = f }
  entrypoint calc(x : int) = x * state.factor
`.trim()

export default {
  components: { Value },
  data: () => ({
    contractSourceCode,
    deployArg: 5,
    callArg: 7,
    createPromise: null,
    compilePromise: null,
    deployPromise: null,
    callPromise: null
  }),
  computed: {
    ...mapState('aeSdk', ['address', 'networkId']),
    ...mapGetters('aeSdk', ['aeSdk'])
  },
  methods: {
    create () {
      return this.aeSdk.getContractInstance({ sourceCode: this.contractSourceCode })
    },
    async compile () {
      return (await this.createPromise).$compile()
    },
    async deploy () {
      return (await this.createPromise).$deploy([this.deployArg])
    },
    async call () {
      return (await this.createPromise).calc(this.callArg)
    }
  }
}
</script>
