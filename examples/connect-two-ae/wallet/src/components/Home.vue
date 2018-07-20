<template>
  <div>
    <h1>{{ message }}</h1>
    <p>public key: {{pub}}</p>
    <p>height: {{height}}</p>
    <p>balance {{balance}}</p>

    <iframe src="about:blank" frameborder="1" id="aepp"></iframe>
  </div>
</template>

<script>
// AE_SDK_MODULES is a webpack alias present in webpack.config.js
import Wallet from 'AE_SDK_MODULES/ae/wallet.js'
import MemoryAccount from 'AE_SDK_MODULES/account/memory.js'

console.log(Wallet)

export default {
  name: 'Wallet',
  components: {},
  data () {
    return {
      message: 'Wallet',
      pub: 'ak$s8NmcLjRZhD4Hx3kf54tRoMUkK6HcoJ265HPBQjBjHSYwrfD9',
      // get from secure storage
      priv: '828a283888c976253d39f9da69d0e146e9794a319d32bfad6698d258b7b3ebec71d1e1c03d340aed1a1d1033f633502adc33311ad22ee8e727a10fe0dc60c192',
      client: null,
      wallet: null,
      balance: null,
      height: null
    }
  },
  computed: {
  },
  created () {
    window.addEventListener('message', console.log, false)

    function confirm (method, params, {id}) {
      return Promise.resolve(window.confirm(`User ${id} wants to run ${method} ${params}`))
    }

    Wallet({
      url: 'https://sdk-testnet.aepps.com',
      accounts: [MemoryAccount({keypair: {priv: this.priv, pub: this.pub}})],
      address: this.pub,
      onTx: confirm,
      onChain: confirm,
      onAccount: confirm
    }).then(ae => {
      this.client = ae
      document.getElementById('aepp').src = '//0.0.0.0:8080'

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
