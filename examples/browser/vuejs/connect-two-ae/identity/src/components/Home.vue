<template>
  <div
    v-if="!runningInFrame"
    class="w-full p-4 flex justify-center flex-col bg-grey h-screen"
  >
    <h1 class="mb-4">Wallet Aepp</h1>

    <div class="border">
      <template v-if="nodeInfoResponse">
        <div v-if="nodeInfoResponse.error" class="bg-green w-full flex flex-row font-mono border border-b">
          <div class="p-2 w-1/4">
            NodeInfo error
          </div>
          <div class="p-2 w-3/4 bg-grey-lightest break-words">
            {{nodeInfoResponse.error}}
          </div>
        </div>
        <div
          v-for="(value, name) in nodeInfoResponse.result"
          v-if="['url', 'name', 'nodeNetworkId', 'version'].includes(name)"
          class="bg-green w-full flex flex-row font-mono border border-b"
        >
          <div class="p-2 w-1/4 capitalize">
            {{name.replace('nodeNetworkId', 'NetworkId')}}
          </div>
          <div class="p-2 w-3/4 bg-grey-lightest">
            {{value}}
          </div>
        </div>
      </template>

      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest break-words">
          {{publicKey}}
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
      <button
        v-if="client"
        class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs"
        @click="switchNode"
      >Switch Node</button>
    </div>

    <div v-if="!aeppUrl" class="w-full p-4 h-64 border border-black border-dashed shadow mx-auto mt-4 bg-grey-lighter">
      Loading Aepp...
    </div>
    <!-- external app -->
    <iframe v-show="aeppUrl" ref="aepp"
            class="w-full h-screen border border-black border-dashed bg-grey-light mx-auto mt-4 shadow"
            src="http://localhost:9001" frameborder="1"></iframe>
  </div>
</template>

<script>
  // AE_SDK_MODULES is a webpack alias present in webpack.config.js
  import { MemoryAccount, RpcWallet, Node } from '@aeternity/aepp-sdk/es'
  import BrowserWindowMessageConnection
    from '@aeternity/aepp-sdk/es/utils/aepp-wallet-communication/connection/browser-window-message'
  import { generateKeyPair } from '@aeternity/aepp-sdk/es/utils/crypto'

  const errorAsField = async fn => {
    try {
      return { result: await fn }
    } catch (error) {
      console.log(error)
      return { error }
    }
  }

  export default {
    data () {
      return {
        runningInFrame: window.parent !== window,
        publicKey: 'ak_2dATVcZ9KJU5a8hdsVtTv21pYiGWiPbmVcU1Pz72FFqpk9pSRR', // Your public key
        secretKey: 'bf66e1c256931870908a649572ed0257876bb84e3cdf71efb12f56c7335fad54d5cf08400e988222f26eb4b02c8f89077457467211a6e6d955edb70749c6a33b', // Your private key
        client: null,
        balance: null,
        nodeInfoResponse: null,
        height: null,
        url: 'https://sdk-testnet.aepps.com',
        mainNetUrl: 'https://mainnet.aeternity.io',
        internalUrl: 'https://testnet.aeternity.io',
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
        const secondAcc = this.client.addresses().find(a => a !== this.publicKey)
        this.client.selectAccount(secondAcc)
        this.publicKey = await this.client.address()
        this.balance = await this.client.balance(this.publicKey).catch(() => 0)
      },
      async switchNode () {
        const toNode = this.client.getNodesInPool().find(n => n.name !== this.client.selectedNode.name)
        this.client.selectNode(toNode.name)
        this.nodeInfoResponse = await errorAsField(this.client.getNodeInfo())
      }
    },
    async created () {
      const account2 = MemoryAccount({ keypair: generateKeyPair() })
      const testNetNode = await Node({ url: this.url })
      const mainNetNode = await Node({ url: this.mainNetUrl })

      const genConfirmCallback = getActionName => (aepp, { accept, deny, params }) => {
        if (confirm(`Client ${aepp.info.name} with id ${aepp.id} want to ${getActionName(params)}`)) accept()
        else deny()
      }
      const keypair = generateKeyPair()
      const keypair2 = generateKeyPair()
      const sdkAcc = this.publicKey
      this.client = await RpcWallet({
        nodes: [
          { name: 'ae_uat', instance: testNetNode },
          { name: 'ae_mainnet', instance: mainNetNode },
        ],
        compilerUrl: this.compilerUrl,
        accounts: [MemoryAccount({ keypair: { secretKey: this.secretKey, publicKey: this.publicKey } }), account2],
        address: this.publicKey,
        name: 'Wallet',
        onConnection: genConfirmCallback(() => 'connect'),
        onSubscription (aepp, { accept, deny }, origin) {
          // Manually return accounts
          // you can check AEPP accounts using
          // `aepp.accounts`
          accept()
          // accept({
          //   accounts: {
          //     current: { [keypair.publicKey]: {}},
          //     connected: { [keypair2.publicKey]: {}, [sdkAcc]: {}, [account2.publicKey]: {} }
          //   }
          // })
        },
        onSign (aepp, { accept, deny, params }, origin) {
          // Get account outside of SDK if needed
          // const onAccount = {
          //   [keypair.publicKey]: MemoryAccount({ keypair }),
          //   [keypair2.publicKey]: MemoryAccount({ keypair: keypair2 }),
          // }[params.onAccount]
          // accept(null , { onAccount }) // provide this account for signing
          accept() // provide this account for signing
        },
        onMessageSign (aepp, { accept, deny, params }, origin) {
          // Get account outside of SDK if needed
          // const onAccount = {
          //   [keypair.publicKey]: MemoryAccount({ keypair }),
          //   [keypair2.publicKey]: MemoryAccount({ keypair: keypair2 }),
          // }[params.onAccount]
          // accept({ onAccount }) // provide this account for signing
          accept()
        },
        onAskAccounts: genConfirmCallback(() => 'get accounts'),
        onDisconnect (message, client) {
          this.shareWalletInfo(connection.sendMessage.bind(connection))
        }
      })
      const target = !this.runningInFrame ? this.$refs.aepp.contentWindow : window.parent
      const connection = BrowserWindowMessageConnection({ target })
      this.client.addRpcClient(connection)
      this.shareWalletInfo(connection.sendMessage.bind(connection))

      // Get node info
      this.nodeInfoResponse = await errorAsField(this.client.getNodeInfo())
      // Get balance
      this.balance = await this.client.balance(await this.client.address()).catch(e => 0)
    }
  }
</script>
