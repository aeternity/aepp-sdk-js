## [Vue.js]

Adding aepp-sdk to a Vue.js project requires nothing special, but it should be
noted that `client creation` is asynchronous which needs to be taken into account.

```bash
vue init webpack my-project
cd my-project
npm install @aeternity/aepp-sdk
```

```html
# src/components/HelloWorld.vue

<script>
// import Universal stamp
import Universal from '@aeternity/aepp-sdk/es/ae/universal'
// import Node
import Node from '@aeternity/aepp-sdk/es/node'
// import Account
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory'

export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  async mounted () {
    const node = await Node({ url: 'https://sdk-testnet.aepps.com' })
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

[Vue.js]: https://vuejs.org/
