<template>
  <div class="w-full p-4 flex justify-center flex-col bg-grey h-screen">
    <h1 class="mb-4">Identity (BASE) Aepp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest break-words">
          {{pub}}
        </div>
      </div>
      <div v-if="height" class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Height
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest">
          {{height}}
        </div>
      </div>
      <div v-if="height" class="bg-green w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Balance
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest">
          {{balance}}
        </div>
      </div>
    </div>

    <div v-if="!aeppUrl" class="w-full p-4 h-64 border border-black border-dashed shadow mx-auto mt-4 bg-grey-lighter">
      Loading Aepp...
    </div>
    <!-- external app -->
    <iframe v-show="aeppUrl" ref="aepp" class="w-full h-screen border border-black border-dashed bg-grey-light mx-auto mt-4 shadow" src="about:blank" frameborder="1"></iframe>

  </div>
</template>

<script>
// AE_SDK_MODULES is a webpack alias present in webpack.config.js
import Wallet from 'AE_SDK_MODULES/ae/wallet'
import MemoryAccount from 'AE_SDK_MODULES/account/memory'

export default {
  name: 'Wallet',
  components: {},
  data () {
    return {
      pub: 'ak_6A2vcm1Sz6aqJezkLCssUXcyZTX7X8D5UwbuS2fRJr9KkYpRU',
      priv: 'a7a695f999b1872acb13d5b63a830a8ee060ba688a478a08c6e65dfad8a01cd70bb4ed7927f97b51e1bcb5e1340d12335b2a2b12c8bc5221d63c4bcb39d41e61',
      client: null,
      wallet: null,
      balance: null,
      height: null,
      aeppUrl: '//0.0.0.0:9001'
    }
  },
  computed: {
  },
  methods: {
    confirmDialog (method, params, {id}) {
      // return new Promise((resolve, reject) => { resolve ('test') })
      return Promise.resolve(window.confirm(`User ${id} wants to run ${method} ${params}`))
    }
  },
  created () {
    window.addEventListener('message', console.log, false)

    Wallet({
      url: 'http://localhost:3013',
      internalUrl: 'http://localhost:3113',
      accounts: [MemoryAccount({keypair: {secretKey: this.priv, publicKey: this.pub}})],
      address: this.pub,
      onTx: this.confirmDialog,
      onChain: this.confirmDialog,
      onAccount: this.confirmDialog,
      onContract: this.confirmDialog,
      networkId: 'ae_devnet'
    }).then(ae => {
      this.client = ae
      console.log('status', this.client.api.getTopBlock())
      console.log('version', this.client.api.getStatus())
      this.$refs.aepp.src = this.aeppUrl

      ae.height().then(height => {
        console.log('height', height)
        this.height = height
      })
      console.log(ae)

      ae.balance(this.pub).then(balance => {
        console.log('balance', balance)
        this.balance = balance
      }).catch(e => {
        this.balance = 0
      })
    })
  }
}
</script>

<style scoped lang="css">
</style>
