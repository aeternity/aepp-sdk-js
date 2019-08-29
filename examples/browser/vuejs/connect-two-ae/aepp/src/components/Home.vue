<template>
  <div class="w-full p-4 flex flex-col">
    <h1 class="mb-4">Your Aepp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key <small>(from Wallet Aepp)</small>
        </div>
        <div v-if="address" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{address | responseToString}}
        </div>
        <div v-else class="p-2 w-3/4 bg-grey-lightest break-words text-grey">
          Requesting Public Key from AE Wallet...
        </div>
      </div>
      <div v-if="height" class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Height
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest">
          {{height | responseToString}}
        </div>
      </div>

      <template v-if="nodeInfo">
        <div v-if="nodeInfo.error" class="bg-green w-full flex flex-row font-mono border border-b">
          <div class="p-2 w-1/4">
            NodeInfo error
          </div>
          <div class="p-2 w-3/4 bg-grey-lightest break-words">
            {{nodeInfo.error}}
          </div>
        </div>
        <div
          v-for="(value, name) in nodeInfo.result"
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
    </div>

    <h2 class="mt-4">Spend tokens</h2>

    <div class="border mt-4 rounded">
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Recipient address
        </div>
        <div class="p-2 w-3/4 bg-white break-words">
          <input
            class="bg-black text-white border-b border-black p-2 w-full"
            v-model="spendTo"
            placeholder="ak_..."
          />
        </div>
      </div>
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Tokens amount
        </div>
        <div class="p-2 w-3/4 bg-white break-words">
          <input
            class="bg-black text-white border-b border-black p-2 w-full"
            v-model="spendAmount"
          />
        </div>
      </div>
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Payload
        </div>
        <div class="p-2 w-3/4 bg-white break-words">
          <input
            class="bg-black text-white border-b border-black p-2 w-full"
            v-model="spendPayload"
          />
        </div>
      </div>
      <button
        v-if="client"
        class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs"
        @click="spend"
      >
        Spend
      </button>
    </div>

    <div v-if="spendResult || spendError" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Send result
        </div>
        <div
          class="p-2 w-3/4 bg-grey-lightest break-words whitespace-pre-wrap"
        >{{ spendResult ? JSON.stringify(spendResult, null, 4) : spendError }}</div>
      </div>
    </div>

    <h2 class="mt-4">Compile Contract</h2>

    <div class="border mt-4 rounded">
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Contract Code
        </div>
        <div class="p-2 w-3/4 bg-white">
          <textarea class="bg-black text-white border-b border-black p-2 w-full h-64" v-model="contractCode" placeholder="contact code"/>
        </div>
      </div>
      <button v-if="client" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click="compile">
        Compile
      </button>
    </div>

    <div v-if="byteCode || compileError" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Compiled Code
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest break-words">
          {{ byteCode || compileError }}
        </div>
      </div>
    </div>

    <button v-if="byteCode" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click="deploy">
      Deploy
    </button>

    <div v-if="deployInfo || deployError" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Deployed Contract
        </div>
        <div
          class="p-2 w-3/4 bg-grey-lightest break-words whitespace-pre-wrap"
        >{{ deployInfo ? JSON.stringify(deployInfo, null, 4) : deployError }}</div>
      </div>
    </div>

    <button v-if="deployInfo" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click="call">
      Call
    </button>

    <div v-if="callResult || callError" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Call Result
        </div>
        <div
          class="p-2 w-3/4 bg-grey-lightest break-words whitespace-pre-wrap"
        >{{ callResult ? JSON.stringify(callResult, null, 4) : callError }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  //  is a webpack alias present in webpack.config.js
  import { Aepp } from '@aeternity/aepp-sdk/es'

  const errorAsField = async fn => {
    try {
      return { result: await fn }
    } catch (error) {
      return { error }
    }
  }

  export default {
    data () {
      return {
        runningInFrame: window.parent !== window,
        client: null,
        height: null,
        address: null,
        spendTo: null,
        spendAmount: null,
        spendPayload: null,
        spendResult: null,
        spendError: null,
        nodeInfo: null,
        contractCode: `contract Identity =
      type state = ()
      entrypoint main(x : int) = x`,
        byteCode: null,
        compileError: null,
        contractInitState: [],
        deployInfo: null,
        deployError: null,
        callResult: null,
        callError: null
      }
    },
    filters: {
      responseToString: response => `${response.error ? 'Error: ' : ''}${response.result || response.error}`,
    },
    methods: {
      async spend () {
        try {
          this.spendResult = await this.client.spend(
            this.spendAmount,
            this.spendTo, {
              payload: this.spendPayload,
            }
          )
        } catch (err) {
          this.spendError = err
        }
      },
      async compile () {
        this.byteCode = this.compileError = null
        try {
          this.byteCode = (await this.client.contractCompile(this.contractCode)).bytecode
        } catch (err) {
          this.compileError = err
        }
      },
      async deploy () {
        this.deployInfo = this.deployError = null
        try {
          this.deployInfo = await this.client.contractDeploy(this.byteCode, this.contractCode, this.contractInitState)
        } catch (err) {
          this.deployError = err
        }
      },
      async call (code, method = 'main', returnType = 'int', args = ['5']) {
        this.callResult = this.callError = null
        try {
          this.callResult = await this.client.contractCall(this.contractCode, this.deployInfo.address, method,  args)
          Object.assign(
            this.callResult,
            { decodedRes: await result.decode(returnType) }
          )
        } catch (err) {
          this.callError = err
        }
      },
      async getReverseWindow() {
        const iframe = document.createElement('iframe')
        iframe.src = prompt('Enter wallet URL', 'http://localhost:9000')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        await new Promise(resolve => {
          const handler = ({ data }) => {
            if (data.method !== 'ready') return
            window.removeEventListener('message', handler)
            resolve()
          }
          window.addEventListener('message', handler)
        })
        return iframe.contentWindow
      }
    },
    async created () {
      this.client = await Aepp({
        parent: this.runningInFrame ? window.parent : await this.getReverseWindow()
      })
      this.address = await errorAsField(this.client.address())
      this.height = await errorAsField(this.client.height())
      this.nodeInfo = await errorAsField(this.client.getNodeInfo())
    }
  }
</script>
