<template>
  <div class="w-full p-4 flex flex-col h-screen bg-grey-light">
    <h1 class="mb-4">DApp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key
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

    <h2 class="mt-4">Send Money</h2>

    <div class="border mt-4 rounded">
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          From
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
          To
        </div>
        <div class="p-2 w-3/4 bg-white">
          <input class="bg-purple-lightest border-b border-black w-full h-full" v-model='to'  type="text" placeholder="ak$d55g5ffgThD4Hx3kf54tRoMUkK6HcoJ265HPBQjEFrg5tGERT">
        </div>
      </div>
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Amount
        </div>
        <div class="p-2 w-3/4 bg-white">
          <input class="bg-purple-lightest border-b border-black w-1/6 h-full" v-model='amount' type="number" placeholder="250">
          <span class="w-1/6">AE Tokens</span>
        </div>
      </div>
      <button class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 absolute text-xs" @click='send'>
        Send
      </button>
    </div>
  </div>
</template>

<script>
// AE_SDK_MODULES is a webpack alias present in webpack.config.js
import Aepp from 'AE_SDK_MODULES/ae/aepp.js'
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
      pub: null
    }
  },
  computed: {
  },
  methods: {
    send () {}
  },
  created () {
    Aepp({
      url: 'https://sdk-edgenet.aepps.com'
    }).then(ae => {
      this.account = ae
      ae.address()
        .then(address => { this.pub = address })
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
