# Compatibility Table

This package is expected to work in these environments:

| Environment                           | Comment                                                                       |
|---------------------------------------|-------------------------------------------------------------------------------|
| nodejs>=18.19                         |                                                                               |
| Browser using script tag, umd         |                                                                               |
| webpack@4                             | requires a fix to work with mjs build [webpack-4]                             |
| webpack@5                             |                                                                               |
| @vue/cli@4 (webpack@4)                | requires aliases to ESM versions of autorest deps [vue-cli4]                  |
| @vue/cli@5 (webpack@5)                |                                                                               |
| vue@3                                 | AeSdk, Contract instances can't be reactive [vue-3]                           |
| create-react-app@4 (webpack@4)        | mjs build is not compatible with webpack@4 [cra-webpack-4]                    |
| create-react-app@5 (webpack@5)        |                                                                               |
| create-react-native-app@3 (webpack@4) | mjs build is not compatible with webpack@4 [cra-webpack-4]                    |
| meteor@2                              |                                                                               |
| jest@27.5.1                           | requires an environment where Buffer is instanceof Uint8Array [jest]          |
| typescript>=4.8                       | requires `tsconfig.json` adjustments [typescript]                             |
| vite@3                                | requires `build.target: 'es2020'` and `bigint: true` in vite.config.js [vite] |

[webpack-4]: https://github.com/webpack/webpack/issues/7482#issuecomment-394884837
[cra-webpack-4]: https://github.com/aeternity/aepp-sdk-js/issues/1529
[jest]: https://github.com/facebook/jest/issues/4422#issuecomment-770274099
[typescript]: README.md#typescript-projects
[vue-cli4]: README.md#vue-cli4
[vue-3]: README.md#vue3
[vite]: https://github.com/vitejs/vite/issues/9062#issuecomment-1202167352
