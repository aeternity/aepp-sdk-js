<template>
  <div class="w-full p-4 flex flex-col">
    <h1 class="mb-4">Your Aepp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key <small>(from Identity Aepp)</small>
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{pub}}
        </div>
        <div v-if="!pub" class="p-2 w-3/4 bg-grey-lightest break-words text-grey">
          Requesting Public Key from AE Wallet...
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
    </div>

    <h2 class="mt-4">Compile Contract</h2>

    <div class="border mt-4 rounded">
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Contract By
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-white break-words">
          {{pub}}
        </div>
        <div v-if="!pub" class="p-2 w-3/4 bg-grey-lightest break-words text-grey">
          Requesting Public Key from AE Wallet...
        </div>
      </div>
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Contract Code
        </div>
        <div class="p-2 w-3/4 bg-white">
          <textarea class="bg-black text-white border-b border-black p-2 w-full h-64" v-model='contractCode' placeholder="contact code"/>
        </div>
      </div>
      <button class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click='onCompile'>
        Compile
      </button>
    </div>

    <div v-if="byteCode" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Compiled Code
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{byteCode}}
        </div>
      </div>
    </div>


  </div>
</template>

<script>
// AE_SDK_MODULES is a webpack alias present in webpack.config.js
import Aepp from 'AE_SDK_MODULES/ae/aepp.js'
// import Contract from 'AE_SDK_MODULES/ae/contract.js'
// import Cli from 'AE_SDK_MODULES/ae/cli.js'
// import Wallet from 'AE_SDK_MODULES/ae/wallet.js'
// import server from 'AE_SDK_MODULES/rpc/server.js'
// console.log(server)

export default {
  name: 'Home',
  components: {},
  data () {
    return {
      // get from secure storage
      client: null,
      to: null,
      amount: null,
      height: null,
      pub: null,
      contractCode: `contract Identity =
  type state = ()
  function main(x : int) = x`,
      byteCode: null
    }
  },
  computed: {
  },
  methods: {
    send () {},
    async compile (code) {
      console.log(`Compiling contract...`)
      try {
        console.log(await this.client.contractCompile(code))
        return await this.client.contractCompile(code)
      } catch (err) {
        this.compileError = err
        console.error(err)
      }
    },
    onCompile () {
      this.compile(this.contractCode)
        .then(byteCodeObj => {
          this.byteCode = byteCodeObj.bytecode
        })
    }
  },
  created () {
    Aepp({
      url: 'https://sdk-edgenet.aepps.com',
      internalUrl: 'https://sdk-edgenet.aepps.com'
    }).then(ae => {
      console.log('client: ', ae)
      this.client = ae
      ae.address()
        .then(address => {
          this.pub = address
          // Wallet.compose(Contract)({
          //   accounts: [MemoryAccount({keypair: {priv: this.account.priv, pub: this.account.pub}})]
          // })
        })
        .catch(e => { this.pub = `Rejected: ${e}` })

      // ae.sign('Hello World')
      //   .then(signed => { this.height = signed })
      //   .catch(e => { this.height = `Rejected: ${e}` })
    })
  }
}
</script>

<style scoped lang="css">
</style>
