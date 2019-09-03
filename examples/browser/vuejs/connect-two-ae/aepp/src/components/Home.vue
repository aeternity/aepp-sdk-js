<template>
  <div class="w-full p-4 flex flex-col">
    <h1 class="mb-4">Your Aepp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key <small>(from Wallet Aepp)</small>
        </div>
        <div v-if="addressResponse" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{addressResponse | responseToString}}
        </div>
        <div v-else class="p-2 w-3/4 bg-grey-lightest break-words text-grey">
          Requesting Public Key from AE Wallet...
        </div>
      </div>
      <div v-if="heightResponse" class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Height
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest">
          {{heightResponse | responseToString}}
        </div>
      </div>

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

    <div v-if="spendResponse" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Send result
        </div>
        <div
          class="p-2 w-3/4 bg-grey-lightest break-words whitespace-pre-wrap"
        >{{ spendResponse | responseToFormattedJSON }}</div>
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

    <div v-if="compileBytecodeResponse" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Compiled Code
        </div>
        <div class="p-2 w-3/4 bg-grey-lightest break-words">
          {{ compileBytecodeResponse | responseToString }}
        </div>
      </div>
    </div>

    <button
      v-if="compileBytecodeResponse && compileBytecodeResponse.result"
      class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs"
      @click="deploy"
    >
      Deploy
    </button>

    <div v-if="deployResponse" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Deployed Contract
        </div>
        <div
          class="p-2 w-3/4 bg-grey-lightest break-words whitespace-pre-wrap"
        >{{ deployResponse | responseToFormattedJSON }}</div>
      </div>
    </div>

    <button
      v-if="deployResponse && deployResponse.result"
      class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs"
      @click="call"
    >
      Call
    </button>

    <div v-if="callResponse" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Call Result
        </div>
        <div
          class="p-2 w-3/4 bg-grey-lightest break-words whitespace-pre-wrap"
        >{{ callResponse | responseToFormattedJSON }}</div>
      </div>
    </div>

    <h2 class="mt-4">Scan QR code</h2>

    <div class="border mt-4 rounded">
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Scanner title
        </div>
        <div class="p-2 w-3/4 bg-white break-words">
          <input
            class="bg-black text-white border-b border-black p-2 w-full"
            v-model="readQrCodeTitle"
          />
        </div>
      </div>
      <button
        v-if="client"
        class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs"
        @click="readQrCode"
      >
        Scan
      </button>
    </div>

    <div v-if="readQrCodeResponse" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">Scanned data</div>
        <div class="p-2 w-3/4 bg-grey-lightest break-words">
          {{ readQrCodeResponse | responseToString }}
        </div>
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
        addressResponse: null,
        heightResponse: null,
        nodeInfoResponse: null,
        spendTo: null,
        spendAmount: null,
        spendPayload: null,
        spendResponse: null,
        contractCode: `contract Identity =
      type state = ()
      entrypoint main(x : int) = x`,
        compileBytecodeResponse: null,
        contractInitState: [],
        deployResponse: null,
        callResponse: null,
        readQrCodeTitle: '',
        readQrCodeResponse: null
      }
    },
    filters: {
      responseToString: response => `${response.error ? 'Error: ' : ''}${response.result || response.error}`,
      responseToFormattedJSON: response => response.error
        ? `Error: ${response.error}`
        : JSON.stringify(response.result, null, 4),
    },
    methods: {
      async spend () {
        this.spendResponse = await errorAsField(this.client.spend(
          this.spendAmount,
          this.spendTo, {
            payload: this.spendPayload
          }
        ));
      },
      async compile () {
        this.compileBytecodeResponse = await errorAsField(
          (await this.client.contractCompile(this.contractCode)).bytecode
        );
      },
      async deploy () {
        this.deployResponse = await errorAsField(this.client.contractDeploy(
          this.compileBytecodeResponse.result, this.contractCode, this.contractInitState
        ));
      },
      async call (code, method = 'main', returnType = 'int', args = ['5']) {
        this.callResponse = await errorAsField((async () => {
          const result = await this.client.contractCall(
            this.contractCode, this.deployResponse.result.address, method,  args
          )
          return Object.assign(
            result,
            { decodedRes: await result.decode(returnType) }
          )
        })());
      },
      async readQrCode() {
        this.readQrCodeResponse = await errorAsField(this.client.readQrCode({
          title: this.readQrCodeTitle,
        }));
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
      this.client = await Aepp.compose({
        deepConfiguration: { Ae: { methods: ['readQrCode'] } },
      })({
        parent: this.runningInFrame ? window.parent : await this.getReverseWindow()
      })
      this.addressResponse = await errorAsField(this.client.address())
      this.heightResponse = await errorAsField(this.client.height())
      this.nodeInfoResponse = await errorAsField(this.client.getNodeInfo())
    }
  }
</script>
