<template>
  <div class="group">
    <div>
      <label>
        <input v-model="connectMethod" type="radio" value="default">
        Iframe or WebExtension
      </label>
    </div>
    <div>
      <label>
        <input v-model="connectMethod" type="radio" value="reverse-iframe">
        Reverse iframe
      </label>
      <div><input v-model="reverseIframeWalletUrl"></div>
    </div>
    <button
      v-if="connectMethod && !walletConnected"
      @click="connectPromise = connect().then(() => 'Ready')"
    >
      Connect
    </button>
    <button
      v-if="walletConnected"
      @click="disconnect"
    >
      Disconnect
    </button>
  </div>

  <div class="group">
    <div>
      <div>SDK status</div>
      <Value :value="connectPromise" />
    </div>
    <div>
      <div>Wallet name</div>
      <div>{{ walletName || 'Not connected' }}</div>
    </div>
  </div>
</template>

<script>
import { RpcAepp, Node, WalletDetector, BrowserWindowMessageConnection } from '@aeternity/aepp-sdk'
import Value from './Value'

const TESTNET_NODE_URL = 'https://testnet.aeternity.io'
const MAINNET_NODE_URL = 'https://mainnet.aeternity.io'
const COMPILER_URL = 'https://compiler.aepps.com'

export default {
  components: { Value },
  emits: {
    aeSdk: Object,
    address: String,
    networkId: String,
  },
  data: () => ({
    aeSdk: null,
    connectMethod: 'default',
    walletConnected: false,
    connectPromise: null,
    reverseIframe: null,
    reverseIframeWalletUrl: 'http://localhost:9000'
  }),
  computed: {
    walletName () {
      if (!this.aeSdk) return 'SDK is not ready'
      if (!this.walletConnected) return 'Wallet is not connected'
      return this.aeSdk.rpcClient.info.name
    }
  },
  methods: {
    async scanForWallets () {
      const handleWallets = async function ({ wallets, newWallet }) {
        newWallet = newWallet || Object.values(wallets)[0]
        if (confirm(`Do you want to connect to wallet ${newWallet.name} with id ${newWallet.id}`)) {
          console.log('newWallet', newWallet)
          detector.stopScan()

          await this.aeSdk.connectToWallet(await newWallet.getConnection())
          this.walletConnected = true
          const { address: { current } } = await this.aeSdk.subscribeAddress('subscribe', 'connected')
          this.$emit('address', Object.keys(current)[0])
        }
      }

      const scannerConnection = await new BrowserWindowMessageConnection({
        connectionInfo: { id: 'spy' }
      })
      const detector = await new WalletDetector({ connection: scannerConnection })
      detector.scan(handleWallets.bind(this))
    },
    async connect () {
      if (this.connectMethod === 'reverse-iframe') {
        this.reverseIframe = document.createElement('iframe')
        this.reverseIframe.src = this.reverseIframeWalletUrl
        this.reverseIframe.style.display = 'none'
        document.body.appendChild(this.reverseIframe)
      }

      if (!this.aeSdk) {
        this.aeSdk = await RpcAepp({
          name: 'Simple æpp',
          nodes: [
            { name: 'testnet', instance: await Node({ url: TESTNET_NODE_URL }) },
            { name: 'mainnet', instance: await Node({ url: MAINNET_NODE_URL }) }
          ],
          compilerUrl: COMPILER_URL,
          onNetworkChange: ({ networkId }) => {
            const [{ name }] = this.aeSdk.getNodesInPool()
              .filter(node => node.nodeNetworkId === networkId)
            this.aeSdk.selectNode(name)
            this.$emit('networkId', networkId)
          },
          onAddressChange: ({ current }) => this.$emit('address', Object.keys(current)[0]),
          onDisconnect: () => alert('Aepp is disconnected')
        })
      }
      this.$emit('aeSdk', this.aeSdk)

      await this.scanForWallets()
    },
    async disconnect () {
      await this.aeSdk.disconnectWallet()
      this.walletConnected = false
      if (this.reverseIframe) this.reverseIframe.remove()
      this.$emit('aeSdk', null)
    }
  }
}
</script>
