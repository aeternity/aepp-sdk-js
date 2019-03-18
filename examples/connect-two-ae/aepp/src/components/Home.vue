<template>
  <div class="w-full p-4 flex flex-col">
    <h1 class="mb-4">Your Aepp</h1>

    <div class="border">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Public Key <small>(from extension Identity)</small>
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
          <textarea class="bg-black text-white border-b border-black p-2 w-full h-64" v-model='contractCode' placeholder="contact code"/>
        </div>
      </div>
      <button v-if="client" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click='onCompile'>
        Compile
      </button>
    </div>

    <div v-if="byteCode" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Compiled Code
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{byteCode}}
        </div>
      </div>
    </div>
    <button v-if="byteCode" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click='onDeploy'>
      Deploy
    </button>

    <div v-if="deployInfo" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Deployed Contract
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{ deployInfo }}
        </div>
      </div>
    </div>
    <button v-if="deployInfo" class="w-32 rounded rounded-full bg-purple text-white py-2 px-4 pin-r mr-8 mt-4 text-xs" @click='onCall'>
      Call
    </button>

    <div v-if="callResult" class="border mt-4 mb-8 rounded">
      <div class="bg-green w-full flex flex-row font-mono border border-b">
        <div class="p-2 w-1/4">
          Deployed Contract
        </div>
        <div v-if="pub" class="p-2 w-3/4 bg-grey-lightest break-words">
          {{ callResult }}
        </div>
      </div>
    </div>


  </div>
</template>

<script>
//  is a webpack alias present in webpack.config.js
import Aepp from 'AE_SDK_MODULES/ae/aepp'

export default {
  name: 'Home',
  components: {},
  data () {
    return {
      client: null,
      abi: 'sophia',
      to: null,
      amount: null,
      height: null,
      pub: null,
      callResult: null,
      contractCode: `contract Identity =
  type state = ()
  function main(x : int) = x`,
      byteCode: null,
      contractInitState: '()',
      deployInfo: null
    }
  },
  computed: {
  },
  methods: {
    send () {},
    async compile (code) {
      console.log(`Compiling contract...`)
      try {
        return await this.client.contractCompile(code)
      } catch (err) {
        this.compileError = err
        console.error(err)
      }
    },
    async deploy (code, options = {}) {
      console.log(`Deploying contract...`)
      try {
        return await this.client.contractDeploy(this.byteCode, this.abi, { initState: this.contractInitState, options })
      } catch (err) {
        this.deployErr = err
        console.error(err)
      }
    },
    async call (code, abi, contractAddress, method = 'main', returnType = 'int', args = '(5)', options = {}) {
      console.log(`Deploying contract...`)
      try {
        const { result } = await this.client.contractCall(this.byteCode, this.abi, this.deployInfo.address, method, { args: args, options })
        return Object.assign(
          result,
          { decodedRes: await this.client.contractDecodeData(returnType, result.returnValue) }
        )
      } catch (err) {
        this.deployErr = err
        console.error(err)
      }
    },
    onCompile () {
      this.compile(this.contractCode)
        .then(byteCodeObj => {
          this.byteCode = byteCodeObj.bytecode
        })
    },
    onDeploy () {
      this.deploy(this.byteCode)
        .then(deployedContract => {
          this.deployInfo = deployedContract
        })
    },
    onCall () {
      this.call(this.byteCode)
        .then(callRes => {
          console.log(callRes)
          this.callResult = callRes
        })
    }
  },
  created () {
    Aepp({
      url: 'http://localhost:3013',
      internalUrl: 'http://localhost:3113',
      onWalletChange: (params) => {
        this.pub = params.address
      },
      onRegister: (identity) => {
        if (confirm(`Do you want to register this identity provider ${identity.providerId}???`)) {
          identity.registerProvider() // REGISTER PROVIDER
        }
      }
    }).then(ae => {
      this.client = ae
      ae.address()
        .then(address => {
          // this.pub = address
        })
        .catch(e => { this.pub = `Rejected: ${e}` })
    })
  }
}
</script>

<style scoped lang="css">
</style>
