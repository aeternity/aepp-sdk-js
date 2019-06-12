## [Vue.js]

Adding aepp-sdk to a Vue.js project requires nothing special, but it should be
noted that `Ae.create` is asynchronous which needs to be taken into account.

```bash
vue init webpack my-project
cd my-project
npm add @aeternity/aepp-sdk
```

```html
# src/components/HelloWorld.vue

<script>
// import Aepp
import Aepp from '@aeternity/aepp-sdk/es/ae/aepp'
// Init Ae Client
const ae = Aepp()

export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  async mounted () {
    // Wait Ae client
    const client = await ae
    // Start Using Ae client
    const height = await client.height()
    this.msg = 'Current Block: ' + height
  }
}
</script>
```

[Vue.js]: https://vuejs.org/
