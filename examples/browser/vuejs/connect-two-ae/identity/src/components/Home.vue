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
      <div v-if="balance || balance >= 0" class="bg-green w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Balance
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest">
          {{balance}}
        </div>
      </div>
      <button
        v-if="client"
        class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs"
        @click="switchAccount"
      >Switch Account</button>
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
  import { MemoryAccount, RpcWallet, Node } from '@aeternity/aepp-sdk/es'
  import BrowserWindowMessageConnection
    from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'
  import { generateKeyPair } from '@aeternity/aepp-sdk/es/utils/crypto'

  export default {
    data () {
      return {
        runningInFrame: window.parent !== window,
        publicKey: 'YOUR_PUB', // Your public key
        secretKey: 'YOUR_PRIV', // Your private key
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
      async shareWalletInfo (postFn, { interval = 5000, attemps = 5 } = {}) {
        const ins = this.client
        const pause = async (duration) => {
          await new Promise(resolve => setTimeout(resolve, duration))
        }

        async function prob (left) {
          ins.shareWalletInfo(postFn)
          if (left > 0) {
            await pause(interval)
            return prob(attemps - 1)
          } else {
            console.log('Finish sharing wallet info')
            return
          }
        }

        return await prob(attemps)
      },
      disconnect () {
        const { clients: aepps } = this.client.getClients()
        const aepp = Array.from(aepps.values())[0]
        aepp.disconnect()
      },
      async switchAccount () {
        const secondAcc = this.client.addresses().find(a => a !== this.pub)
        this.client.selectAccount(secondAcc)
        this.pub = await this.client.address()
        this.balance = await this.client.balance(this.pub).catch(e => 0)
      }
    },
    async created () {
      const { publicKey, secretKey } = generateKeyPair()
      this.pub = this.pub || publicKey
      const account2 = MemoryAccount({ keypair: generateKeyPair() })
      const node = await Node({ url: this.url, internalUrl: this.internalUrl })

      this.client = await RpcWallet({
        nodes: [{ name: 'test-net', instance: node }],
        compilerUrl: this.compilerUrl,
        accounts: [MemoryAccount({ keypair: { secretKey: this.priv || secretKey, publicKey: this.pub || publicKey } }), account2],
        address: this.pub,
        name: 'Wallet',
        async onConnection (aepp, { accept, deny }, origin) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} and origin ${origin} want to connect`)) {
            accept()
          } else { deny() }
        },
        async onSubscription (aepp, { accept, deny }, origin) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} and origin ${origin} want to subscribe address`)) {
            accept()
          } else { deny() }
        },
        async onSign (aepp, { accept, deny, params }, origin) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} and origin ${origin} want to ${params.returnSigned ? 'sign' : 'sign and broadcast'} ${JSON.stringify(params.tx)}`)) {
            accept()
          } else {
            deny()
          }
        },
        onAskAccounts (aepp, { accept, deny }, origin) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} and origin ${origin} want to get accounts`)) {
            accept()
          } else {
            deny()
          }
        },
        onDisconnect (message, client) {
          this.shareWalletInfo(connection.sendMessage.bind(connection))
        }
      })
      const target = !this.runningInFrame ? window.frames.aepp : window.parent
      const connection = await BrowserWindowMessageConnection({
        target
      })
      this.client.addRpcClient(connection)
      this.shareWalletInfo(connection.sendMessage.bind(connection))

      // Get balance
      this.balance = await this.client.balance(await this.client.address()).catch(e => 0)
    }
  }
</script>
