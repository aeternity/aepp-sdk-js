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
    <iframe v-show="aeppUrl" ref="aepp"
            class="w-full h-screen border border-black border-dashed bg-grey-light mx-auto mt-4 shadow" name="aepp"
            src="http://localhost:9001" frameborder="1"></iframe>
  </div>
</template>

<script>
  // AE_SDK_MODULES is a webpack alias present in webpack.config.js
  import { Wallet, MemoryAccount, RpcWallet } from '@aeternity/aepp-sdk/es'
  import Node from '@aeternity/aepp-sdk/es/node'
  import BrowserWindowMessageConnection
    from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/wallet-connection/browser-window-message'
  import { generateKeyPair } from '../../../../../../../es/utils/crypto'

  const { publicKey, secretKey } = generateKeyPair()
  const account2 = MemoryAccount({ keypair: generateKeyPair() })

  export default {
    data () {
      return {
        runningInFrame: window.parent !== window,
        pub: 'ak_2a1j2Mk9YSmC1gioUq4PWRm3bsv887MbuRVwyv4KaUGoR1eiKi', // Your public key
        priv: 'e6a91d633c77cf5771329d3354b3bcef1bc5e032c43d70b6d35af923ce1eb74dcea7ade470c9f99d9d4e400880a86f1d49bb444b62f11a9ebb64bbcfeb73fef3', // Your private key
        client: null,
        balance: null,
        height: null,
        url: 'http://localhost:3013',
        internalUrl: 'http://localhost:3113',
        compilerUrl: 'http://localhost:3080',
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
      }
    },
    async created () {
      this.client = await RpcWallet({
        compilerUrl: this.compilerUrl,
        nodes: [{ name: 'local', instance: await Node({ url: this.url, internalUrl: this.intercal, compilerUrl: this.compilerUrl }) }],
        accounts: [MemoryAccount({ keypair: { secretKey: this.priv || secretKey, publicKey: this.pub || publicKey } }), account2],
        address: this.pub,
        name: 'Wallet',
        onConnection (aepp, { accept, deny }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to connect`)) {
            accept()
          } else { deny() }
        },
        async onSubscription (aepp, { accept, deny }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to subscribe address`)) {
            accept()
            const node = await Node({ url: 'http://localhost:3013', internalUrl: 'http://localhost:3013' })
            this.setNode(node)
          } else { deny() }
        },
        async onSign (aepp, { accept, deny, params }) {
          if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to ${params.returnSigned ? 'sign' : 'sign and broadcast'} ${JSON.stringify(params.tx)}`)) {
            accept()
          } else {
            deny()
          }
        },
        onDisconnect (a, b) {
          this.shareWalletInfo(connection.sendMessage.bind(connection))
        }
      })
      // this.client.addNode()
      await this.client.spend(100, 'ak_2a1j2Mk9YSmC1gioUq4PWRm3bsv887MbuRVwyv4KaUGoR1eiKi')
      const target = !this.runningInFrame ? window.frames.aepp : window.parent
      const connection = await BrowserWindowMessageConnection({
        target
      })
      this.client.addRpcClient(connection)
      this.shareWalletInfo(connection.sendMessage.bind(connection))
    }
  }
</script>
