# Contributing Info

## Principles

The Javascript SDK wraps the æternity API explosed by
[Node's Swagger file]. It aims to abstract the API, while still providing
low-level access to it's endpoints, when necessary.

It uses the following Javascript technologies and principles:

- [stampit] provides composable Factories based on the [Stamp
  Specification]. This is how aepp-sdk approached the [composition over
  inheritance] principle.
- [JavaScript the Good Parts] (because Crockford is always right)
- [ES6 modules], using `export` and `import`
- [Promises] using ES7 [async/await] syntax, where applicable
- Functional Programming using [Ramda]
- Statelessness wherever possible
- [webpack 4] and the [Babel] [loader]
- Strictly enforced [StandardJS]
- Loose coupling of modules to enable [tree-shaking]
- Convention over configuration
- "Easy things should be easy, and hard things should be possible." [source] -- [Larry Wall]
- Support for
  - module access, enabling tree-shaking
  - direct use in node scripts through bundling
  - direct use in browser `<script>` tags through bundling
  - bundling through webpack

[Node's Swagger file]: https://github.com/aeternity/aeternity/blob/master/config/swagger.yaml
[stampit]: http://stampit.js.org/
[Stamp Specification]: https://github.com/stampit-org/stamp-specification
[composition over inheritance]: https://medium.com/front-end-hacking/classless-javascript-composition-over-inheritance-6b27c35893b1
[JavaScript the Good Parts]: https://github.com/dwyl/Javascript-the-Good-Parts-notes
[ES6 modules]: https://hacks.mozilla.org/2015/08/es6-in-depth-modules/
[Promises]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
[async/await]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
[Ramda]: https://ramdajs.com/
[webpack 4]: https://webpack.js.org/
[Babel]: https://babeljs.io/
[loader]: https://github.com/babel/babel-loader
[StandardJS]: https://standardjs.com/
[tree-shaking]: https://webpack.js.org/guides/tree-shaking/
[source]: https://www.amazon.com/gp/feature.html?ie=UTF8&docId=7137
[Larry Wall]: https://en.wikipedia.org/wiki/Larry_Wall

## Requirements

aepp-sdk is transpiled to EcmaScript 5 through [WebPack](https://webpack.js.org/), using [Babel](https://babeljs.io/) and is expected to work in any sufficiently new version of [Node.js](https://nodejs.org/en/) (`>= 8.11`) or modern web browser.

## Contributing

1. Clone the application
2. Make sure your editor/IDE can read and use the `.editorconfig` file
3. Start hacking (and dont forget to add [test](#testing) for whatever you'll be building).

## Documenting

Apart from documenting features and code, there is also documentation automatically generated using [**jsdoc**](http://usejsdoc.org/) for documenting JS files (later transformed in to `.md` files (to have them readable in platforms like GitHub) and [**docco**](http://ashkenas.com/docco/) for documenting examples and code partials.

```bash
#generate documentation with docco + jsdoc (and markdownify jsdoc)
npm run docs:docco && npm run docs:api
```

## Building

aepp-sdk is built using [pnpm]. In order to build a development version, launch the `build:dev` command.

```bash
pnpm install
pnpm run build:dev
```

## Testing

To test, launch the `test` command. This will run [mocha](https://mochajs.org/)'s tests locally.

```bash
pnpm run test
```

This repository also includes a docker-compose file, to allow you to **run your own aeternity node locally**. If you want to do so, **from the root of the project**:

1. Create a _**docker-compose.override.yml**_ file with this content:
```yaml
version: "3"
services:
  node:
    ports:
      - 3013:3013
      - 3113:3113
      - 3014:3014
      - 3001:3001
```
2. Run `docker-compose up node`
3. Congrats! you're now running your own aeternity node locally.


## Composing new Flavors
You can also "compose" your own flavor by mixing 2 or more flavors likes so:

```js
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet.js'
import Contract from '@aeternity/aepp-sdk/es/ae/contract.js'
import MemoryAccount from '@aeternity/aepp-sdk/es/account/memory.js'

// make a "mixed flavor" containing Wallet and Contracts flavors
Wallet.compose(Contract)({
            url: 'https://sdk-testnet.aepps.com',
            internalUrl: 'https://sdk-testnet.aepps.com',
            accounts: [MemoryAccount({keypair: {secretKey: account.priv, publicKey: account.pub}})],
            address: account.pub,
            onTx: true, // or a function to Guard the Rpc client
            onChain: true, // or a function to Guard the Rpc client
            onAccount: true, // or a function to Guard the Rpc client
            networkId: 'ae_uat'
          }).then(ae => {
            // ae is your initialised client now! :)
            // ...
```

The WebPack compilation provides two different build artifacts in `dist/`, one
for Node.js and one for browsers. When referencing aepp-sdk through any modern
build tooling, it should pick the right one automatically through the entry
points defined in `package.json`.

[pnpm]: https://pnpm.js.org/

## Installation / Linking

In order to add a local development version of aepp-sdk to a project, `npm link`[1] can be used.

[1]: https://docs.npmjs.com/cli/link


## Releasing

[How to release a new version](releases.md)


## Guides

If you're interested in getting sample code/guide, you can check out the [Guides](../README.md)
