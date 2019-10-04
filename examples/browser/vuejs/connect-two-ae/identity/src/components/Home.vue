<template>
  <div
    v-if="!runningInFrame"
    class="w-full p-4 flex justify-center flex-col bg-grey h-screen"
  >
    <h1 class="mb-4">Wallet Aepp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest break-words">
          {{publicKey}}
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
    <iframe v-show="aeppUrl" ref="aepp"
            class="w-full h-screen border border-black border-dashed bg-grey-light mx-auto mt-4 shadow" name="aepp"
            src="http://localhost:9001" frameborder="1"></iframe>
  </div>
</template>

<script>
  // AE_SDK_MODULES is a webpack alias present in webpack.config.js
  import { Wallet, MemoryAccount, Node } from '@aeternity/aepp-sdk/es'

  export default {
    data () {
      return {
        runningInFrame: window.parent !== window,
        publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR', // Your public key
        secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b', // Your private key
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
        nodes: [{ name: 'localNode', instance: await Node({ url: this.url, internalUrl: this.internalUrl }) }],
        compilerUrl: this.compilerUrl,
        accounts: [MemoryAccount({keypair: {secretKey: this.secretKey, publicKey: this.publicKey}})],
        address: this.publicKey,
        onTx: this.confirmDialog,
        onChain: this.confirmDialog,
        onAccount: this.confirmDialog,
        onContract: this.confirmDialog
      })

      if (!this.runningInFrame) this.$refs.aepp.src = this.aeppUrl
      else window.parent.postMessage({ jsonrpc: '2.0', method: 'ready' }, '*')

      this.height = await this.client.height()
      this.balance = await this.client.balance(this.publicKey).catch(() => 0)
    }
  }
</script>
