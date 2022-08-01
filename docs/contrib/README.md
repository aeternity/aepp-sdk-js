# Development

## Principles

The Javascript SDK wraps the æternity API exposed by
[Node's Swagger file]. It aims to abstract the API, while still providing
low-level access to it's endpoints, when necessary.

It uses the following Javascript technologies and principles:

- [JavaScript the Good Parts] (because Crockford is always right)
- [ES6 modules], using `export` and `import`
- [Promises] using ES7 [async/await] syntax, where applicable
- Statelessness wherever possible
- [webpack] and the [Babel] [loader]
- Loose coupling of modules to enable [tree-shaking]
- Convention over configuration
- "Easy things should be easy, and hard things should be possible." [source] -- [Larry Wall]
- Support for
    - module access, enabling tree-shaking
    - direct use in node scripts through bundling
    - direct use in browser `<script>` tags through bundling
    - bundling through webpack

[Node's Swagger file]: https://github.com/aeternity/aeternity/blob/master/config/swagger.yaml
[JavaScript the Good Parts]: https://github.com/dwyl/Javascript-the-Good-Parts-notes
[ES6 modules]: https://hacks.mozilla.org/2015/08/es6-in-depth-modules/
[Promises]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
[async/await]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
[webpack]: https://webpack.js.org/
[Babel]: https://babeljs.io/
[loader]: https://github.com/babel/babel-loader
[tree-shaking]: https://webpack.js.org/guides/tree-shaking/
[source]: https://www.amazon.com/gp/feature.html?ie=UTF8&docId=7137
[Larry Wall]: https://en.wikipedia.org/wiki/Larry_Wall

## Requirements

aepp-sdk is transpiled to EcmaScript 5 through [WebPack](https://webpack.js.org/), using [Babel](https://babeljs.io/) and is expected to work in any sufficiently new version of [Node.js](https://nodejs.org/en/) or modern web browser.

## Contributing

1. Clone the application
2. Make sure your editor/IDE can read and use the `.editorconfig` file
3. Start hacking (and don't forget to add [test](#testing) for whatever you'll be building).

## Documenting

Apart from documenting features and code, there is also documentation automatically generated using [**TypeDoc**](https://typedoc.org/) for documenting TS files and [a script](https://github.com/aeternity/aepp-sdk-js/blob/master/tooling/docs/examples-to-md.js) for documenting examples and code partials.

```bash
#generate examples and api documentation
npm run docs:examples && npm run docs:api
```

## Building

aepp-sdk is built using npm. In order to build a development version, launch the `build:dev` command.

```bash
npm install
npm run build:dev
```

## Generate bundle report

```bash
npx webpack --mode=production --env REPORT
```

## Testing

To test, launch the `test` command. This will run [mocha](https://mochajs.org/)'s tests locally.

```bash
npm test
```

This repository also includes a docker-compose file, to allow you to **run your own æternity node locally**. If you want to do so, **from the root of the project**:

1. Run `docker-compose up node`
2. Congrats! you're now running your own æternity node locally.

The WebPack compilation provides two different build artifacts in `dist/`, one
for Node.js and one for browsers. When referencing aepp-sdk through any modern
build tooling, it should pick the right one automatically through the entry
points defined in `package.json`.

## Installation / Linking

In order to add a local development version of aepp-sdk to a project, `npm link`[1] can be used.

[1]: https://docs.npmjs.com/cli/link


## Releasing

[How to release a new version](releases.md)
