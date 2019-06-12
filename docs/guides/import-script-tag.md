## Browser bundle

The browser bundle is relevant in two seperate cases: Either the SDK is to be
loaded traditionally through a `<script>` tag, or the bundler / compiliation is
not sufficient to use and compile the SDK's ES Modules.

### Browser `<script>` tag

The bundle will assign the SDK to a global `var` called `Ae`.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  <script src="aepp-sdk.browser.js"></script>
  <script type="text/javascript">
    Ae.Wallet.default().then(ae => {
      ae.height().then(height => {
        console.log('Current Block', height)
      })
    })
  </script>
</body>
</html>
```
