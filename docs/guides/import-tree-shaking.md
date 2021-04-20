# Tree Shaking

It is generally advised to use ESM (EcmaScript Modules), whenever possible. At
this point however, this requires a modern _bundler_ which understands ES2015
`import/export` syntax, such as [webpack] 4 (or newer).

Using this method enables the use of [Tree shaking] (dead code
elimination).

[webpack]: https://webpack.js.org/
[Tree shaking]: https://webpack.js.org/guides/tree-shaking/
