# Vue.js

Adding aepp-sdk to a Vue.js project requires nothing special, but it should be
noted that `client creation` is asynchronous which needs to be taken into account.

```bash
npm install -g @vue/cli
vue create my-project
cd my-project
npm install @aeternity/aepp-sdk
```

```vue
<!-- src/components/HelloWorld.vue -->

<script>
// import Universal stamp, Node, and Account
import { Universal, Node, MemoryAccount } from '@aeternity/aepp-sdk'

export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  async mounted () {
    const node = await Node({ url: 'https://testnet.aeternity.io' })
    const account = MemoryAccount({ keypair: 'YOUR_KEYPAIR' })

    // Init client
    const client = await Universal({
       nodes: [{ name: 'test-net', instance: node }],
       accounts: [ account ]
    })
    // Start Using client
    const height = await client.height()
    this.msg = 'Current Block: ' + height
  }
}
</script>
```
