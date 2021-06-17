# Vue.js

Adding the SDK to a Vue.js project requires nothing special, but it should be
noted that `client creation` is asynchronous which needs to be taken into account.

```bash
npm install -g @vue/cli
```

```bash
vue create my-project
```

```bash
cd my-project
```

```bash
npm install @aeternity/aepp-sdk
```

```js
<!-- src/components/HelloWorld.vue -->

<script>
import { Universal, Node, Crypto, MemoryAccount } from '@aeternity/aepp-sdk'

export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Loading latest block ...'
    }
  },
  async mounted () {
    const keypair = Crypto.generateKeyPair(); // should be replaced by your own keypair
    const node = await Node({ url: 'https://testnet.aeternity.io' })
    const account = MemoryAccount({ keypair })

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
