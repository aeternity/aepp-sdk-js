<template>
  <h2>Wallet Iframe</h2>

  <div class="group">
    <div>
      <div>Address</div>
      <div>{{ address }}</div>
    </div>
    <div>
      <div>Node</div>
      <div>{{ nodeName }}</div>
    </div>
    <div>
      <div>Balance</div>
      <Value :value="balancePromise" />
    </div>

    <button @click="switchAccount">Switch Account</button>
    <button @click="switchNode">Switch Node</button>
    <button @click="disconnect">Disconnect</button>
  </div>

  <iframe
    v-if="!runningInFrame"
    ref="aepp"
    src="http://localhost:9001"
  />
</template>

<script>
import {
  MemoryAccount, RpcWallet, Node, generateKeyPair,
  BrowserWindowMessageConnection, METHODS
} from '@aeternity/aepp-sdk'
import Value from './Value'

export default {
  components: { Value },
  data () {
    return {
      runningInFrame: window.parent !== window,
      // aeSdk: null, see https://github.com/aeternity/aepp-sdk-js/issues/1347
      nodeName: '',
      address: '',
      balancePromise: null,
    }
  },
  methods: {
    async shareWalletInfo (postFn, { interval = 5000, attemps = 5 } = {}) {
      this.aeSdk.shareWalletInfo(postFn)
      while (attemps -= 1) {
        await new Promise(resolve => setTimeout(resolve, interval))
        this.aeSdk.shareWalletInfo(postFn)
      }
      console.log('Finish sharing wallet info')
    },
    disconnect () {
      Object.values(this.aeSdk.rpcClients).forEach(client => {
        client.sendMessage({ method: METHODS.closeConnection }, true)
        client.disconnect()
      })
    },
    async switchAccount () {
      this.address = this.aeSdk.addresses().find(a => a !== this.address)
      this.aeSdk.selectAccount(this.address)
    },
    async switchNode () {
      this.nodeName = this.aeSdk.getNodesInPool()
        .map(({ name }) => name)
        .find(name => name !== this.nodeName)
      this.aeSdk.selectNode(this.nodeName)
    }
  },
  async mounted () {
    const genConfirmCallback = getActionName => (aepp, { accept, deny, params }) => {
      if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to ${getActionName(params)}`)) accept()
      else deny()
    }
    this.aeSdk = await RpcWallet({
      nodes: [
        { name: 'ae_uat', instance: await Node({ url: 'https://testnet.aeternity.io' }) },
        { name: 'ae_mainnet', instance: await Node({ url: 'https://mainnet.aeternity.io' }) },
      ],
      compilerUrl: 'https://compiler.aepps.com',
      accounts: [
        MemoryAccount({
          keypair: {
            publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR',
            secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b',
          }
        }),
        MemoryAccount({ keypair: generateKeyPair() })
      ],
      name: 'Wallet Iframe',
      onConnection: genConfirmCallback(() => 'connect'),
      onSubscription: genConfirmCallback(() => 'subscription'),
      onSign: genConfirmCallback(({ returnSigned, tx }) => `${returnSigned ? 'sign' : 'sign and broadcast'} ${JSON.stringify(tx)}`),
      onMessageSign: genConfirmCallback(() => 'message sign'),
      onAskAccounts: genConfirmCallback(() => 'get accounts'),
      onDisconnect (message, client) {
        this.shareWalletInfo(connection.sendMessage.bind(connection))
      }
    })
    this.nodeName = this.aeSdk.selectedNode.name
    this.address = this.aeSdk.addresses()[0]

    const target = this.runningInFrame ? window.parent : this.$refs.aepp.contentWindow
    const connection = new BrowserWindowMessageConnection({ target })
    this.aeSdk.addRpcClient(connection)
    this.shareWalletInfo(connection.sendMessage.bind(connection))

    this.$watch(
      ({ address, nodeName }) => [address, nodeName],
      ([address]) => {
        this.balancePromise = this.aeSdk.getBalance(address)
      },
      { immediate: true }
    )
  }
}
</script>

<style lang="scss" src="./styles.scss" />
