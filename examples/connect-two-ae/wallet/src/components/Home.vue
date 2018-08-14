<template>
  <div class="w-full p-4 flex justify-center flex-col bg-grey h-screen">
    <h1 class="mb-4">Wallet (BASE) App</h1>

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

    <div v-if="!dappUrl" class="w-full p-4 h-64 border border-black border-dashed shadow mx-auto mt-4 bg-grey-lighter">
      Loading DApp...
    </div>
    <!-- external app -->
    <iframe v-show="dappUrl" ref="dapp" class="w-full h-screen border border-black border-dashed mx-auto mt-4 shadow" src="about:blank" frameborder="1"></iframe>

  </div>
</template>

<script>
// AE_SDK_MODULES is a webpack alias present in webpack.config.js
import Wallet from 'AE_SDK_MODULES/ae/wallet.js'
import MemoryAccount from 'AE_SDK_MODULES/account/memory.js'

export default {
  name: 'Wallet',
  components: {},
  data () {
    return {
      pub: 'ak$s8NmcLjRZhD4Hx3kf54tRoMUkK6HcoJ265HPBQjBjHSYwrfD9',
      // get from secure storage
      priv: '828a283888c976253d39f9da69d0e146e9794a319d32bfad6698d258b7b3ebec71d1e1c03d340aed1a1d1033f633502adc33311ad22ee8e727a10fe0dc60c192',
      client: null,
      wallet: null,
      balance: null,
      height: null,
      dappUrl: '//0.0.0.0:9001'
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
      url: 'https://sdk-testnet.aepps.com',
      accounts: [MemoryAccount({keypair: {priv: this.priv, pub: this.pub}})],
      address: this.pub,
      // onTx: this.confirmDialog,
      // onChain: this.confirmDialog,
      onAccount: this.confirmDialog
    }).then(ae => {
      this.client = ae
      this.$refs.dapp.src = this.dappUrl

      ae.height().then(height => {
        this.height = height
      })

      ae.balance().then(balance => {
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
