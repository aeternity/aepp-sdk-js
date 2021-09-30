# Vue.js HelloWorld
This tutorial shows you how to use the SDK in your Vue.js application.
You will replace the content of the default `HelloWorld` component and display the current block height of the æternity testnet.

## 1. Install Vue.js
```bash
npm install -g @vue/cli
```

## 2. Create a new Vue.js project
```bash
vue create my-project
```

## 3. Switch to the folder of your Vue.js project
```bash
cd my-project
```

## 4. Install the SDK
```bash
npm install @aeternity/aepp-sdk
```

## 5. Modify the HelloWorld component
```js
<!-- src/components/HelloWorld.vue -->

<script>
import { Universal, Node } from '@aeternity/aepp-sdk'

export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Loading latest block ...'
    }
  },
  async mounted () {
    // Init required Node stamp
    const node = await Node({ url: 'https://testnet.aeternity.io' })

    // Init sdk client with Universal stamp
    const client = await Universal({
       nodes: [{ name: 'test-net', instance: node }],
    })
    // Start using sdk client
    const height = await client.height()
    this.msg = 'Current Block: ' + height
  }
}
</script>
```

## 6. Run the application
```bash
npm run serve
```