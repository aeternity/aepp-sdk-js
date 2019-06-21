## Browser bundle

In case you're not using any JS bundling/compilation technnique, the SDK can also be loaded with the traditional `<script>` tag, as follows:

### Latest SDK version

```html
<script src="https://unpkg.com/@aeternity/aepp-sdk/dist/aepp-sdk.browser-script.js"></script>
```

### Specific SDK version
```html
<script src="https://unpkg.com/@aeternity/aepp-sdk@VERSION/dist/aepp-sdk.browser-script.js"></script>
```
...where `VERSION` is the version number of the SDK you want to use (eg. `4.0.1`).

### Browser `<script>` tag
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
    Ae.Wallet({
      url: 'https://sdk-testnet.aepps.com'
    }).then(aeInstance => {
      aeInstance.height().then(height => {
        console.log("Current Block Height:" + height)
      })
    })
  </script>
</body>
</html>
```

### CodePen Example
Immediately [**START**](https://codepen.io/ricricucit/pen/JQWRNb) playing with our latest SDK release in Codepen.
