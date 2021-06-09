# Script Tag

In case you're not using any JS bundling/compilation technique, the SDK can also be loaded with the traditional `<script>` tag, as follows:

## Latest SDK version

```html
<script src="https://unpkg.com/@aeternity/aepp-sdk/dist/aepp-sdk.browser-script.js"></script>
```

## Specific SDK version
```html
<script src="https://unpkg.com/@aeternity/aepp-sdk@VERSION/dist/aepp-sdk.browser-script.js"></script>
```
...where `VERSION` is the version number of the SDK you want to use (eg. `4.0.1`).

## Browser `<script>` tag
The bundle will assign the SDK to a global `var` called `Ae`, and you can use it like so:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  <!-- include latest SDK version -->
  <script src="https://unpkg.com/@aeternity/aepp-sdk/dist/aepp-sdk.browser-script.js"></script>
  <script type="text/javascript">
    Ae.Node({ url: 'https://testnet.aeternity.io' }).then(node => {
        Ae.Universal({
              nodes: [{ name: 'local', instance: node }]
            }).then(aeInstance => {
              aeInstance.height().then(height => {
                console.log("Current Block Height:" + height)
              })
            })
    })
  </script>
</body>
</html>
```

## CodePen Example
Immediately [**START**](https://codepen.io/ricricucit/pen/JQWRNb) playing with our latest SDK release in Codepen.
,
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
,
