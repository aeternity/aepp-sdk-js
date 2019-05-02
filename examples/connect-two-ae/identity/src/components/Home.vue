<template>
  <div class="w-full p-4 flex justify-center flex-col bg-grey h-screen">
    <h1 class="mb-4">Wallet Aepp</h1>

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
  data () {
    return {
      pub: 'ak_6A2vcm1Sz6aqJezkLCssUXcyZTX7X8D5UwbuS2fRJr9KkYpRU', // Your public key
      priv: 'a7a695f999b1872acb13d5b63a830a8ee060ba688a478a08c6e65dfad8a01cd70bb4ed7927f97b51e1bcb5e1340d12335b2a2b12c8bc5221d63c4bcb39d41e61', // Your private key
      client: null,
      balance: null,
      height: null,
      url: 'https://sdk-testnet.aepps.com',
      internalUrl: 'https://sdk-testnet.aepps.com',
      compilerUrl: 'https://compiler.aepps.com',
      aeppUrl: '//0.0.0.0:9001'
    }
  },
  methods: {
    confirmDialog (method, params, {id}) {
      return Promise.resolve(window.confirm(`User ${id} wants to run ${method} ${params}`))
    }
  },
  async created () {
    this.client = await Wallet({
      url: this.url,
      internalUrl: this.internalUrl,
      compilerUrl: this.compilerUrl,
      accounts: [MemoryAccount({keypair: {secretKey: this.priv, publicKey: this.pub}})],
      address: this.pub,
      onTx: this.confirmDialog,
      onChain: this.confirmDialog,
      onAccount: this.confirmDialog,
      onContract: this.confirmDialog
    })

    this.$refs.aepp.src = this.aeppUrl

    this.height = await this.client.height()
    this.balance = await this.client.balance(this.pub).catch(() => 0)
  }
}
</script>
