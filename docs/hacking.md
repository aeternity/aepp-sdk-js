# Documentation for the JS SDK

## Principles

The Javascript SDK wraps the æternity API, as explosed by
[Epoch's Swagger file]. It aims to abstract the API, while still providing
low-level access when necessary.

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

[Epoch's Swagger file]: https://github.com/aeternity/epoch/blob/master/config/swagger.yaml
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

aepp-sdk is compiled to EcmaScript 5 through WebPack and Babel and is expected
to work in any sufficiently new version of Node.js or modern web browser.

The minimum version Node.js is still expected to work at is 8.11.

## Building

aepp-sdk is built using [pnpm]. In order to build a development version, issue
the `build:dev` command.

```
pnpm install
pnpm run build:dev
```

The WebPack compilation provides two different build artifacts in `dist/`, one
for Node.js and one for browsers. When referencing aepp-sdk through any modern
build tooling, it should pick the right one automatically through the entry
points defined in `package.json`.

[pnpm]: https://pnpm.js.org/

## Installation

In order to add a local development version of aepp-sdk to a project, `npm link`[1] can be used.

[1]: https://docs.npmjs.com/cli/link

## [Releases]

[Releases]: releases.md
