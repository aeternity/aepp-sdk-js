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
    <iframe v-show="aeppUrl" ref="aepp" class="w-full h-screen border border-black border-dashed bg-grey-light mx-auto mt-4 shadow" name="aepp" src="http://localhost:9001" frameborder="1"></iframe>
  </div>
</template>

<script>
  // AE_SDK_MODULES is a webpack alias present in webpack.config.js
  import { Wallet, MemoryAccount, RpcWallet } from '@aeternity/aepp-sdk/es'
  import BrowserWindowMessageConnection from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-connection/browser-window-message'

  export default {
    data () {
      return {
        runningInFrame: window.parent !== window,
        pub: 'YOUR_PUB', // Your public key
        priv: 'YOUR_PRIV', // Your private key
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
      this.client = await RpcWallet({
        url: this.url,
        internalUrl: this.internalUrl,
        compilerUrl: this.compilerUrl,
        accounts: [MemoryAccount({keypair: {secretKey: this.priv, publicKey: this.pub}})],
        address: this.pub,
        name: 'Wallet',
        onConnection (aepp ,{ accept, deny }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to connect`)) {
            accept()
          }
        },
        onSubscription(aepp ,{ accept, deny }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to subscribe address`)) {
            accept()
          }
        },
        onSign(aepp ,{ accept, deny, params }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to sign ${JSON.stringify(params.tx)}`)) {
            accept()
          }
        },
        onDisconnect(a ,b) {
          debugger
        }
      })
      const target = !this.runningInFrame ? window.frames.aepp : window.parent
      const connection = await BrowserWindowMessageConnection({
        target
      })
      this.client.addRpcClient(connection)
      this.client.shareWalletInfo(connection.sendMessage.bind(connection))
    }
  }
</script>
