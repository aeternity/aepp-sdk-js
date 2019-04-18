<template>
  <div class="w-full p-4 flex flex-col">
    <h1 class="mb-4">Your Aepp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key <small>(from Wallet Aepp)</small>
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{pub}}
        </div>
        <div v-if="!pub" class="p-2 w-3/4 bg-grey-lightest break-words text-grey">
          Requesting Public Key from AE Wallet...
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
    </div>

    <h2 class="mt-4">Compile Contract</h2>

    <div class="border mt-4 rounded">
      <div class="bg-grey-lightest w-full flex flex-row font-mono">
        <div class="p-2 w-1/4">
          Contract By
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-white break-words">
          {{pub}}
        </div>
        <div v-if="!pub" class="p-2 w-3/4 bg-grey-lightest break-words text-grey">
          Requesting Public Key from AE Wallet...
        </div>
      </div>
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
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
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
          v-if="pub"
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
          v-if="pub"
          class="p-2 w-3/4 bg-grey-lightest break-words whitespace-pre-wrap"
        >{{ callResult ? JSON.stringify(callResult, null, 4) : callError }}</div>
      </div>
    </div>
  </div>
</template>

<script>
//  is a webpack alias present in webpack.config.js
import Aepp from 'AE_SDK_MODULES/ae/aepp'

export default {
  data () {
    return {
      client: null,
      height: null,
      pub: null,
      contractCode: `contract Identity =
  type state = ()
  function main(x : int) = x`,
      byteCode: null,
      compileError: null,
      contractInitState: [],
      deployInfo: null,
      deployError: null,
      callResult: null,
      callError: null
    }
  },
  methods: {
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
    }
  },
  async created () {
    this.client = await Aepp()
    this.pub = await this.client.address().catch(e => `Rejected: ${e}`)
    this.height = await this.client.height()
  }
}
</script>
