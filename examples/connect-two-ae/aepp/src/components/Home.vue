<template>
  <div>
    <h1>{{ message }}</h1>
    <p>public key: {{pub}}</p>
    <p>height: {{height}}</p>
    <div>
      <label>To:</label>
      <input v-model='to' type="">
    </div>
    <div>
      <label>Amount:</label>
      <input v-model='amount' type=""> AE
    </div>

    <p>From: {{pub}}</p>
    <p>To: {{to}}</p>
    <p>Amount: {{amount}}</p>
    <button @click='send'>Send TX</button>
  </div>
</template>

<script>
import Ae from 'AE_SDK/aepp-sdk.browser.js'
// import account from '../account.js'

export default {
  name: 'Home',
  components: {},
  data: {
    message: 'App',
    // get from secure storage
    client: null,
    to: null,
    amount: null,
    height: null,
    pub: null
  },
  computed: {
  },
  methods: {
    send () {}
  },
  created () {
    Ae.Aepp().then(ae => {
      this.account = ae
      ae.address()
        .then(address => { this.pub = address })
        .catch(e => { this.pub = `Rejected: ${e}` })

      ae.sign('Hello World')
        .then(signed => { this.height = signed })
        .catch(e => { this.height = `Rejected: ${e}` })
    })
  }
}
</script>

<style scoped lang="css">
</style>
