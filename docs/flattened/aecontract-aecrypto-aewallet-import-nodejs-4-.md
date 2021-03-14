


# Simple Sophia Contract Compiler

This script demonstrates how to

* deal with the different phases of compiling Sophia contracts to bytecode,
* deploying the bytecode to get a callable contract address and ultimately,
* invoke the deployed contract on the æternity blockchain.


We'll need the main client module `Ae` in the `Universal` flavor from the SDK.


```js
const { Universal: Ae, Node } = require('@aeternity/aepp-sdk')
const program = require('commander')
const fs = require('fs')

async function exec (infile, fn, args) {
  if (!infile || !fn) {
    program.outputHelp()
    process.exit(1)
  }

  const code = fs.readFileSync(infile, 'utf-8')
  const node = await Node({ url: program.host })
```

Most methods in the SDK return _Promises_, so the recommended way of
dealing with subsequent actions is `then` chaining with a final `catch`
callback.


`Ae` itself is asynchronous as it determines the node's version and
rest interface automatically. Only once the Promise is fulfilled, we know
we have a working ae client. Please take note `Ae` is not a constructor but
a factory factory, which means it's *not* invoked with `new`.
`contractCompile` takes a raw Sophia contract in string form and sends it
off to the node for bytecode compilation. This might in the future be done
without talking to the node, but requires a bytecode compiler
implementation directly in the SDK.


```js
  Ae({ debug: program.debug, process, nodes: [{ name: 'testNode', instance: node }] }).then(ae => {
    return ae.contractCompile(code)
```

Invoking `deploy` on the bytecode object will result in the contract
being written to the chain, once the block has been mined.
Sophia contracts always have an `init` method which needs to be invoked,
even when the contract's `state` is `unit` (`()`). The arguments to
`init` have to be provided at deployment time and will be written to the
block as well, together with the contract's bytecode.


```js
  }).then(bytecode => {
    console.log(`Obtained bytecode ${bytecode.bytecode}`)
    return bytecode.deploy({ initState: program.init })
```

Once the contract has been successfully mined, we can attempt to invoke
any public function defined within it. The miner who found the next block
will not only be rewarded a fixed amount, but also an amount depending on
the amount of gas spend.


```js
  }).then(deployed => {
    console.log(`Contract deployed at ${deployed.address}`)
    return deployed.call(fn, { args: args.join(' ') })
```

The execution result, if successful, will be an AEVM-encoded result
value. Once type decoding will be implemented in the SDK, this value will
not be a hexadecimal string, anymore.


```js
  }).then(value => {
    console.log(`Execution result: ${value}`)
  }).catch(e => console.log(e.message))
}
```

## Command Line Interface

The `commander` library provides maximum command line parsing convenience.


```js
program
  .version('0.1.0')
  .arguments('<infile> <function> [args...]')
  .option('-i, --init [state]', 'Arguments to contructor function')
  .option('-H, --host [hostname]', 'Node to connect to', 'http://localhost:3013')
  .option('--debug', 'Switch on debugging')
  .action(exec)
  .parse(process.argv)
```

,



# Crypto Helper Script

This script shows how to use the SDK to generate and decrypt æternity
compliant key pairs, as well as encode and decode transactions.


We'll only load the `Crypto` module from the SDK to work with keys and
transactions.


```js
const { Crypto, TxBuilder } = require('@aeternity/aepp-sdk')
const program = require('commander')
const fs = require('fs')
const prompt = require('prompt')
const path = require('path')
```

The `prompt` library provides concealed input of passwords.


```js
const promptSchema = {
  properties: {
    password: {
      type: 'string',
      description: 'Enter your password',
      hidden: true,
      required: true,
      replace: '*',
      conform: function (value) {
        return true
      }
    }
  }
}
```

## Key Extraction (from Node nodes)


```js
function extractReadableKeys (dir, options) {
  const pwd = options.input
  prompt.start()
  prompt.get(promptSchema, (_, { password }) => {
    const key = fs.readFileSync(path.join(pwd, dir, 'sign_key'))
    const pubKey = fs.readFileSync(path.join(pwd, dir, 'sign_key.pub'))

    const decrypted = Crypto.decryptPrivateKey(password, key)

    const privateHex = Buffer.from(decrypted).toString('hex')
    const decryptedPub = Crypto.decryptPubKey(password, pubKey)

    console.log(`Private key (hex): ${privateHex}`)
    console.log(`Public key (base check): ak_${Crypto.encodeBase58Check(decryptedPub)}`)
    console.log(`Public key (hex): ${decryptedPub.toString('hex')}`)
  })
}
```

## Key Pair Generation


```js
function generateKeyPair (name, { output }) {
  const { publicKey, secretKey } = Crypto.generateKeyPair()

  const data = [
    [path.join(output, name), secretKey],
    [path.join(output, `${name}.pub`), publicKey]
  ]

  data.forEach(([path, data]) => {
    fs.writeFileSync(path, data)
    console.log(`Wrote ${path}`)
  })
}
```

## Transaction Signing

This function shows how to use a compliant private key to sign an æternity
transaction and turn it into an RLP-encoded tuple ready for mining


```js
function signTx (tx, privKey) {
  if (!tx.match(/^tx_.+/)) {
    throw Error('Not a valid transaction')
  }

  const binaryKey = (() => {
    if (program.file) {
      return fs.readFileSync(program.file)
    } else if (privKey) {
      return Buffer.from(privKey, 'hex')
    } else {
      throw Error('Must provide either [privkey] or [file]')
    }
  })()

  const decryptedKey = program.password ? Crypto.decryptKey(program.password, binaryKey) : binaryKey
```

Split the base58Check part of the transaction


```js
  const base58CheckTx = tx.split('_')[1]
```

... and sign the binary create_contract transaction


```js
  const binaryTx = Crypto.decodeBase58Check(base58CheckTx)

  const signature = Crypto.sign(binaryTx, decryptedKey)
```

the signed tx deserializer expects a 4-tuple:
<tag, version, signatures_array, binary_tx>


```js
  const unpackedSignedTx = [
    Buffer.from([11]),
    Buffer.from([1]),
    [Buffer.from(signature)],
    binaryTx
  ]

  console.log(Crypto.encodeTx(unpackedSignedTx))
}
```

## Transaction Deserialization

This helper function deserialized the transaction `tx` and prints the result.


```js
function unpackTx (tx) {
  const deserializedTx = TxBuilder.unpackTx(tx)
  console.log(JSON.stringify(deserializedTx, undefined, 2))
}
```

## Command Line Interface

The `commander` library provides maximum command line parsing convenience.


```js
program.version('0.1.0')

program
  .command('decrypt <directory>')
  .description('Decrypts public and private key to readable formats for testing purposes')
  .option('-i, --input [directory]', 'Directory where to look for keys', '.')
  .action(extractReadableKeys)

program
  .command('genkey <keyname>')
  .description('Generate keypair')
  .option('-o, --output [directory]', 'Output directory for the keys', '.')
  .action(generateKeyPair)

program
  .command('sign <tx> [privkey]')
  .option('-p, --password [password]', 'password of the private key')
  .option('-f, --file [file]', 'private key file')
  .action(signTx)

program
  .command('unpack <tx>')
  .action(unpackTx)

program.parse(process.argv)
if (program.args.length === 0) program.help()
```

,



# Simple AE Token Spending Script

This script shows how to use the `Wallet` module from the SDK to send AE to
other addresses.


We'll need the main client module `Ae` in the `Universal` flavor from the SDK.


```js
const { Universal: Ae, Node } = require('@aeternity/aepp-sdk')
const program = require('commander')

async function spend (receiver, amount, { host, debug }) {
```

This code is relatively simple: We create the Ae client asynchronously and
invoke the spend method on it. Passing in `process` from nodejs will make
the implementation grab the key pair from the `WALLET_PRIV` and
`WALLET_PUB` environment variables, respectively.


```js
  const node = await Node({ url: host })
  Ae({ nodes: [{ name: 'local', instance: node }], debug, process })
    .then(ae => ae.spend(parseInt(amount), receiver))
    .then(tx => console.log('Transaction mined', tx))
    .catch(e => console.log(e.message))
}
```

## Command Line Interface

The `commander` library provides maximum command line parsing convenience.


```js
program.version('0.1.0')

program
  .command('spend <receiver> <amount>')
  .option('-H, --host [hostname]', 'Node to connect to', 'http://localhost:3013')
  .option('--debug', 'Switch on debugging')
  .action(spend)

program.parse(process.argv)
if (program.args.length === 0) program.help()
```

,
### Node.js bundle

The Node.js bundle is primarily interesting for scripts which use non-transpiled
code, such as the ones provided in the [`examples/node` directory](../examples/node) of the project.

```js
const { Universal: Ae, MemoryAccount, Node } = require('@aeternity/aepp-sdk')

const node1 = Node({ url: 'https://testnet.aeternity.io', internalUrl: 'https://testnet.aeternity.io' })
// const node2 = ...

const acc1 = MemoryAccount({ keypair: { publicKey: 'YOUR_PUBLIC_KEY', secretKey: 'YOUR_PRIVATE_KEY' } })
// const acc2 = ...
Promise.all([
  node1
]).then(nodes => {
    Ae({
      nodes: [
        { name: 'someNode', instance: nodes[0] },
      ],
      compilerUrl: 'COMPILER_URL',
      accounts: [
        acc1,
      ]
    }).then(ae => {
      ae.height().then(height => {
        console.log('Current Block', height)
      })
    })
})


// same with async
const main = async () => {
  const node1 = await Node({ url: 'https://testnet.aeternity.io', internalUrl: 'https://testnet.aeternity.io' })
  // const node2 = ...

  const acc1 = MemoryAccount({ keypair: { publicKey: 'YOUR_PUBLIC_KEY', secretKey: 'YOUR_PRIVATE_KEY' } })
  // const acc2 = ...

  const client = await Ae({
      nodes: [
        { name: 'someNode', instance: node1 },
      ],
      compilerUrl: 'COMPILER_URL',
      accounts: [
        acc1,
      ],
      address: 'SELECTED_ACCOUNT_PUB'
  })
  const height = await client.height()
  console.log('Current Block', height)
}

// call main
main()
```
,
,
