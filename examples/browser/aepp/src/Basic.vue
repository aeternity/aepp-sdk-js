<template>
  <h2>General information</h2>
  <div class="group">
    <div>
      <div>Address</div>
      <div>{{ address }}</div>
    </div>
    <div>
      <div>Balance</div>
      <Value :value="balancePromise" />
    </div>
    <div>
      <div>Height</div>
      <Value :value="heightPromise" />
    </div>
    <div>
      <div>Node info</div>
      <Value :value="nodeInfoPromise" />
    </div>
    <div>
      <div>Compiler version</div>
      <Value :value="compilerVersionPromise" />
    </div>
  </div>

  <h2>Spend tokens</h2>
  <div class="group">
    <div>
      <div>Recipient address</div>
      <div>
        <input
          v-model="spendTo"
          placeholder="ak_..."
        >
      </div>
    </div>
    <div>
      <div>Tokens amount</div>
      <div><input v-model="spendAmount"></div>
    </div>
    <div>
      <div>Payload</div>
      <div><input v-model="spendPayload"></div>
    </div>
    <button
      :disabled="!sdk"
      @click="spendPromise = spend()"
    >
      Spend
    </button>
    <div v-if="spendPromise">
      <div>Spend result</div>
      <Value :value="spendPromise" />
    </div>
  </div>
</template>

<script>
import Value from './Value.vue'

export default {
  components: { Value },
  props: {
    sdk: { type: Object, required: true },
    address: { type: String, default: '' },
    networkId: { type: String, default: '' },
  },
  data: () => ({
    balancePromise: null,
    heightPromise: null,
    nodeInfoPromise: null,
    compilerVersionPromise: null,
    spendTo: '',
    spendAmount: '',
    spendPayload: '',
    spendPromise: null
  }),
  mounted () {
    this.$watch(
      ({ sdk, address, networkId }) => [sdk, address, networkId],
      ([sdk, address]) => {
        if (!sdk) return
        this.compilerVersionPromise = sdk.getCompilerVersion()
        this.balancePromise = sdk.balance(address)
        this.heightPromise = sdk.height()
        this.nodeInfoPromise = sdk.getNodeInfo()
      },
      { immediate: true }
    )
  },
  methods: {
    spend () {
      return this.sdk.spend(this.spendAmount, this.spendTo, { payload: this.spendPayload })
    }
  }
}
</script>
