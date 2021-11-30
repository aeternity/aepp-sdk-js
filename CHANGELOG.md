# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [10.0.0-beta.1](https://github.com/aeternity/aepp-sdk-js/compare/v9.0.1...v10.0.0-beta.1) (2021-11-24)


### ⚠ BREAKING CHANGES

* specify browserlist to better choice of features to transpile
* **aci:** don't require source code
* make contractDeploy a wrapper, remove unused code
* inline getConsensusProtocolVersion function
* invert and rename forceCodeCheck option to validateByteCode
* require compiler 6 and above
* make contractCall/Static a wrapper around getContractInstance
* **contract instance:** thread all extra options as contract's
* **contract instance:** remove unnecessary `setOptions` function
* remove contractDecodeData as extra wrapper
* remove contractEncodeCall as extra wrapper
* don't accept ak_ addresses as hash, bytes and signature
* **transformation:** drop extra wrapper around bindings
* **transformation:** don't export extra functions
* drop unnecessary skipTransformDecoded option
* drop unnecessary skipArgsConvert option

### Features

* **aci:** don't require source code ([5c690d2](https://github.com/aeternity/aepp-sdk-js/commit/5c690d2d77a433c8496ab9cda6fd66e52a6b4b23))
* decode using calldata package ([2bb494d](https://github.com/aeternity/aepp-sdk-js/commit/2bb494d67c02c9abd017274e06c55ed07aef65d7))
* encode using calldata package ([eeebbd5](https://github.com/aeternity/aepp-sdk-js/commit/eeebbd58b860c2e4b35c1ed4cb3aaf12677b0982))
* **poll-interval:** reduce poll interval to be a more sensible default ([9e55b2b](https://github.com/aeternity/aepp-sdk-js/commit/9e55b2be92125b42713f0e2a35916abc9f3c18fb))
* support for new node feature next-nonce of release 6.2.0 ([#1299](https://github.com/aeternity/aepp-sdk-js/issues/1299)) ([e40b046](https://github.com/aeternity/aepp-sdk-js/commit/e40b04678b7c4819074803095da31c813aa367e0))
* **aens:** enable commitmentHash preclaim in tests ([5de05e5](https://github.com/aeternity/aepp-sdk-js/commit/5de05e58d097a2842c78d80a34c49a8e7635997c))


### Bug Fixes

* **compiler errors:** construct error message by server response ([8621352](https://github.com/aeternity/aepp-sdk-js/commit/8621352691d47373d4e79d495f2d6e6d6e87b432))
* **events:** fix event decoding order and address prefix ([faad530](https://github.com/aeternity/aepp-sdk-js/commit/faad53057cbf7bca65d0f2c6262b27090773fbb6))
* **events:** fix test for incorrect address return type ([31aaeec](https://github.com/aeternity/aepp-sdk-js/commit/31aaeec87fcd59eb3866682a0d529100a975f7fb))
* **node errors:** construct error message by server response ([d556936](https://github.com/aeternity/aepp-sdk-js/commit/d5569361c925bca35df76f31bcb049c83a6daf31))
* **semverSatisfies:** ignore build number ([c3cce0a](https://github.com/aeternity/aepp-sdk-js/commit/c3cce0a256b9b0af29b30662e4fa7a08bb9ab187))
* commitlint issue ([2c1cf54](https://github.com/aeternity/aepp-sdk-js/commit/2c1cf541e45b87b6acf54c2929847a3d227d8ada))
* don't accept ak_ addresses as hash, bytes and signature ([cbaac62](https://github.com/aeternity/aepp-sdk-js/commit/cbaac6263dd1729d64ef3a01c94e10687fed3b0d))
* drop unnecessary skipArgsConvert option ([6d4a599](https://github.com/aeternity/aepp-sdk-js/commit/6d4a59986d6833866b6828085fad96b364e5d315))
* drop unnecessary skipTransformDecoded option ([bb49239](https://github.com/aeternity/aepp-sdk-js/commit/bb492396a29d673f02eee7cfec4e114c2fba2f3c))
* inline getConsensusProtocolVersion function ([75f0447](https://github.com/aeternity/aepp-sdk-js/commit/75f044792bd2d81eca3a2abc8218e8ca5f167134))
* invert and rename forceCodeCheck option to validateByteCode ([72122fa](https://github.com/aeternity/aepp-sdk-js/commit/72122facdcec9921202b210c387c19509b26e578))
* make contractCall/Static a wrapper around getContractInstance ([c4ec019](https://github.com/aeternity/aepp-sdk-js/commit/c4ec019372f5d5745378e781afb1eb6b2b5acfeb))
* make contractDeploy a wrapper, remove unused code ([48d36f9](https://github.com/aeternity/aepp-sdk-js/commit/48d36f9be30805a476590282bffae9944134eb41))
* remove contractDecodeData as extra wrapper ([5df2285](https://github.com/aeternity/aepp-sdk-js/commit/5df2285a7b5694475554e5154c544e0885bd4b33))
* require compiler 6 and above ([f9cef12](https://github.com/aeternity/aepp-sdk-js/commit/f9cef12a7db4b2559519ef7f8380cc9e89630492))
* specify browserlist to better choice of features to transpile ([c2ec71a](https://github.com/aeternity/aepp-sdk-js/commit/c2ec71a7690ed2590093c0cbff048599b5ca87bd))
* **contract instance:** remove unnecessary `setOptions` function ([b88e767](https://github.com/aeternity/aepp-sdk-js/commit/b88e767c86874f259ff7a1eb1784c368524e7167))
* **contract instance:** thread all extra options as contract's  ([10fb7ba](https://github.com/aeternity/aepp-sdk-js/commit/10fb7bad8f61b973c1be5daec50909d251ec1f90))
* remove contractEncodeCall as extra wrapper ([a4b303f](https://github.com/aeternity/aepp-sdk-js/commit/a4b303fbcc3b7cc544a2b5b3415d0f4a147b488c))
* **transformation:** don't export extra functions ([fa38b40](https://github.com/aeternity/aepp-sdk-js/commit/fa38b40ef56744e2941db198533b3f454b3bf53c))
* **transformation:** drop extra wrapper around bindings ([9b70f8e](https://github.com/aeternity/aepp-sdk-js/commit/9b70f8ea0ce509a91ec78f0718574b59c0143de0))

## [9.0.1](https://github.com/aeternity/aepp-sdk-js/compare/v9.0.0...v9.0.1) (2021-10-04)

### Refactoring

* Remove channel from universal stamp ([63e88ce74](https://github.com/aeternity/aepp-sdk-js/commit/63e88ce74))

## [9.0.0](https://github.com/aeternity/aepp-sdk-js/compare/v8.2.1...v9.0.0) (2021-09-30)

### ⚠ BREAKING CHANGES

* drop following AENS delegation signature methods over the new common `createAensDelegationSignature`  implementation which accepts an object as param ([456fe00](https://github.com/aeternity/aepp-sdk-js/commit/456fe00cb8b8eba09ea53800e8713550d0f329cc))
   * ` delegateNamePreclaimSignature`
   * ` delegateNameClaimSignature`
   * `delegateNameTransferSignature`
   * `delegateNameRevokeSignature`
* drop following oracle delegation signature methods over the new common  `createOracleDelegationSignature` implementation accepts an object param ([88b7bf3](https://github.com/aeternity/aepp-sdk-js/commit/88b7bf3aa55b3740c9a64fb4049abcc0fdd3b277))
   * `delegateOracleRegisterSignature`
   * `delegateOracleExtendSignature`
   * `delegateOracleRespondSignature`
* drop `assertedType`, use `decode` instead ([00d563f](https://github.com/aeternity/aepp-sdk-js/commit/00d563feca871e2c9474df667696946d1c8d12c7))
* drop `waitMined` static method ([2f299de](https://github.com/aeternity/aepp-sdk-js/commit/2f299de2c985ce2619db10e4a264f7e6d1b7279c))
* tx-validator now gives different, more meaningful, errors ([95a2a23](https://github.com/aeternity/aepp-sdk-js/commit/95a2a232f3fd8b875b223e352445b045a7217dad))
* no longer exports buildHash function, use hash or buildTxHash ([9e1fde7](https://github.com/aeternity/aepp-sdk-js/commit/9e1fde7693986359a9ac0ff80829dbc058882f7b))
* tx-verification is now done by default ([989b36f](https://github.com/aeternity/aepp-sdk-js/commit/989b36f28e9649fd74b384f2a16bf8fd64bac85c))

### Features

* `payForTransaction` method ([fbf204d](https://github.com/aeternity/aepp-sdk-js/commit/fbf204dd2ba333551327adce579b9f9d9edc601b))
  * don't check is GA if innerTx ([0ee9db4](https://github.com/aeternity/aepp-sdk-js/commit/0ee9db4b7e1cbab5b874bee56b5bf8814610b913))
  * don't sent to blockchain if innerTx ([523e9bb](https://github.com/aeternity/aepp-sdk-js/commit/523e9bbd62a506efd8a9d50317bcf3980052948e))
* **deposit-trap:** enforce zero value for `deposit` during contract deploy ([cfb5f22](https://github.com/aeternity/aepp-sdk-js/commit/cfb5f2263316f0f70290cb174c1d334cf49c6db3))

### Maintenance
* change default gas limit to 25000 ([831e4dd](https://github.com/aeternity/aepp-sdk-js/commit/831e4dde12a78583d1a567fdc5a9ef86518d5fe6))

### Bug Fixes

* **AENS:** name length minimum bid fee ([db6ca4c](https://github.com/aeternity/aepp-sdk-js/commit/db6ca4c3d89eedf7fa326bd6d0484ea0d94de19e))
* **delegate-signature:** stop using the default account in the context of signing ([29d760e](https://github.com/aeternity/aepp-sdk-js/commit/29d760ef04591cd9a745a508ff4dfbb8859c347a))
* **mustAccountStamp:** process accounts only if supplied ([10ec2c3](https://github.com/aeternity/aepp-sdk-js/commit/10ec2c37f6f35516023cace435bdde6294786ed7))
* swagger https issue ([3a876bb](https://github.com/aeternity/aepp-sdk-js/commit/3a876bbb80300cbf91891daa642f6daee61c1427))
* **tx serialisation:** accept unpackTx output produced by deserialisator ([ff0b3f5](https://github.com/aeternity/aepp-sdk-js/commit/ff0b3f551f7cf0684ac9c8e528d94eae9c31f226))

## [8.2.1](https://github.com/aeternity/aepp-sdk-js/compare/v8.2.0...v8.2.1) (2021-06-21)

### Bug Fixes

* swagger file of aeternity's compiler ([4001e64](https://github.com/aeternity/aepp-sdk-js/commit/4001e64f8ce90d234c9cd971e05f6b386b54221d))
* swagger file of aeternity's latest compiler ([a1caa03](https://github.com/aeternity/aepp-sdk-js/commit/a1caa0374e3a0be84644d7b8dd846d70193e8242))

## [8.2.0](https://github.com/aeternity/aepp-sdk-js/compare/8.1.0...v8.2.0) (2021-06-17)

### ⚠ BREAKING CHANGES

* **crypto:** remove outdated generateSaveWallet function
* **crypto:** remove unused prepareTx, encodeTx, decodeTx functions
* **crypto:** remove unused hexStringToByte function
* **crypto:** rename messageToBinary to messageToHash adding hashing
* **crypto:** drop extra "personal" from message functions
* **crypto:** remove unused formatAddress function
* **crypto:** remove unused addressToHex function
* **node-pool:** inline helpers, export by default
* **string:** use isAddressValid instead of isAeAddress
* **string:** remove unused snakeOrKebabToPascal function
* drop outdated protocols and transactions schemas
* drop compatibility with node@5

### Bug Fixes

* export aepp-wallet-communication ([d5d741c](https://github.com/aeternity/aepp-sdk-js/commit/d5d741cfd71c757f1b3e55e6708fb589c8ed6136))
* ponyfill `Buffer` in browser ([953bf08](https://github.com/aeternity/aepp-sdk-js/commit/953bf0845bd64731cd57ed152fed67575120a276))
* ponyfill `process` in browser ([798ab63](https://github.com/aeternity/aepp-sdk-js/commit/798ab63d0f3ebd3648be4bfce88b0b3d38013e6e))
* **rlp:** import as it is ([736b0f5](https://github.com/aeternity/aepp-sdk-js/commit/736b0f5b8a4cfb39c76c2dc57880c234b804a8e2))
* typo name of broadcast failed error generator ([ae7e823](https://github.com/aeternity/aepp-sdk-js/commit/ae7e8238c378e0aa2095328577ef0ce2bd518e49))
* **examlple-aepp:** open only when ready to accept connection ([4872eb9](https://github.com/aeternity/aepp-sdk-js/commit/4872eb979330f1676241dfefc434c0eeafcf5eab))


* **crypto:** drop extra "personal" from message functions ([34288cb](https://github.com/aeternity/aepp-sdk-js/commit/34288cb9adb443d8bd44ba6ddc93edf4de37349a))
* **crypto:** remove outdated generateSaveWallet function ([37298be](https://github.com/aeternity/aepp-sdk-js/commit/37298be567d7065e06904cb0d7d5a01f649131fb))
* **crypto:** remove unused addressToHex function ([93f9def](https://github.com/aeternity/aepp-sdk-js/commit/93f9def0e90bcc20641aab464f93ddcedd1d1aa2))
* **crypto:** remove unused formatAddress function ([a5d4b62](https://github.com/aeternity/aepp-sdk-js/commit/a5d4b6263d45edf0e454addfe1e96b4741b46db3))
* **crypto:** remove unused hexStringToByte function ([ed39a76](https://github.com/aeternity/aepp-sdk-js/commit/ed39a7659ac04abd5dbd80d54d28369bfa4322b9))
* **crypto:** remove unused prepareTx, encodeTx, decodeTx functions ([64d15eb](https://github.com/aeternity/aepp-sdk-js/commit/64d15eb8eb7608b7418eebd84bedb697a1a7b12a))
* **crypto:** rename messageToBinary to messageToHash adding hashing ([df37004](https://github.com/aeternity/aepp-sdk-js/commit/df37004f57a751b0f089dcef7b8fbcdf306bd08f))
* **node-pool:** inline helpers, export by default ([ed1cfb5](https://github.com/aeternity/aepp-sdk-js/commit/ed1cfb59ada165b535a7f9bb7a3f3acdec00aac1))
* **string:** remove unused snakeOrKebabToPascal function ([79bdc04](https://github.com/aeternity/aepp-sdk-js/commit/79bdc0490024e173c7620cfa089a4e84212930b3))
* **string:** use isAddressValid instead of isAeAddress ([ac7d827](https://github.com/aeternity/aepp-sdk-js/commit/ac7d82701e30f9b7f2bc0d40412244face330d18))
* drop compatibility with node@5 ([f5e2fdb](https://github.com/aeternity/aepp-sdk-js/commit/f5e2fdb42cc115a11c6be6e3dfd5cd1acfd6d3cc))
* drop outdated protocols and transactions schemas ([f18d305](https://github.com/aeternity/aepp-sdk-js/commit/f18d305ca29204f006a438c157add0b511df4e93))

## [8.1.0](https://github.com/aeternity/aepp-sdk-js/compare/8.0.0...8.1.0) (2021-05-31)

### Bug Fixes

* **poi-tx schema:** use proper type name ([9e7c7b2](https://github.com/aeternity/aepp-sdk-js/commit/9e7c7b22c70cb0dcd194f8b1871be8fbf9b914ea))
* **wait-for-tx-confirm:** validate transaction height after awaitHeight ([95e0d93](https://github.com/aeternity/aepp-sdk-js/commit/95e0d9334ffb9bf56f028fcc96d75f5a83905df0))

### Features

* support compiler@6.0.0 and above ([3cdc7f9](https://github.com/aeternity/aepp-sdk-js/commit/3cdc7f9046b53de5c1ddeb0f7bd1b20af7cf433e))

## [8.0.0](https://github.com/aeternity/aepp-sdk-js/compare/8.0.0-beta.2...8.0.0) (2021-05-18)

### Bug Fixes

* avoid instanceof between possible not/polyfilled objects ([906ee0e](https://github.com/aeternity/aepp-sdk-js/commit/906ee0ea4eb71160c3a482ea068cbb0d857cef8f))

## [8.0.0-beta.2](https://github.com/aeternity/aepp-sdk-js/compare/8.0.0-beta.1...8.0.0-beta.2) (2021-05-12)

### Bug Fixes

* revert conversion of case in calls to compiler ([0a69e49](https://github.com/aeternity/aepp-sdk-js/commit/0a69e4979b20bdd5ee954e2860fdc827f808eb8f))

### Maintenance

* avoid ts definitions based on broken JsDoc ([572d19f](https://github.com/aeternity/aepp-sdk-js/commit/572d19f5ae6bd549c92a1a37452c0270490b9f6e))

## [8.0.0-beta.1](https://github.com/aeternity/aepp-sdk-js/compare/7.7.0...8.0.0-beta.1) (2021-05-6)

### Important changes

* Iris compatibility (compatible with nodes >= 5.2.0 < 7.0.0)
* initial TypeScript support (not enough type definitions yet)
* documentation is generated using MkDocs on Travis

### BREAKING CHANGES

* Drop old aepp-wallet RPC interface ([254f5a93](https://github.com/aeternity/aepp-sdk-js/commit/254f5a93))
* **refactor:** don't retrieve account from process.env ([59e5c9b5](https://github.com/aeternity/aepp-sdk-js/commit/59e5c9b5))
* **refactor(crypto):** don't reexport RLP methods ([c6004bc7](https://github.com/aeternity/aepp-sdk-js/commit/c6004bc7))
* **refactoring:** remove legacy contractDecodeDataAPI compiler method ([dfadac8d](https://github.com/aeternity/aepp-sdk-js/commit/dfadac8d))
* **refactor:** rename `forceCompatibility` to more clear `ignoreVersion` ([72f1d326](https://github.com/aeternity/aepp-sdk-js/commit/72f1d326))
* **refactoring:** require compiler above or equal to 4.1.0 ([c9f48f91](https://github.com/aeternity/aepp-sdk-js/commit/c9f48f91))
* **RpcClient:** Drop unnecessary action stuff ([84545fd7](https://github.com/aeternity/aepp-sdk-js/commit/84545fd7))
* Combine RpcWallet and RpcClients ([12892002](https://github.com/aeternity/aepp-sdk-js/commit/12892002))
* Drop old names support, split ensureNameValid and isNameValid ([315a78a9](https://github.com/aeternity/aepp-sdk-js/commit/315a78a9))
* **refactor(contract-aci):** export single function instead of stamp ([091b3282](https://github.com/aeternity/aepp-sdk-js/commit/091b3282))
* Combine Accounts and Selector into AccountMultiple ([0cacd3b3](https://github.com/aeternity/aepp-sdk-js/commit/0cacd3b3))
* Use swagger-client instead of a custom implementation ([4b3260d5](https://github.com/aeternity/aepp-sdk-js/commit/4b3260d5))
* Remove OracleNodeAPI wrapper ([c6f9a76d](https://github.com/aeternity/aepp-sdk-js/commit/c6f9a76d))
* Flatten options of contractCallStatic, remove extra dryRunContractTx ([f3ffb664](https://github.com/aeternity/aepp-sdk-js/commit/f3ffb664))
* **txDryRun:** Simplify arguments, support `txEvents` option ([401c53da](https://github.com/aeternity/aepp-sdk-js/commit/401c53da))
* **contracts:** Mark handleCallError as private, simplify arguments ([bdf76e24](https://github.com/aeternity/aepp-sdk-js/commit/bdf76e24))
* import/no-named-as-default linter error ([d63e1511](https://github.com/aeternity/aepp-sdk-js/commit/d63e1511))
* **oracle:** make pollForQueries a sync function ([dc955e14](https://github.com/aeternity/aepp-sdk-js/commit/dc955e14))
* chore: drop aevm support and backend (compiler) option ([6eb702dd](https://github.com/aeternity/aepp-sdk-js/commit/6eb702dd))
* refactor(schema): export enum with consensus protocol versions ([e92f187d](https://github.com/aeternity/aepp-sdk-js/commit/e92f187d))

### Features

* **swagger:** allow to provide external specification ([683082b3](https://github.com/aeternity/aepp-sdk-js/commit/683082b3))
* **swagger:** make compatible with OpenAPI 3 ([1d83f1a4](https://github.com/aeternity/aepp-sdk-js/commit/1d83f1a4))
* switch to v3 endpoints on Iris ([eca6697b](https://github.com/aeternity/aepp-sdk-js/commit/eca6697b))
* **traverse-keys:** add keysOfValuesToIgnore option as a workaround ([8ff5afe4](https://github.com/aeternity/aepp-sdk-js/commit/8ff5afe4))
* Use es modules version in browser if supported ([b49c38f0](https://github.com/aeternity/aepp-sdk-js/commit/b49c38f0))
* Add typescript support ([abde033a](https://github.com/aeternity/aepp-sdk-js/commit/abde033a))

### Docs

* **contract:** fix default backend value ([9fcbeb32](https://github.com/aeternity/aepp-sdk-js/commit/9fcbeb32))
* **wallet-iframe:** fix disconnect button ([59014bd0](https://github.com/aeternity/aepp-sdk-js/commit/59014bd0))
* **examples-browser:** rearrange files and docs ([985e3b96](https://github.com/aeternity/aepp-sdk-js/commit/985e3b96))
* use relative links between docs pages ([d34d8181](https://github.com/aeternity/aepp-sdk-js/commit/d34d8181))
* remove outdated aecrypto example ([7df05bfe](https://github.com/aeternity/aepp-sdk-js/commit/7df05bfe))
* refactor node examples ([e8c443cf](https://github.com/aeternity/aepp-sdk-js/commit/e8c443cf))
* **changelog:** add missed single quote in example ([45fd0002](https://github.com/aeternity/aepp-sdk-js/commit/45fd0002))
* **resolveName:** Document verify option ([ca865596](https://github.com/aeternity/aepp-sdk-js/commit/ca865596))
* Remove outdated docs ([cf9c166f](https://github.com/aeternity/aepp-sdk-js/commit/cf9c166f))
* **decodeTx:** Fix arg naming and annotation ([883819c0](https://github.com/aeternity/aepp-sdk-js/commit/883819c0))
* **contract-events:** Remove outdated contract, update links and markup ([37d39d61](https://github.com/aeternity/aepp-sdk-js/commit/37d39d61))
* Update docs/guides/import-nodejs.md ([9dc274ed](https://github.com/aeternity/aepp-sdk-js/commit/9dc274ed))
* Update docs/guides/import-nodejs.md ([93bfce11](https://github.com/aeternity/aepp-sdk-js/commit/93bfce11))
* break down json obj keys necessary for account initialization in nodejs docs ([af5ee41d](https://github.com/aeternity/aepp-sdk-js/commit/af5ee41d))
* Ignore __pycache__ in the docs folder ([9989e8e7](https://github.com/aeternity/aepp-sdk-js/commit/9989e8e7))
* Specify the python version more precisely ([d6204523](https://github.com/aeternity/aepp-sdk-js/commit/d6204523))
* Add __pycache__ to .gitignore ([f0b7e1f1](https://github.com/aeternity/aepp-sdk-js/commit/f0b7e1f1))
* Add navigation and update some titles ([8ad15ced](https://github.com/aeternity/aepp-sdk-js/commit/8ad15ced))
* **docco template:** Remove extra new lines around code, skip extra blocks ([65ce3cf1](https://github.com/aeternity/aepp-sdk-js/commit/65ce3cf1))
* **aecontract:** Make a list out of a long sentence ([8ff7839c](https://github.com/aeternity/aepp-sdk-js/commit/8ff7839c))
* **aens-usage:** Use more semantic markup, compatible with mkdocs ([de3d3cd5](https://github.com/aeternity/aepp-sdk-js/commit/de3d3cd5))
* **docs readme:** Fix typos and formatting ([5b0c790d](https://github.com/aeternity/aepp-sdk-js/commit/5b0c790d))
* Add initial mkdocs and readthedocs configuration ([b688a96b](https://github.com/aeternity/aepp-sdk-js/commit/b688a96b))
* Extract quick-start to guides ([28f7e6f7](https://github.com/aeternity/aepp-sdk-js/commit/28f7e6f7))
* Update testnet URL ([7bb823f8](https://github.com/aeternity/aepp-sdk-js/commit/7bb823f8))
* **assertedType:** Make the last parameter more obvious ([50094d3a](https://github.com/aeternity/aepp-sdk-js/commit/50094d3a))
* **travis:** Build docs to gh-pages ([7c935a2b](https://github.com/aeternity/aepp-sdk-js/commit/7c935a2b))
* **Docs root:** Add link to API reference ([4a36102d](https://github.com/aeternity/aepp-sdk-js/commit/4a36102d))
* Move outdated disclaimer to the root readme ([80a6a663](https://github.com/aeternity/aepp-sdk-js/commit/80a6a663))
* Remove generated docs ([fd802b00](https://github.com/aeternity/aepp-sdk-js/commit/fd802b00))
* Fix api docs generation ([56e3aa9d](https://github.com/aeternity/aepp-sdk-js/commit/56e3aa9d))

### Code Refactoring

* use BigNumber constructor instead of custom wrapper ([4488b4d7](https://github.com/aeternity/aepp-sdk-js/commit/4488b4d7))
* avoid extra object nesting ([f99d3045](https://github.com/aeternity/aepp-sdk-js/commit/f99d3045))
* **compiler:** use swagger file ([0d821614](https://github.com/aeternity/aepp-sdk-js/commit/0d821614))
* **semver-satisfies:** remove extra splitting by dash ([35d5c11a](https://github.com/aeternity/aepp-sdk-js/commit/35d5c11a))
* remove extra char in regex ([37eeefae](https://github.com/aeternity/aepp-sdk-js/commit/37eeefae))
* refactor wallet detector ([1bc8d027](https://github.com/aeternity/aepp-sdk-js/commit/1bc8d027))
* **shareWalletInfo:** Don't create unnecessary copy of info ([3a4e50b9](https://github.com/aeternity/aepp-sdk-js/commit/3a4e50b9))
* Inline receive helper that is used once ([a4a13889](https://github.com/aeternity/aepp-sdk-js/commit/a4a13889))
* **rpc:** Inline helpers used once ([21903f4d](https://github.com/aeternity/aepp-sdk-js/commit/21903f4d))
* **rpc:** Prefer default export ([70fc3f0f](https://github.com/aeternity/aepp-sdk-js/commit/70fc3f0f))
* **rpc helpers:** Remove unused getWindow function ([c12b528f](https://github.com/aeternity/aepp-sdk-js/commit/c12b528f))
* don't use AsyncInit where it is not necessary ([84373697](https://github.com/aeternity/aepp-sdk-js/commit/84373697))
* **contract-aci:** reuse defaults from Contract stamp ([47013962](https://github.com/aeternity/aepp-sdk-js/commit/47013962))
* cleanup MIN_GAS_PRICE ([a5b28842](https://github.com/aeternity/aepp-sdk-js/commit/a5b28842))
* remove unused option string ([0e28af23](https://github.com/aeternity/aepp-sdk-js/commit/0e28af23))
* remove unused dryRunAccount default option ([8c42b706](https://github.com/aeternity/aepp-sdk-js/commit/8c42b706))
* Consistent new on Error creation ([39f93d3f](https://github.com/aeternity/aepp-sdk-js/commit/39f93d3f))
* **height:** Use a shorter syntax ([b013bf9d](https://github.com/aeternity/aepp-sdk-js/commit/b013bf9d))
* **height:** Improve naming of internal promise ([7915119a](https://github.com/aeternity/aepp-sdk-js/commit/7915119a))
* Move source code to "src" folder ([ddbce389](https://github.com/aeternity/aepp-sdk-js/commit/ddbce389))
* **sign-using-ga:** don't pass extra options ([44bab6d0](https://github.com/aeternity/aepp-sdk-js/commit/44bab6d0))

### Bug Fixes

* **traverse-keys:** add missed null check ([7b724b86](https://github.com/aeternity/aepp-sdk-js/commit/7b724b86))
* **swagger:** add workaround to get transaction details of GAAttachTx ([bb7ec479](https://github.com/aeternity/aepp-sdk-js/commit/bb7ec479))
* **top-block:** use getTopHeader on Iris, mark deprecated ([2b410257](https://github.com/aeternity/aepp-sdk-js/commit/2b410257))
* **nonce-verification:** add missed space ([3f244dfb](https://github.com/aeternity/aepp-sdk-js/commit/3f244dfb))
* missed aepp id in wallet connect handler ([1ed9284a](https://github.com/aeternity/aepp-sdk-js/commit/1ed9284a))
* **get-node-info:** bring url and internalUrl back ([e984f3b3](https://github.com/aeternity/aepp-sdk-js/commit/e984f3b3))
* contract error decoding ([d56931ac](https://github.com/aeternity/aepp-sdk-js/commit/d56931ac))
* **contract-aci:** don't proxy prepareArgsForEncode from helpers ([7e40eda0](https://github.com/aeternity/aepp-sdk-js/commit/7e40eda0))
* Improve handling of call error ([584eb5e4](https://github.com/aeternity/aepp-sdk-js/commit/584eb5e4))

### Maintenance

* Use ts-standard instead of standard ([be5aece7](https://github.com/aeternity/aepp-sdk-js/commit/be5aece7))
* **tsconfig:** Set target version to es5 ([ed131b1b](https://github.com/aeternity/aepp-sdk-js/commit/ed131b1b))
* Fix eslint errors manually ([dfe3a05e](https://github.com/aeternity/aepp-sdk-js/commit/dfe3a05e))
* require node below 7.0.0 ([ae1a5ef5](https://github.com/aeternity/aepp-sdk-js/commit/ae1a5ef5))
* require node above or equal to 5.2.0 ([ebb36f06](https://github.com/aeternity/aepp-sdk-js/commit/ebb36f06))
* update dependencies ([d876cff7](https://github.com/aeternity/aepp-sdk-js/commit/d876cff7))
* **deps:** bump ssri from 6.0.1 to 6.0.2 ([e0dfb8c9](https://github.com/aeternity/aepp-sdk-js/commit/e0dfb8c9))
* **deps:** bump y18n from 4.0.0 to 4.0.1 ([9e4acd61](https://github.com/aeternity/aepp-sdk-js/commit/9e4acd61))
* **deps:** bump elliptic from 6.5.3 to 6.5.4 ([feb3aa68](https://github.com/aeternity/aepp-sdk-js/commit/feb3aa68))
* **deps:** bump axios from 0.19.2 to 0.21.1 ([0f619f27](https://github.com/aeternity/aepp-sdk-js/commit/0f619f27))
* **deps:** bump ini from 1.3.5 to 1.3.7 ([95580324](https://github.com/aeternity/aepp-sdk-js/commit/95580324))
* **deps:** bump highlight.js from 10.4.0 to 10.4.1 ([9fcfadfe](https://github.com/aeternity/aepp-sdk-js/commit/9fcfadfe))
* **deps:** bump highlight.js from 10.1.1 to 10.4.0 ([43aff25f](https://github.com/aeternity/aepp-sdk-js/commit/43aff25f))
* **deps:** bump node-fetch from 2.6.0 to 2.6.1 ([80ed6d70](https://github.com/aeternity/aepp-sdk-js/commit/80ed6d70))
* Update node to 5.8.0 ([b6ff3422](https://github.com/aeternity/aepp-sdk-js/commit/b6ff3422))
* Update .gitignore ([1f1563dc](https://github.com/aeternity/aepp-sdk-js/commit/1f1563dc))
* add vscode .history folder to gitignore ([f4d61df4](https://github.com/aeternity/aepp-sdk-js/commit/f4d61df4))
* Update testnet URL in JS files ([dc1b807a](https://github.com/aeternity/aepp-sdk-js/commit/dc1b807a))
* add Iris consensus protocol ([41fd4a13](https://github.com/aeternity/aepp-sdk-js/commit/41fd4a13))
* add vsn 2 version of GA_META transaction ([b5abe098](https://github.com/aeternity/aepp-sdk-js/commit/b5abe098))
* add new versions of CHANNEL, CHANNEL_CREATE transactions ([366981a3](https://github.com/aeternity/aepp-sdk-js/commit/366981a3))
* support compilers below 6.0.0 ([876e5164](https://github.com/aeternity/aepp-sdk-js/commit/876e5164))

### Performance

* Optimize height queries ([f74ca4cb](https://github.com/aeternity/aepp-sdk-js/commit/f74ca4cb))

### Tests

* simplify GA tests ([7b9628c2](https://github.com/aeternity/aepp-sdk-js/commit/7b9628c2))
* **oracle:** avoid explicit waiting for 1 second ([f81cd3a1](https://github.com/aeternity/aepp-sdk-js/commit/f81cd3a1))
* passing of forceCompatibility flag ([6f900b98](https://github.com/aeternity/aepp-sdk-js/commit/6f900b98))
* **contract:** remove extra backend option ([184566f9](https://github.com/aeternity/aepp-sdk-js/commit/184566f9))
* update channel tests to fate ([35a996d8](https://github.com/aeternity/aepp-sdk-js/commit/35a996d8))
* Faster tests ([5d629103](https://github.com/aeternity/aepp-sdk-js/commit/5d629103))
* Extract strings tests into separate file ([f3c7d3fa](https://github.com/aeternity/aepp-sdk-js/commit/f3c7d3fa))
* **ga:** Remove extra await ([72bfc746](https://github.com/aeternity/aepp-sdk-js/commit/72bfc746))
* Make tests more precise ([fe7a8567](https://github.com/aeternity/aepp-sdk-js/commit/fe7a8567))

## [7.7.0](https://github.com/aeternity/aepp-sdk-js/compare/7.6.0...7.7.0) (2020-08-18)

### Features

* **transferFunds:** Accept onAccount option ([#1060](https://github.com/aeternity/aepp-sdk-js/pull/1060))
* **bigNumberToByteArray:** Avoid unexpected behaviour by throwing exception ([#1066](https://github.com/aeternity/aepp-sdk-js/pull/1066))
* **example:** Add disconnect button on wallet side ([#1056](https://github.com/aeternity/aepp-sdk-js/pull/1056))

### Code Refactoring

* Use external version of json-bigint ([#1033](https://github.com/aeternity/aepp-sdk-js/pull/1033))
* Make tests configuration more flexible ([#1037](https://github.com/aeternity/aepp-sdk-js/pull/1037))
* test-else: Exclude aens tests and speedup jobs ([#1040](https://github.com/aeternity/aepp-sdk-js/pull/1040))
* Avoid unnecessary eslint-disable ([#1043](https://github.com/aeternity/aepp-sdk-js/pull/1043))
* Add lint script ([#1045](https://github.com/aeternity/aepp-sdk-js/pull/1045))
* Refactor tests ([#1039](https://github.com/aeternity/aepp-sdk-js/pull/1039))
* Refactor bytes unit tests ([#1050](https://github.com/aeternity/aepp-sdk-js/pull/1050))
* travis: Run linter and unit tests firstly ([#1051](https://github.com/aeternity/aepp-sdk-js/pull/1051))
* Disable Travis on all branches except master, develop ([#1054](https://github.com/aeternity/aepp-sdk-js/pull/1054))
* Refactor contract, oracle, chain ([#1048](https://github.com/aeternity/aepp-sdk-js/pull/1048))
* Refactor state channels ([#1047](https://github.com/aeternity/aepp-sdk-js/pull/1047))

### Docs

* Fix typo in Readme.md ([#1053](https://github.com/aeternity/aepp-sdk-js/pull/1053))

## [7.6.0](https://github.com/aeternity/aepp-sdk-js/compare/7.5.0...7.6.0) (2020-07-22)

### Features

* **wallet-detector:** allow to connect wallet to aepp between iframes ([3f74a05](https://github.com/aeternity/aepp-sdk-js/commit/3f74a05350aac261d9637cf61b5dd519b29b6723))

## [7.5.0](https://github.com/aeternity/aepp-sdk-js/compare/7.4.2...7.5.0) (2020-06-18)

### Features

* **Account:** Build signature from transaction hash ([#1025](https://github.com/aeternity/aepp-sdk-js/issues/1025)) ([2cb8cc2](https://github.com/aeternity/aepp-sdk-js/commit/2cb8cc2))
* **ACI:** External contract integration ([#1027](https://github.com/aeternity/aepp-sdk-js/issues/1027)) ([a14d13a](https://github.com/aeternity/aepp-sdk-js/commit/a14d13a))

### Refactor

* **Deps:** Clean up repository ([#1029](https://github.com/aeternity/aepp-sdk-js/pull/1029))
* **Env:** Simplify Travis and docker-compose ([#1031](https://github.com/aeternity/aepp-sdk-js/pull/1031))
* **Env:** Remove unused packages ([#1032](https://github.com/aeternity/aepp-sdk-js/pull/1032))

## [7.4.2](https://github.com/aeternity/aepp-sdk-js/compare/7.2.1...7.4.2) (2020-06-10)

### Bug Fixes

* **AEX-2:** Handler always as Promise ([#1018](https://github.com/aeternity/aepp-sdk-js/issues/1018)) ([a8b0aab](https://github.com/aeternity/aepp-sdk-js/commit/a8b0aab))

### Refactor

* **AEX-2:** Add debug option for `getHandler`. Hide unknown message logs ([#1021](https://github.com/aeternity/aepp-sdk-js/issues/1021)) ([22c452c](https://github.com/aeternity/aepp-sdk-js/commit/22c452c))
* **Contract** Add AENS name resolver for Contract API

## [7.4.1](https://github.com/aeternity/aepp-sdk-js/compare/7.4.0...7.4.1) (2020-05-30)

### Bug Fixes

* **AEX-2:** Fix `isExtensionContext ` check ([#1011](https://github.com/aeternity/aepp-sdk-js/issues/1011)) ([814f99b](https://github.com/aeternity/aepp-sdk-js/commit/814f99b))

## [7.4.0](https://github.com/aeternity/aepp-sdk-js/compare/7.3.1...7.4.0) (2020-05-29)

### Bug Fixes

* **AEX-2:** Fix `getBrowserAPI` helper for cross-browser compatibility ([#1007](https://github.com/aeternity/aepp-sdk-js/issues/1007)) ([98b0e29](https://github.com/aeternity/aepp-sdk-js/commit/98b0e29))

### Features

* **ACI:** Event decoding ([#1006](https://github.com/aeternity/aepp-sdk-js/issues/1006)) ([6b8e6fe](https://github.com/aeternity/aepp-sdk-js/commit/6b8e6fe))

## [7.3.1](https://github.com/aeternity/aepp-sdk-js/compare/7.2.1...7.3.1) (2020-05-25)

### Improvements

* **AEX_2:** Handle network switch and update state on both sides. Adjust networkId check for signing request. Add node switcher for example apps ([#996](https://github.com/aeternity/aepp-sdk-js/pull/996))

## [7.3.0](https://github.com/aeternity/aepp-sdk-js/compare/7.2.1...7.3.0) (2020-05-20)

### Bug Fixes

* **example:** Regenerate lock ([#960](https://github.com/aeternity/aepp-sdk-js/issues/960)) ([5b6a30e](https://github.com/aeternity/aepp-sdk-js/commit/5b6a30e))

### Features

* **ACI:** expose events decoding through Contract ACI stamp  ([#971](https://github.com/aeternity/aepp-sdk-js/issues/971)) ([4930635](https://github.com/aeternity/aepp-sdk-js/commit/4930635))
* **AEX_2:** Allow to connect without node ([#991](https://github.com/aeternity/aepp-sdk-js/issues/991)) ([87b9ef9](https://github.com/aeternity/aepp-sdk-js/commit/87b9ef9))
* **AEX_2:** Connect to extension from iframe ([#992](https://github.com/aeternity/aepp-sdk-js/issues/992)) ([47179f7](https://github.com/aeternity/aepp-sdk-js/commit/47179f7))
* **Build:** Expose `ACIHelpers` and `ACITransformation` to bundle ([#970](https://github.com/aeternity/aepp-sdk-js/issues/970)) ([8b475e0](https://github.com/aeternity/aepp-sdk-js/commit/8b475e0))
* **Chain:** Add option `allowUnsynced` for `poll` method which allow to depend on `get tx/info` API ([9c80ce0](https://github.com/aeternity/aepp-sdk-js/commit/9c80ce0))
* **Channel:** add timeout message handler ([#983](https://github.com/aeternity/aepp-sdk-js/issues/983)) ([1940a15](https://github.com/aeternity/aepp-sdk-js/commit/1940a15))
* **Channel:** Channel force progress ([#964](https://github.com/aeternity/aepp-sdk-js/issues/964)) ([8f15bef](https://github.com/aeternity/aepp-sdk-js/commit/8f15bef))
* **Contract:** Add unpacked transaction to contract call with error ([#981](https://github.com/aeternity/aepp-sdk-js/issues/981)) ([4efd341](https://github.com/aeternity/aepp-sdk-js/commit/4efd341))
* **Node:** Add `debug` option to Channel stamp ([#967](https://github.com/aeternity/aepp-sdk-js/issues/967)) ([68fcba5](https://github.com/aeternity/aepp-sdk-js/commit/68fcba5))

## [7.2.1](https://github.com/aeternity/aepp-sdk-js/compare/7.2.0...7.2.1) (2020-03-25)

### Fix

* **build** Remove resolving of `minimist` using `npx`

## [7.2.0](https://github.com/aeternity/aepp-sdk-js/compare/7.1.1...7.2.0) (2020-03-24)

### Docs

* **Guide:** Adjust guide for RPC Wallet/Aepp usage

### Code Refactoring

* **RPC:** Refactor rpc-related stuff ([#921](https://github.com/aeternity/aepp-sdk-js/pull/921))
* **Build:** Include amountFormatter and SCHEMA in bundle([#936](https://github.com/aeternity/aepp-sdk-js/pull/936))
* **Examples** Update examples apps

### Features

* **TX:** Introduce new stamp `TxObject`([#933](https://github.com/aeternity/aepp-sdk-js/pull/933))
This stamp give more flexibility on transaction serialization/deserialization process
* **Keystore:** Allow to store secret as hex or buffer ([#939](https://github.com/aeternity/aepp-sdk-js/pull/939))
* **AEX-2:**  Add permission layer for account management ([#937](https://github.com/aeternity/aepp-sdk-js/pull/937))

## [7.1.1](https://github.com/aeternity/aepp-sdk-js/compare/7.1.0...7.1.1) (2020-02-27)

### Bug Fixes

* **TxBuilder:** Fix fee calculation for Oracles ([#924](https://github.com/aeternity/aepp-sdk-js/issues/924)) ([a9d784f](https://github.com/aeternity/aepp-sdk-js/commit/a9d784f))
* **AEX-2:** Broken wallet detection ([#926](https://github.com/aeternity/aepp-sdk-js/pull/926))

## [7.1.0](https://github.com/aeternity/aepp-sdk-js/compare/7.0.0...7.1.0) (2020-02-25)

### Refactor

* **AEX:** Simplify message id processing ([#916](https://github.com/aeternity/aepp-sdk-js/pull/916)). Pass AEEP `origin` to Wallet callback ([#918](https://github.com/aeternity/aepp-sdk-js/pull/918))
* **Node:** Move `getNetworkId` to helpers ([#910](https://github.com/aeternity/aepp-sdk-js/pull/910))
* **ACI:** Minor ACI validation improvement.
 Move decoding of events to builder. Add ability to decode events without ACI

### Features

* **ACI:** Implement Contract Events for ACI([Contract Event Guide](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/contract-events.md))
* **Contract:** Helpers for Oracle and AENS signature delegation([Signature delegation guide](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/delegate-signature-to-contract.md))
* **AmountFormatter:** Rework amount formatter. Change formatter units naming. Add more units ([#909](https://github.com/aeternity/aepp-sdk-js/issues/909)) ([6970efe](https://github.com/aeternity/aepp-sdk-js/commit/6970efe))
* **TxBuilder:** Integrate amount formatter to transaction builder ([#897](https://github.com/aeternity/aepp-sdk-js/pull/897))
* **Account:** Implement Message Signing (`singMessage`, `verifyMessage`) ([#903](https://github.com/aeternity/aepp-sdk-js/pull/903))
* **AEX-2:** Add `removeRpcClient` method to RpcClient/RpcWallet stamp's([#912](https://github.com/aeternity/aepp-sdk-js/pull/912))

## [7.0.0](https://github.com/aeternity/aepp-sdk-js/compare/7.0.0-next.3...7.0.0) (2020-01-31)

### Bug Fixes

* **AEX-2:** Fix firefox compatibility issue ([#882](https://github.com/aeternity/aepp-sdk-js/issues/882)) ([2e16e10](https://github.com/aeternity/aepp-sdk-js/commit/2e16e10))

### Features

* **Chain:** add new method `waitFOrTxConfirm`. Add new option { confirm: 3 } to all of high lvl SDK API. Add tests. Adjust docs ([#874](https://github.com/aeternity/aepp-sdk-js/issues/874)) ([43528f9](https://github.com/aeternity/aepp-sdk-js/commit/43528f9))
* **Compiler:** Add new compiler methods API ([#875](https://github.com/aeternity/aepp-sdk-js/issues/875)) ([a939395](https://github.com/aeternity/aepp-sdk-js/commit/a939395))
* **network:** Throw error when can not get networkId ([#863](https://github.com/aeternity/aepp-sdk-js/issues/863)) ([41b7bd1](https://github.com/aeternity/aepp-sdk-js/commit/41b7bd1))

### Docs

* **Guide** [Add 7.0.0 migration guide](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/migration/7.0.0.md)
* **Guide:** Add [Oracle](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/oracle-usage.md), [AENS](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/aens-usage.md) and [Contract](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/contract-aci-usage.md) guides

### BREAKING CHANGES

Please check out [7.0.0 migration guide](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/migration/7.0.0.md)

This release include all changes from [7.0.0-next.1](https://github.com/aeternity/aepp-sdk-js/releases/tag/7.0.0-next.1), [7.0.0-next.2](https://github.com/aeternity/aepp-sdk-js/releases/tag/7.0.0-next.2), [7.0.0-next.3](https://github.com/aeternity/aepp-sdk-js/releases/tag/7.0.0-next.3)

## [7.0.0-next.3](https://github.com/aeternity/aepp-sdk-js/compare/7.0.0-next.2...7.0.0-next.3) (2020-01-22)

### Features

* **aens:** implement aensExtendTtl function. Refactor aensUpdate ([#866](https://github.com/aeternity/aepp-sdk-js/issues/866)) ([72b073a](https://github.com/aeternity/aepp-sdk-js/commit/72b073a)), closes [#865](https://github.com/aeternity/aepp-sdk-js/issues/865)
> `aensUpdate` now accept array of pointers
> `aensUpdate` have new option `extendPointers=false` which retrieve pointers from the node and merge with provided
* **Build:** update node to `5.4.0` and compiler to `4.2.0`
* **Guide** Add guide for `AENS` usage

### BREAKING CHANGES

* **AENS:** Change AENS methods arguments
> Now all of AENS module methods accept `name` as a first argument instead of `nameId`

## [7.0.0-next.2](https://github.com/aeternity/aepp-sdk-js/compare/6.0.1...7.0.0-next.2) (2020-01-10)

### Bug Fixes

* **codecov:** Adjust codecov badge. Move @babel/runtime to dev-deps ([#848](https://github.com/aeternity/aepp-sdk-js/issues/848)) ([109b851](https://github.com/aeternity/aepp-sdk-js/commit/109b851))
* **AEX-2:** Fix `getBrowserAPI` function for firefox ([#853](https://github.com/aeternity/aepp-sdk-js/pull/853))

### Features

* **Account:** Add ability to pass `keypair` or `MemoryAccount` as nAccount` option ([#847](https://github.com/aeternity/aepp-sdk-js/issues/847)) ([75d8ad8](https://github.com/aeternity/aepp-sdk-js/commit/75d8ad8))
* **Test:** Increase code coverage ([#830](https://github.com/aeternity/aepp-sdk-js/issues/830)) ([6f760fb](https://github.com/aeternity/aepp-sdk-js/commit/6f760fb))
* **Chain:** Extend transaction verification error ([#849](https://github.com/aeternity/aepp-sdk-js/pull/849))
* **Aepp<->Wallet:** Add tests for Aepp<->Wallet communication ([#834](https://github.com/aeternity/aepp-sdk-js/pull/834))

### Documentation

* **Guide:** Add guide for Contract ACI usage ([#852](https://github.com/aeternity/aepp-sdk-js/pull/852))

## [7.0.0-next.1](https://github.com/aeternity/aepp-sdk-js/compare/6.1.3...7.0.0-next.1) (2019-12-18)

### Bug Fixes

* **Contract/Chain:** Using { waitMined: false } with Contract high lvl API ([#828](https://github.com/aeternity/aepp-sdk-js/issues/828)) ([475c2aa](https://github.com/aeternity/aepp-sdk-js/commit/475c2aa))
* **HdWallet:** Fix derive function ([#801](https://github.com/aeternity/aepp-sdk-js/issues/801)) ([6c6177d](https://github.com/aeternity/aepp-sdk-js/commit/6c6177d))
* **Compiler:** Filter compiler options

### Code Refactoring

* **Cross-Node:** Remove cross-node compatibility code ([#829](https://github.com/aeternity/aepp-sdk-js/issues/829)) ([b29a162](https://github.com/aeternity/aepp-sdk-js/commit/b29a162))
* **Chain:** Handle time until tx is not added to mempool ([#816](https://github.com/aeternity/aepp-sdk-js/pull/816))
* **Git:** Update issue template([#806](https://github.com/aeternity/aepp-sdk-js/pull/806))
* **Flavors:** Remove deprecated code ([#697](https://github.com/aeternity/aepp-sdk-js/pull/697))
* **Test:** Increase code covarage ([#830](https://github.com/aeternity/aepp-sdk-js/issues/830)) ([6f760fb](https://github.com/aeternity/aepp-sdk-js/commit/6f760fb))

### Features

* **Wallet<->AEPP:** Add new Wallet<->Aepp communication API
>Add two new stamps `RpcWallet` and `RpcAepp`
>Example of usage you can find heere: [Aepp example](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/how-to-build-aepp-using-new-wallet-api.md) and [Wallet example](https://github.com/aeternity/aepp-sdk-js/blob/develop/docs/guides/how-to-build-an-wallet-app-or-extension.md)

* **Wallet:** Use `postMessage` for communication with extension wall… ([#815](https://github.com/aeternity/aepp-sdk-js/issues/815)) ([dc7b4c2](https://github.com/aeternity/aepp-sdk-js/commit/dc7b4c2))
* **CI:** Move to Travis CI ([#809](https://github.com/aeternity/aepp-sdk-js/issues/809)) ([2d77f20](https://github.com/aeternity/aepp-sdk-js/commit/2d77f20))
* **CI:** enable daily builds on latest node and compiler and enable codecov ([#820](https://github.com/aeternity/aepp-sdk-js/issues/820)) ([3c52a1e](https://github.com/aeternity/aepp-sdk-js/commit/3c52a1e))
* **ACI:** Add check for contract address validity and existence. Add `forceCodeCheck` option for bytecode verification skip ([#788](https://github.com/aeternity/aepp-sdk-js/issues/788)) ([c0cccc9](https://github.com/aeternity/aepp-sdk-js/commit/c0cccc9))
* **Contract:** Add ability to pass arguments or callData for contract `deploy/call/callStatic` API ([#768](https://github.com/aeternity/aepp-sdk-js/issues/768)) ([a828076](https://github.com/aeternity/aepp-sdk-js/commit/a828076))
* **Contract:** Adjust `fee` calculation for `contractCall` tx using `FATE` backend ([#793](https://github.com/aeternity/aepp-sdk-js/issues/793)) ([7254ac1](https://github.com/aeternity/aepp-sdk-js/commit/7254ac1))
* **Compiler:** Add new API `validateByteCodeAPI` available on compiler >= 4.1.0 ([#788](https://github.com/aeternity/aepp-sdk-js/issues/788)) ([c0cccc9](https://github.com/aeternity/aepp-sdk-js/commit/c0cccc9))
* **Tx:** Always verify transaction before send it to the node ([#798](https://github.com/aeternity/aepp-sdk-js/issues/798)) ([170f479](https://github.com/aeternity/aepp-sdk-js/commit/170f479))

### BREAKING CHANGES

* **Tx:** By default `sdk` make a transaction `verification`
* **Node:** Change node compatibility range to `node >= 5.0.0 && node < 6.0.0`
* **Compiler:** Drop compiler version to `version >= 4.0.0 && version < 5.0.0`
* **ACI:** Add additional method to RPC communication. Required sdk update on wallet side
Add `getContractByteCode` API
* **Flavor:** Remove deprecated params:
- remove `url` and `internalUrl` instead use `nodes: [ { name: 'NODE_NAME', instance: await Node({ url, internalUrl }) } ]`
- remove `keypair` params instead use `accounts: [MemmoryAccount({ keypair })]`
- remove `setKeypair` function from `Account` stamps

## [6.1.3](https://github.com/aeternity/aepp-sdk-js/compare/6.1.2...6.1.3) (2019-12-11)

### Bug Fixes

* **Channel:** 5.2.0 compatibility ([4be8eb8](https://github.com/aeternity/aepp-sdk-js/commit/4be8eb8))

## [6.1.2](https://github.com/aeternity/aepp-sdk-js/compare/6.1.1...6.1.2) (2019-11-12)

### Bug Fixes

* **Composition:** Chain composition ([9ac705f](https://github.com/aeternity/aepp-sdk-js/commit/9ac705f))

## [6.1.1](https://github.com/aeternity/aepp-sdk-js/compare/6.1.0...6.1.1) (2019-11-12)

### Bug Fixes

* **ACI:** Disable bytecode check for source and code on-chain. This changes will be included in next major release ([#783](https://github.com/aeternity/aepp-sdk-js/issues/783)) ([fe6021b](https://github.com/aeternity/aepp-sdk-js/commit/fe6021b))

### Features

* **KeyStore:** Remove `argon2` package, use `libsodium` for both browser and node ([#782](https://github.com/aeternity/aepp-sdk-js/issues/782)) ([c18047e](https://github.com/aeternity/aepp-sdk-js/commit/c18047e))

## [6.1.0](https://github.com/aeternity/aepp-sdk-js/compare/6.0.2...6.1.0) (2019-11-11)

### Bug Fixes

* **AENS:** auction end block calculation ([#746](https://github.com/aeternity/aepp-sdk-js/issues/746)) ([4c1f5e4](https://github.com/aeternity/aepp-sdk-js/commit/4c1f5e4))
* **AENS:** Fix `produceNameId` function(Make name lowercase). Enable … ([#750](https://github.com/aeternity/aepp-sdk-js/issues/750)) ([fd14225](https://github.com/aeternity/aepp-sdk-js/commit/fd14225))
* **state channels:** wait for connection to be established before sending generic message ([#723](https://github.com/aeternity/aepp-sdk-js/issues/723)) ([c5f35d1](https://github.com/aeternity/aepp-sdk-js/commit/c5f35d1))
* **TxHelpers:** Use BigNumber in auction end block calculation ([777c012](https://github.com/aeternity/aepp-sdk-js/commit/777c012))

### Features

* **ACI:** Add validation for contractAddress ([#764](https://github.com/aeternity/aepp-sdk-js/issues/764)) ([07cb0e7](https://github.com/aeternity/aepp-sdk-js/commit/07cb0e7))
* **AENS:** Add nameFee validation to TxValidator ([#765](https://github.com/aeternity/aepp-sdk-js/issues/765)) ([5250e75](https://github.com/aeternity/aepp-sdk-js/commit/5250e75))
* **AENS:** Increase default nameTtl ([#775](https://github.com/aeternity/aepp-sdk-js/issues/775)) ([c5f2582](https://github.com/aeternity/aepp-sdk-js/commit/c5f2582))
* **Contract:** Add ability to pass arguments or callData for contract `deploy/call/callStatic` API ([#768](https://github.com/aeternity/aepp-sdk-js/issues/768)) ([12aaca3](https://github.com/aeternity/aepp-sdk-js/commit/12aaca3))
* **Http:** Assign error object to http error ([#770](https://github.com/aeternity/aepp-sdk-js/issues/770)) ([87062ea](https://github.com/aeternity/aepp-sdk-js/commit/87062ea))
* **state channels:** add round method ([#763](https://github.com/aeternity/aepp-sdk-js/issues/763)) ([c950937](https://github.com/aeternity/aepp-sdk-js/commit/c950937))
* **state channels:** allow off chain updates to be cancelled with custom error code ([#753](https://github.com/aeternity/aepp-sdk-js/issues/753)) ([ae4426e](https://github.com/aeternity/aepp-sdk-js/commit/ae4426e))
* **state channels:** allow to pass metadata to transfer update ([#755](https://github.com/aeternity/aepp-sdk-js/issues/755)) ([ddc6611](https://github.com/aeternity/aepp-sdk-js/commit/ddc6611))
* **state channels:** make state channels compatible with node v5.0.0… ([#688](https://github.com/aeternity/aepp-sdk-js/issues/688)) ([deed7fc](https://github.com/aeternity/aepp-sdk-js/commit/deed7fc)), closes [#632](https://github.com/aeternity/aepp-sdk-js/issues/632) [#653](https://github.com/aeternity/aepp-sdk-js/issues/653) [#658](https://github.com/aeternity/aepp-sdk-js/issues/658) [#660](https://github.com/aeternity/aepp-sdk-js/issues/660) [#680](https://github.com/aeternity/aepp-sdk-js/issues/680) [#693](https://github.com/aeternity/aepp-sdk-js/issues/693) [#687](https://github.com/aeternity/aepp-sdk-js/issues/687)
* **state channels:** make state channels compatible with node v5.1.0… ([#776](https://github.com/aeternity/aepp-sdk-js/issues/776)) ([74952aa](https://github.com/aeternity/aepp-sdk-js/commit/74952aa))

## [6.0.2](https://github.com/aeternity/aepp-sdk-js/compare/6.0.1...6.0.2) (2019-10-31)

### Bug Fixes

* **name claim:** Revert ignoring waitMined from user passed options (#727)

## [6.0.1](https://github.com/aeternity/aepp-sdk-js/compare/6.0.0...6.0.1) (2019-10-29)

### Bug Fixes

* **aens:** added lower case transformation for aens names ([#730](https://github.com/aeternity/aepp-sdk-js/issues/730)) ([f7f9f17](https://github.com/aeternity/aepp-sdk-js/commit/f7f9f17246c727566ce3c8159d30b7de19b027c9)), closes [#728](https://github.com/aeternity/aepp-sdk-js/issues/728)

## [6.0.0](https://github.com/aeternity/aepp-sdk-js/compare/4.7.0...6.0.0) (2019-10-16)

### Code Refactoring

* **SPEND:** Add additional validation for recipient ([#715](https://github.com/aeternity/aepp-sdk-js/issues/715)) ([c1854bf](https://github.com/aeternity/aepp-sdk-js/commit/c1854bf))

### Features

* **State Channels:** make state channels compatible with node v5.0.0… ([#688](https://github.com/aeternity/aepp-sdk-js/issues/688)) ([23936f5](https://github.com/aeternity/aepp-sdk-js/commit/23936f5)), closes [#632](https://github.com/aeternity/aepp-sdk-js/issues/632) [#653](https://github.com/aeternity/aepp-sdk-js/issues/653) [#658](https://github.com/aeternity/aepp-sdk-js/issues/658) [#660](https://github.com/aeternity/aepp-sdk-js/issues/660) [#680](https://github.com/aeternity/aepp-sdk-js/issues/680) [#693](https://github.com/aeternity/aepp-sdk-js/issues/693) [#687](https://github.com/aeternity/aepp-sdk-js/issues/687)
* **AENS:** Change tld for Lima from `aet` to `chain` ([#714](https://github.com/aeternity/aepp-sdk-js/issues/714)) ([323ef6a](https://github.com/aeternity/aepp-sdk-js/commit/323ef6a))
* **AENS:** Implement name `bid` function ([#706](https://github.com/aeternity/aepp-sdk-js/pull/706)))
* **AENS:** auction name fee calculation. Name fee validation and calculation in `claim/bid` ([#706](https://github.com/aeternity/aepp-sdk-js/pull/706))
* **AENS:** Add `nameId` computation function (#709) ([#706](https://github.com/aeternity/aepp-sdk-js/pull/706))

### BREAKING CHANGES

* **AENS:** Change `tld` for Lima from `.aet` to `.chain`

## [5.0.0](https://github.com/aeternity/aepp-sdk-js/compare/4.7.0...5.0.0) (2019-10-04)

### Bug Fixes

* **rpc:** fix resolution rpc ops ([#669](https://github.com/aeternity/aepp-sdk-js/issues/669)) ([abd7c56](https://github.com/aeternity/aepp-sdk-js/commit/abd7c56))

### Code Refactoring

* **ACI:** rework Sophia Option type representation ([#691](https://github.com/aeternity/aepp-sdk-js/issues/691)) ([0dbb2fe](https://github.com/aeternity/aepp-sdk-js/commit/0dbb2fe))

### Features

* **AENS:** Add ability to spend by name ([#682](https://github.com/aeternity/aepp-sdk-js/issues/682)) ([0d43804](https://github.com/aeternity/aepp-sdk-js/commit/0d43804))
* **AENS:** Add ability to claim contract, oracle, SC ([#671](https://github.com/aeternity/aepp-sdk-js/issues/671)) ([49fd0fd](https://github.com/aeternity/aepp-sdk-js/commit/49fd0fd))
* **GA:** enbale GA ([#692](https://github.com/aeternity/aepp-sdk-js/issues/692)) ([eded912](https://github.com/aeternity/aepp-sdk-js/commit/eded912))
* **Lima:** Lima compatibility ([#683](https://github.com/aeternity/aepp-sdk-js/issues/683)) ([a88042e](https://github.com/aeternity/aepp-sdk-js/commit/a88042e)), closes [#632](https://github.com/aeternity/aepp-sdk-js/issues/632) [#653](https://github.com/aeternity/aepp-sdk-js/issues/653) [#658](https://github.com/aeternity/aepp-sdk-js/issues/658) [#660](https://github.com/aeternity/aepp-sdk-js/issues/660) [#680](https://github.com/aeternity/aepp-sdk-js/issues/680) [#693](https://github.com/aeternity/aepp-sdk-js/issues/693) [#687](https://github.com/aeternity/aepp-sdk-js/issues/687)
    - AENS auction support
    - compiler 4.0.0 support
    - node 5.0.0 support
    - SDK use `FATE` for contract by default
* **AE**: Add pointers verification for spend by name

### BREAKING CHANGES

* **aci:** Change Sophia option type representation in ACI
```js
// from
await contract.methods.optionFn(Promise.resolve(1) || Promise.reject())
// to
await contract.methods.optionFn(1 || undefined)
```

## [5.0.0-next.1](https://github.com/aeternity/aepp-sdk-js/compare/4.6.0...4.7.0-next.1) (2019-09-10)

### Bug Fixes

* **package:** update serialize-javascript to version 2.0.0 ([#647](https://github.com/aeternity/aepp-sdk-js/issues/647)) ([1ddb392](https://github.com/aeternity/aepp-sdk-js/commit/1ddb392))

### Features

* **Contract/ACI** Add `payable` feature
* **Compiler:** Compiler 4.0.0 compatibility ([#632](https://github.com/aeternity/aepp-sdk-js/issues/632)) ([d5f1632](https://github.com/aeternity/aepp-sdk-js/commit/d5f1632))
* **Contract/ACI:** Add ability to use contract with external namespaces(`include "someLib"`) ([#653](https://github.com/aeternity/aepp-sdk-js/issues/653)) ([9708b43](https://github.com/aeternity/aepp-sdk-js/commit/9708b43))

## [4.7.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...4.7.0) (2019-09-11)

### Features

* **Oracle:** Add methods for polling queries [#637](https://github.com/aeternity/aepp-sdk-js/pull/637)
* **Chain:** Add `getBalance` method ([#655](https://github.com/aeternity/aepp-sdk-js/issues/655)) ([15147af](https://github.com/aeternity/aepp-sdk-js/commit/15147af))
* **state channels:** add reconnect method ([#662](https://github.com/aeternity/aepp-sdk-js/issues/662)) ([9d8d1e8](https://github.com/aeternity/aepp-sdk-js/commit/9d8d1e8))
* **state channels:** add backchannel updates test[#664](https://github.com/aeternity/aepp-sdk-js/pull/664)

## [4.6.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...4.6.0) (2019-08-28)

### Bug Fixes

* **Compiler:** Fix `forceCompatibility` option ([26beba8](https://github.com/aeternity/aepp-sdk-js/commit/26beba8))

### Features

* **Lima**: add preliminary support for lima
* **ACI/Contract:** Implement static-call for deploy transaction for ACI methods/Contract low lvl API ([#630](https://github.com/aeternity/aepp-sdk-js/issues/630)) ([5b7eeb4](https://github.com/aeternity/aepp-sdk-js/commit/5b7eeb4))

### Notes

**GA support has been disabled until further notice due to node compatibility issues**
**This version support aeternity node up to 5.0.0-rc.1**

## [4.5.1](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...4.5.1) (2019-08-22)

### Refactor
* **Example**  Add node info to AEPP ([#620](https://github.com/aeternity/aepp-sdk-js/pull/620))

### Bug Fixes

* **GA** Fix GA account composition ([211e409](https://github.com/aeternity/aepp-sdk-js/pull/620/commits/211e409d785a2962d1220677b0b0bcf00196abc1))

## [4.5.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...4.5.0) (2019-08-20)


### Bug Fixes

* **Crypto:** Fix `keypair` verification ([#605](https://github.com/aeternity/aepp-sdk-js/issues/605)) ([83a52fb](https://github.com/aeternity/aepp-sdk-js/commit/83a52fb))
* **RPC:** Remove NodePool stamp from AE composition ([#612](https://github.com/aeternity/aepp-sdk-js/issues/612)) ([21af2eb](https://github.com/aeternity/aepp-sdk-js/commit/21af2eb))
* **state channels:** add missing argument in onOnChainTx callback ([#604](https://github.com/aeternity/aepp-sdk-js/issues/604)) ([165cfe8](https://github.com/aeternity/aepp-sdk-js/commit/165cfe8))
* **state channels:** fix awaitingOnChainTx state handler ([#608](https://github.com/aeternity/aepp-sdk-js/issues/608)) ([8b7b65a](https://github.com/aeternity/aepp-sdk-js/commit/8b7b65a))
* **Swagger:** Always throw error from `axios` error handler ([#607](https://github.com/aeternity/aepp-sdk-js/issues/607)) ([0e5cf61](https://github.com/aeternity/aepp-sdk-js/commit/0e5cf61))

### Features

* **MemoryAccount:** Add validation of keypair ([#594](https://github.com/aeternity/aepp-sdk-js/issues/594)) ([b8c2b20](https://github.com/aeternity/aepp-sdk-js/commit/b8c2b20))
* **state channels:** handle BigNumbers with json-bigint ([#596](https://github.com/aeternity/aepp-sdk-js/issues/596)) ([14eaa3d](https://github.com/aeternity/aepp-sdk-js/commit/14eaa3d))
* **state channels:** send generic messages immediately ([#600](https://github.com/aeternity/aepp-sdk-js/issues/600)) ([8ad7583](https://github.com/aeternity/aepp-sdk-js/commit/8ad7583))
* **Generalize Account**  Implement Generalized account support ([#449](https://github.com/aeternity/aepp-sdk-js/pull/449))
    ```js
    const authContract = `YOUR_AUTH_CONTRACT`

    // Make current account Generalized
    await client.createGeneralizeAccount(authFnName, authContract, [...authFnArguments]

    // Make spend transaction using GA
    // One Way
        // encoded call data for auth contract
        const callData = 'cb_...'
        await client.spend(10000, receiverPub, { authData: { callData } })

    // or
        // sdk will prepare callData itself
        await client.spend(10000, receiverPub, { authData: { source: authContract, args: [...authContractArgs] } })
    ```

## [4.4.0](https://github.com/aeternity/aepp-sdk-js/compare/4.3.0...4.4.0) (2019-08-09)

### Bug Fixes

* **Package:** update commander to version 3.0.0 ([#597](https://github.com/aeternity/aepp-sdk-js/issues/597)) ([9aaa05c](https://github.com/aeternity/aepp-sdk-js/commit/9aaa05c))
* **Contract:** Fix dry-run without account ([227fc5c](https://github.com/aeternity/aepp-sdk-js/pull/599/commits/227fc5c9d8369e1c3a3fbba2cf62f0495bcf08ae))

### Features

* **Contract:** add ability to use call-static/dry-run without keyPair ([#577](https://github.com/aeternity/aepp-sdk-js/issues/577)) ([c38edd9](https://github.com/aeternity/aepp-sdk-js/commit/c38edd9))
* **AE:** Add ability to make operation on specific account using `onAccount` option.
   ```
    Exm: await client.spend(1, receiver, { onAccount: 'PUBLIC_KEY' })
    Add `onAccount` to `AENS`, `Contract`, `Oracle`.
    Add tests for using specific account to Contract, ACI, Account.
  ```
* **JSON:**: Add serialization to JSON for bigNumbers
* **MemoryAccount:** Add validation of `keypair`  ([#594](https://github.com/aeternity/aepp-sdk-js/issues/594)) ([b8c2b20](https://github.com/aeternity/aepp-sdk-js/commit/b8c2b20))
* **State Channels:** persist connection by pinging every 10 seconds ([#571](https://github.com/aeternity/aepp-sdk-js/issues/571)) ([a70f919](https://github.com/aeternity/aepp-sdk-js/commit/a70f919))

## [4.3.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...4.3.0) (2019-08-05)

### Bug Fixes

* **State Channels:** Fix onChainTx event params ([#566](https://github.com/aeternity/aepp-sdk-js/issues/566)) ([11c85eb](https://github.com/aeternity/aepp-sdk-js/commit/11c85eb))
* **State Channels:** Fix websocket url ([#558](https://github.com/aeternity/aepp-sdk-js/issues/558)) ([33c1fd8](https://github.com/aeternity/aepp-sdk-js/commit/33c1fd8))
* **Swagger:** Pass query params in case of get request ([#570](https://github.com/aeternity/aepp-sdk-js/pull/570))

### Code Refactoring

* **State Channel:** Do not include white space for outgoing websocket messages ([#559](https://github.com/aeternity/aepp-sdk-js/pull/559))

### Features

* **ACI:** Implement sophia `variant` type ([#567](https://github.com/aeternity/aepp-sdk-js/issues/567)) ([8505dcf](https://github.com/aeternity/aepp-sdk-js/commit/8505dcf))
* **Contract:** add ability to use call-static/dry-run without keyPair ([#577](https://github.com/aeternity/aepp-sdk-js/issues/577)) ([c38edd9](https://github.com/aeternity/aepp-sdk-js/commit/c38edd9))
* **NodePool:** Implement NodePool stamp ([#574](https://github.com/aeternity/aepp-sdk-js/issues/574)) ([674166c](https://github.com/aeternity/aepp-sdk-js/commit/674166c))
* **State Channel:** make state channel compatible with aeternity@4.0.0 ([#568](https://github.com/aeternity/aepp-sdk-js/issues/568)) ([0d0e09b](https://github.com/aeternity/aepp-sdk-js/commit/0d0e09b))
* **TxBuilder:** Add helper for producing tx hash ([#579](https://github.com/aeternity/aepp-sdk-js/issues/579)) ([e1b405e](https://github.com/aeternity/aepp-sdk-js/commit/e1b405e))
* **AE** Make all AE stamps composed with Accounts ([#581](https://github.com/aeternity/aepp-sdk-js/pull/581))

### Docs

* **ACI** Add some additional clarification to `getContractInstance`

## [4.2.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...4.2.0) (2019-07-15)

### Bug Fixes

* **package:** update libsodium-wrappers-sumo to version 0.7.5 ([#541](https://github.com/aeternity/aepp-sdk-js/issues/541)) ([956ed75](https://github.com/aeternity/aepp-sdk-js/commit/956ed75))
* **rpc-server:** Fix type 'object' check ([#526](https://github.com/aeternity/aepp-sdk-js/issues/526)) ([48c42e4](https://github.com/aeternity/aepp-sdk-js/commit/48c42e4))

### Code Refactoring

* **swagger:** Speedup initialisation
* **AENS:** Remove unused param from claim method
* **AENS:** Fix exception if not waiting for mining(claim)
* **Test:** Add test for contract namespaces

### Features

* **Node:** Add 4.0.0 node compatibility
* **Compiler:** Add compatibility with compiler 3.2.0
* **Channel:** Implement GA awareness of State Channels

## [4.1.0](https://github.com/aeternity/aepp-sdk-js/compare/4.0.1...4.1.0) (2019-06-22)

### Bug Fixes

* **Node:** Do not throw error if `internalUrl` not provided. Instead use `url` ([#503](https://github.com/aeternity/aepp-sdk-js/issues/503)) ([053faae](https://github.com/aeternity/aepp-sdk-js/commit/053faae))
* **TXBuilder:** Fix payload serialization if you try to unpack and pack tx. ([#498](https://github.com/aeternity/aepp-sdk-js/issues/498)) ([73552e5](https://github.com/aeternity/aepp-sdk-js/commit/73552e5))
* **TxValidator:** Fix validation of state channel open transaction ([#496](https://github.com/aeternity/aepp-sdk-js/issues/496)) ([325cc90](https://github.com/aeternity/aepp-sdk-js/commit/325cc90))

### Features

* **ACI:** Refactor ACI module. Split to separated files. ([#505](https://github.com/aeternity/aepp-sdk-js/issues/505)) ([fb7bc00](https://github.com/aeternity/aepp-sdk-js/commit/fb7bc00))
* **Selector:** If default account `address` not provided use the first
* **ACI:** Handle ACI without init function
* **ACI:** Automatically decide to send transaction on-chai or call-static.
Add `options` object like last arguments of generate fn under `instance.methods`
  ```
  const instance = await client.getContractInstance(source)
  // Deploy contract
  await.contract.init(100, 'test', options)
  //or
  await.contract.deploy([100, 'test'], options)
  // Call function
  const result = await instance.call('sum', [2, 5], options)
  //
    // Automatically decide to send tx on-chain or call-static(dry-run) base on if function stateful or not
    const result = await instance.methods.sum(2, 5, options)
    // Manually make on-chain
    const result = await instance.methods.sum.send(2, 5, options)
    // Manually make call-static
    const result = await instance.methods.sum.get(2, 5, options)
  //
  ```

### Docs

* **Usage:**: Add instructions about how to include directly the `SDK` in a `html page`

## [4.0.1](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...4.0.1) (2019-06-13)

### Bug Fixes

* **RPC:** Add contract contractDecodeCallResultAPI to RPC ([#482](https://github.com/aeternity/aepp-sdk-js/issues/482)) ([7eb6bd8](https://github.com/aeternity/aepp-sdk-js/commit/7eb6bd8))
* **README:** Fix flavor link ([#480](https://github.com/aeternity/aepp-sdk-js/pull/480))

### Code Refactoring

* **Compiler:** Fix compiler compatibility mechanism ([#479](https://github.com/aeternity/aepp-sdk-js/issues/479)) ([78cc990](https://github.com/aeternity/aepp-sdk-js/commit/78cc990))
* **Utils:** Move json-bigint implementation to `utils` ([#486](https://github.com/aeternity/aepp-sdk-js/issues/486)) ([1538867](https://github.com/aeternity/aepp-sdk-js/commit/1538867))

### Build

* **webpack:** Add another bundle(`dist/aepp-sdk.browser-script.js`) for using in `<script>` tag ([#485](https://github.com/aeternity/aepp-sdk-js/pull/485))

## [4.0.0](https://github.com/aeternity/aepp-sdk-js/compare/3.4.1...4.0.0) (2019-06-12)

### Bug Fixes

* **Ae:** Fix exception when it used without Contract stamp

### Code Refactoring

* **SCM:** Update compatibility range for node: 3.0.1 - 4 and compiler 3.1.0 - 4 ([#474](https://github.com/aeternity/aepp-sdk-js/issues/474)) ([a1494fd](https://github.com/aeternity/aepp-sdk-js/commit/a1494fd))
* **Test:** Simplify client creation

### Features

* **Docs** chore(Docs): new docs ([#370](https://github.com/aeternity/aepp-sdk-js/pull/370))
* **Compiler:** Add `getCompilerVersion` to compiler stamp
* **ACI:** Make compatible with compiler 3.1.0 ([#457](https://github.com/aeternity/aepp-sdk-js/issues/457)) ([d92f2c7](https://github.com/aeternity/aepp-sdk-js/commit/d92f2c7)), closes [#458](https://github.com/aeternity/aepp-sdk-js/issues/458)
* **ACI:** Generate JS function proto for each of contract function ([#439](https://github.com/aeternity/aepp-sdk-js/issues/439)) ([2f47b4d](https://github.com/aeternity/aepp-sdk-js/commit/2f47b4d))
* **Compiler/ACI:** Make ACI compatible with compiler 3.0.0 ([#441](https://github.com/aeternity/aepp-sdk-js/issues/441)) ([2a8eb1a](https://github.com/aeternity/aepp-sdk-js/commit/2a8eb1a))
* **Node:** Avoid usage of "universal-url" package ([#434](https://github.com/aeternity/aepp-sdk-js/issues/434)) ([a8268d5](https://github.com/aeternity/aepp-sdk-js/commit/a8268d5))
* **TX:** encode payload as base64 ([#460](https://github.com/aeternity/aepp-sdk-js/issues/460)) ([ad490af](https://github.com/aeternity/aepp-sdk-js/commit/ad490af))
* **TX_BUILDER:** Fix bug related to contract fee calculation. ([#472](https://github.com/aeternity/aepp-sdk-js/issues/472)) ([7214cfb](https://github.com/aeternity/aepp-sdk-js/commit/7214cfb))

### BREAKING CHANGES

* **DOCS** Restructure and rework sdk documentation
* **SCM:** This change will make the release not compatible with older version of the node and
compiler
* **ACI:** Change Contract low lvl API:
  - change `contractDecodeData` interface from:
    - `(type:String, data: String) => Any` to `(source: String, fn: String, callValue: String, callResult:String) => Any`.
    (`callResult` is `callType` from call result, can be `ok`, `revert`, ...)

## [3.4.1](https://github.com/aeternity/aepp-sdk-js/compare/3.4.0...3.4.1) (2019-06-05)

### Bug Fixes

* **Deps:** Update axios lib to 0.19.0 due to security issue ([f951765](https://github.com/aeternity/aepp-sdk-js/commit/f951765))

## [3.4.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...3.4.0) (2019-05-22)

### Bug Fixes

* **State Channels:** Remove automatic pinging to fix browser compatibility ([#432](https://github.com/aeternity/aepp-sdk-js/issues/432)) ([0700f3a](https://github.com/aeternity/aepp-sdk-js/commit/0700f3a))

### Features

* **Transaction Builder:** Improve min fee calculation(Reduce the fee) ([#424](https://github.com/aeternity/aepp-sdk-js/pull/424))
* **AXIOS:** Add ability to intercept error from axios ([#431](https://github.com/aeternity/aepp-sdk-js/pull/431))
  > Added additional param to sdk initialization `axiosConfig`

  > Example: `Universal({ axiosConfig: { config: { // axios config object }, errorHandler: (err) => throw err }})`
* **Transaction Builder:** Implement vm/abi validation for contract/oracle tx based on consensus protocol version. Add custom verification based on transaction type ([#425](https://github.com/aeternity/aepp-sdk-js/pull/425)) ([#426](https://github.com/aeternity/aepp-sdk-js/pull/426))

## [3.3.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...3.3.0) (2019-05-17)

### Bug Fixes

* **AEP exampe:** Fix contract in AEPP example ([e2fec19](https://github.com/aeternity/aepp-sdk-js/commit/e2fec19))
fix(AEP exampe): Fix contract in AEPP example

### Features

* **Consensus:** Add function to get consensus version.  ([#413](https://github.com/aeternity/aepp-sdk-js/issues/413)) ([46027cd](https://github.com/aeternity/aepp-sdk-js/commit/46027cd))
* **State Channels:** Make state channels compatible with aeternity 3.0.0 ([#415](https://github.com/aeternity/aepp-sdk-js/issues/415)) ([668e7f1](https://github.com/aeternity/aepp-sdk-js/commit/668e7f1))
* **Transaction Builder:** Add serializations for transactions introd… ([#416](https://github.com/aeternity/aepp-sdk-js/issues/416)) ([fd7b8ce](https://github.com/aeternity/aepp-sdk-js/commit/fd7b8ce))

### BREAKING CHANGES

* **NODE** Change compatibility from `2.3.0` to `3.0.0`

## [3.2.1](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...3.2.1) (2019-05-16)

### Bug Fixes

* **Joi:** Add `JOI` browser comparability

## [3.2.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...3.2.0) (2019-05-16)

### Bug Fixes

* **ACI:** Add ability to pass zero address as number. ([#396](https://github.com/aeternity/aepp-sdk-js/issues/396)) ([b5b5c61](https://github.com/aeternity/aepp-sdk-js/commit/b5b5c61))
* **ACI:** Fix address type transformation when decoding data ([#335](https://github.com/aeternity/aepp-sdk-js/issues/335)) ([e37cdfc](https://github.com/aeternity/aepp-sdk-js/commit/e37cdfc))
* **Contract:** Add error handling(decoding) in low lvl contract API ([#386](https://github.com/aeternity/aepp-sdk-js/issues/386)) ([e1fdce0](https://github.com/aeternity/aepp-sdk-js/commit/e1fdce0))
* **Dependencies:** Use URL class instead of "url" package
* **Dependencies:** Use custom version of json-bigint
* **Dependencies:** Avoid usage of semver package and cleanup deps
* **RPC:** rpc client: Handle case if aepp opened without wallet
* **Channels:** Fix state channel test's

### Features

* **KEYSTORE:** Add browser compatibility
* **TX:** Handle VM/ABI fields serialization and validation basaed on tx type and node version
* **ACI:** Add `contract`, `address`, `record` types argument/result transformation ([#349](https://github.com/aeternity/aepp-sdk-js/issues/349)) ([0599d7d](https://github.com/aeternity/aepp-sdk-js/commit/0599d7d))
* **WEBPACK:** webpack configs: Mark all dependencies as external
* **WEBPACK:** Setup webpack-bundle-analyzer plugin
* **ACI:** Add `Option` sophia type to ACI ([#390](https://github.com/aeternity/aepp-sdk-js/issues/390)) ([83f5279](https://github.com/aeternity/aepp-sdk-js/commit/83f5279))
* **ACI:** Implement arguments validation for generic sophia types(list, map, tuple, record) ([#384](https://github.com/aeternity/aepp-sdk-js/issues/384)) ([956e59e](https://github.com/aeternity/aepp-sdk-js/commit/956e59e))
* **ACI:** Update due to compiler API changes ([#331](https://github.com/aeternity/aepp-sdk-js/issues/331)) ([e047f3b](https://github.com/aeternity/aepp-sdk-js/commit/e047f3b))
* **AE:** Allow to spend % of balance. ([#371](https://github.com/aeternity/aepp-sdk-js/issues/371)) ([f97a2ae](https://github.com/aeternity/aepp-sdk-js/commit/f97a2ae)), closes [#336](https://github.com/aeternity/aepp-sdk-js/issues/336)
* **Aepp:** Add Compiler to Aepp rpc methods. Update example app ([#312](https://github.com/aeternity/aepp-sdk-js/issues/312)) ([9c72521](https://github.com/aeternity/aepp-sdk-js/commit/9c72521))
* **Aepp:** Refactor Aepp example app. Allow to spend with payload and add reverse iframe approach.
* **Compiler:** Add decode CallData by source/bytecode ([#354](https://github.com/aeternity/aepp-sdk-js/issues/354)) ([761f36b](https://github.com/aeternity/aepp-sdk-js/commit/761f36b))
* **Fortuna:** Node 3.0.0 compatibility ([#397](https://github.com/aeternity/aepp-sdk-js/issues/397)) ([17b78d5](https://github.com/aeternity/aepp-sdk-js/commit/17b78d5))
* **RPC:** Add `getNodeInfo` to AEPP stamp through RPC ([#359](https://github.com/aeternity/aepp-sdk-js/issues/359)) ([2ddeea8](https://github.com/aeternity/aepp-sdk-js/commit/2ddeea8))
* **State Channels:** Add cleanContractCalls method ([#338](https://github.com/aeternity/aepp-sdk-js/issues/338)) ([778159a](https://github.com/aeternity/aepp-sdk-js/commit/778159a))
* **State Channels:** Ping every 10 seconds to persist connection ([#324](https://github.com/aeternity/aepp-sdk-js/issues/324)) ([6d0e156](https://github.com/aeternity/aepp-sdk-js/commit/6d0e156)), closes [#276](https://github.com/aeternity/aepp-sdk-js/issues/276) [#299](https://github.com/aeternity/aepp-sdk-js/issues/299) [#300](https://github.com/aeternity/aepp-sdk-js/issues/300) [#303](https://github.com/aeternity/aepp-sdk-js/issues/303) [#302](https://github.com/aeternity/aepp-sdk-js/issues/302) [#279](https://github.com/aeternity/aepp-sdk-js/issues/279) [#275](https://github.com/aeternity/aepp-sdk-js/issues/275) [#276](https://github.com/aeternity/aepp-sdk-js/issues/276) [#299](https://github.com/aeternity/aepp-sdk-js/issues/299) [#300](https://github.com/aeternity/aepp-sdk-js/issues/300)
* **State Channels:** Remove endpoint param ([#391](https://github.com/aeternity/aepp-sdk-js/issues/391)) ([8d9ea7e](https://github.com/aeternity/aepp-sdk-js/commit/8d9ea7e))

### BREAKING CHANGES

* **State Channels:** Endpoint param is removed and no longer defaults to "/channel". This means that
"/channel" (or other path) must be appendend to url para

## [3.1.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...3.1.0) (2019-04-24)

### Bug Fixes

* **ACI:** Fix address type transformation when decoding data ([#335](https://github.com/aeternity/aepp-sdk-js/issues/335)) ([e37cdfc](https://github.com/aeternity/aepp-sdk-js/commit/e37cdfc))

### Features

* **ACI:** Add `contract`, `address`, `record` types argument/result transformation ([#349](https://github.com/aeternity/aepp-sdk-js/issues/349)) ([0599d7d](https://github.com/aeternity/aepp-sdk-js/commit/0599d7d))
* **ACI:** Update due to compiler API changes ([#331](https://github.com/aeternity/aepp-sdk-js/issues/331)) ([e047f3b](https://github.com/aeternity/aepp-sdk-js/commit/e047f3b))
* **Aepp:** Add Compiler to Aepp rpc methods. Update example app ([#312](https://github.com/aeternity/aepp-sdk-js/issues/312)) ([9c72521](https://github.com/aeternity/aepp-sdk-js/commit/9c72521))
* **Compiler:** Add decode CallData by source/bytecode ([#354](https://github.com/aeternity/aepp-sdk-js/issues/354)) ([761f36b](https://github.com/aeternity/aepp-sdk-js/commit/761f36b))
* **RPC:** Add getNodeInfo and getNetworkId to AEPP stamp through RPC ([#359](https://github.com/aeternity/aepp-sdk-js/issues/359)) ([2ddeea8](https://github.com/aeternity/aepp-sdk-js/commit/2ddeea8))
* **State Channels:** Add cleanContractCalls method ([#338](https://github.com/aeternity/aepp-sdk-js/issues/338)) ([778159a](https://github.com/aeternity/aepp-sdk-js/commit/778159a))
* **State Channels:** Ping every 10 seconds to persist connection ([#324](https://github.com/aeternity/aepp-sdk-js/issues/324)) ([6d0e156](https://github.com/aeternity/aepp-sdk-js/commit/6d0e156))

## [3.0.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...3.0.0) (2019-04-17)

### Bug Fixes

* **ACI:** Fix address type transformation when decoding data ([#335](https://github.com/aeternity/aepp-sdk-js/issues/335)) ([e37cdfc](https://github.com/aeternity/aepp-sdk-js/commit/e37cdfc))

### Features

* **TX_BUILDER:** Channel tx serializations
* **TxValidator:** Add minGasPrice validation to contract transactions
* **ACI:** Update due to compiler API changes ([#331](https://github.com/aeternity/aepp-sdk-js/issues/331)) ([e047f3b](https://github.com/aeternity/aepp-sdk-js/commit/e047f3b))
* **Aepp:** Add Compiler to Aepp rpc methods. Update example app ([#312](https://github.com/aeternity/aepp-sdk-js/issues/312)) ([9c72521](https://github.com/aeternity/aepp-sdk-js/commit/9c72521))
* **State Channels:** Add cleanContractCalls method ([#338](https://github.com/aeternity/aepp-sdk-js/issues/338)) ([778159a](https://github.com/aeternity/aepp-sdk-js/commit/778159a))

### BREAKING CHANGES

* **ACI** Remove 2.0.0 compiler compatibility

## [2.4.1](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...2.4.1) (2019-04-17)

### Features

* **ACI:** Add transform decoded data for 'address' type
* **AEPP:** Add Compiler to Aepp rpc methods. Update example app
* **Channel:** Add call contract static support
* **Channel:** Add get contract state support
* **Channel:** Get full channel state support
* **DOCS:** Adjust ACI, Contract and Usage

### Bug Fixes

* **HTTP:** Handle no response in http stamp error handler
* **Crypto:** Fix crypto `formatAddress`
* **Crypto:** Move ADDRESS_FORMAT to crypto

### BREAKING CHANGES

* **Channels:**
  - `channel.state()` now returns offchain state instead of last co-signed offchain transaction
  - `channel.update(...).state` has been renamed to `signedTx`
  - `channel.withdraw(...).state` has been renamed to `signedTx`
  - `channel.deposit(...).state` has been renamed to `signedTx`
  - `channel.leave().state` has been renamed to `signedTx`
  - `channel.createContract(...).state` has been renamed to `signedTx`
  - `channel.callContract(...).state` has been renamed to `signedTx`

## [2.4.0](https://github.com/aeternity/aepp-sdk-js/compare/2.3.2...2.4.0) (2019-04-17)

### Features

* **Chore:** Install and configure `commitizen`
* **Crypto:** Add `formatAddress` function to `Crypto`
* **Contract:** Add Contract Compiler API stamp to `es/contract` (now using instead contract node API)
* **Utils:** Add basic `http` client stamp (`es/utils/http`)
* **Contract:** ACI stamp (New Contract interface base on contract ACI schema)
    ```
    const contractIns = await client.getContractInstance(contractSourceCode)
    console.log(contract)
     {
       interface: String, // Contract interface source code
       aci: String, // Contract interface json schema
       source: String, // Contract source code
       compiled: String, // Compiled contract code
       deployInfo: { address: contractAddress } // Object with deploy transaction,
       // Function
       compile: () => this, // Compile contract,
       deploy: (init = [], options = { skipArgsConvert: false }) => this, // Deploy contract (compile before if needed)
       call: (fn, params = [], options = { skipArgsConvert: false, skipTransformDecoded: false, callStatic: false } => CallRersult: Object // Call contract function
     }
    ```
* **Account:** Extend  `Account.address()` with `accountFormatter` now you can do
    ```
    export const ADDRESS_FORMAT = {
      sophia: 1, // return address like `0xHEX_ADDRESS`
      api: 2, // return address like `ak_9LJ8ne9tks78hTD2Tp571f7w2MJmzQMRsiZxKCkMA2d2Sbrc4`
    }

    //

    export { ADDRESS_FORMAT } from 'es/account'
    await account.address(format: ADDRESS_FORMAT) // default ADDRESS_FORMAT.api
    ```
* **Channel:** Improve channel rpc usage
* **Channel:** Improve channel tests and error handling
* **Channel:** Improve state channel params handling
* **Chain:** Add ability to get `account/balance` on specific block `hash/height`
* **Universal:** Add `{ compilerUrl }` to `Universal, Contract, Wallet` stamp initialization

### Bug Fixes

* **Contract:** decode node error coming from contract `call` and `callStatic`
* **Chain:** Throw native error instead of object in chain `chain.sendTransaction`
* **Crypto:** fix arguments parsing in `Crypto.sing`
* **Crypto:** Fix `name hash` function arguments parsing in `Crypto`

### BREAKING CHANGES

 * **Contract:** Remove `ContractNodeAPI` stamp
 * **Contract:** Change Contract stamp API
    ```
    1) Use Compiler instead of node API for encode/decode call-data and compile.
    2) Change Contract interface:
     - contractCallStatic (address, abi = 'sophia-address', name, { top, args = '()', call, options = {} } = {}) -> (source, address, name, args = [], { top, options = {} } = {}))
     - contractCall (code, abi, address, name, { args = '()', options = {}, call } = {}) -> (source, address, name, args = [], options = {})
     - contractDeploy (code, abi, { initState = '()', options = {} } = {}) -> (code, source, initState = [], options = {})
     - contractEncodeCall (code, abi, name, args, call) -> (source, name, args) // 'source' is -> Contract source code or ACI interface source
    ```

## [2.3.2](https://github.com/aeternity/aepp-sdk-js/compare/2.3.1...2.3.2) (2019-03-04)

### Features

* **Contract:** Change default `gasPrice` from `1e6` to `1e9z
* **AEPP:** Fix `AEPP` example app
* **Build:** Force `image` pull before `builds`

## [2.3.1](https://github.com/aeternity/aepp-sdk-js/compare/2.3.0...2.3.1) (2019-02-22)

### Features

* **Oracle:** `Oracle` fee calculation
* **Tx:** `getAccountNonce` function to `tx` stamp
* **TX_BUILDER:** Change `FEE_BYTE_SIZE` from 1 to 8 bytes in `fee` calculation
* **TX_BUILDER:** Improve error handling in `tx` builder

## [2.3.0](https://github.com/aeternity/aepp-sdk-js/compare/2.3.0-next...2.3.0) (2019-02-22)

### Features

* **Node:** `Minerva` comparability
* **Utils:** `Mnemonic` wallet implementation `es/utils/hd-wallet`
* **Oracle:** Change Channel `legacy` API to `JSON RPC`
* **Oracle:** Change default `gasPrice` to `1e6`
* **Oracle:** Change `minFee` calculation, multiply min fee by `1e9`

### BREAKING CHANGES

* **Node:** Change supported node version range to `1.4.0 <= version < 3.0.0`
* This release contain changes from: [2.3.0-next](https://github.com/aeternity/aepp-sdk-js/releases/tag/2.3.0-next), [2.2.1-next](https://github.com/aeternity/aepp-sdk-js/releases/tag/2.2.1-next), [2.1.1-0.1.0-next](https://github.com/aeternity/aepp-sdk-js/releases/tag/2.1.1-0.1.0-next), [2.1.0](https://github.com/aeternity/aepp-sdk-js/releases/tag/2.1.0)

## [2.3.0-next](https://github.com/aeternity/aepp-sdk-js/compare/2.2.1-next...2.3.0-next) (2019-02-21)

### Features

* **Channel:** `channel` `withdraw` and `deposit` methods
* **TX_BUILDER:** Change default `gasPrice` in `Contract` stamp and `Tx` stamp to `1e9`
* **TX:** Fix `contract` tx `fee` calculation
* **Chain:** Refactor error handling in `sendTransaction` function
* **Contract:** Change default `gasPrice` to `1e9`
* **TX_BUILDER:** Change `Fee` byte_size to 1

## [2.2.1-next](https://github.com/aeternity/aepp-sdk-js/compare/2.1.1-0.1.0-next...2.2.1-next) (2019-02-21)

### Feature

* **TX_BUILDER:** Add `deserialization` schema for `Channel` transactions(`channelCreate`, `channelCloseMutual`, `channelDeposit`, `channelWithdraw`, `channelSettle`)
* **Chain:** Add `rawTx` and `verifyTx` to error from poll function(when you wait for transaction will mined)
* **Chore:** Depend on `bip39` from npm instead of git repo
* **Channel:** Change Channel `legacy` API to `JSON RPC`
* **TX_BUILDER:** Change `minFee` calculation, multiply min fee by 10^9

## [2.1.1-0.1.0-next](https://github.com/aeternity/aepp-sdk-js/compare/2.1.0...2.1.1-0.1.0-next) (2019-02-21)

### Bug Fixes
* **Chore:** Fix linter errors

## [2.1.0](https://github.com/aeternity/aepp-sdk-js/compare/2.0.0...2.1.0) (2019-02-21)

### Features

* **Node:** `Minerva` comparability
* **Utils:** Add `Mnemonic` wallet implementation `es/utils/hd-wallet`

### BREAKING CHANGES

* **Node:** Change supported node version range to `1.4.0 <= version < 3.0.0`

## [2.0.0](https://github.com/aeternity/aepp-sdk-js/compare/1.3.2...2.0.0) (2019-02-21)

### Features

* **TX_BUILDER:** Add `unpackedTx`, `txType` and `signature` to `validate` transaction function
* **Contract:** Add `top` param to contract `static call(dry-run)`
* **Contract:** Add errors handling for `dry-run`
* **Docs:** Add `keystore` docs
* **Ae:** Add `verify` options to `send` function which verify tx before broadcasting and throw error if tx is invalid
* **Rpc:** Add `dryRun` to `RPC` methods
* **Rpc:** Add `Oracle` transaction creation to `Aepp` rpc
* **Docs:** Add `tx builder` docs
* **Docs:** Add doc's for `utils/bytes` and tx builder `schema`
* **TX_BUILDER:** refactor `calculateFee` function in `TxBuilder`(use BigNumber)
* **TX_BUILDER:** Extend response of `Oracle`, `Aens`, `Contrat` with `rawTx`
* **Ae:** Change response of `send` function now it's and object with transaction data(hash, rawTxHash, ...)
* **Chain:** Move `Contract` and `Oracle` API wrapper's to `Chain` stamp
* **Chore:** Rename `epoch` in `CHANGELOG`, `README`, `HACKING`

### Bug Fixes

* **Rpc:** `RpcServer`: Avoid storing of `window` in `instance` properties
* **Chain:** Disable `balance formatting` by default
* **Chain:** Move `verification of transaction` to `chain` stamp
* **Node:** Retrieve `node` version from `/api`
* **Chore:** Fix unpack tx example in `bin/aecrypto.js`
* **Chore:** Remove unused function's from `crypto.js`

### BREAKING CHANGES

* **TX:** Remove old transaction builder `es/tx/js.js` (Please use `es/tx/builder` instead)
* **Chore:** Rename `es/epoch.js` to `es/node.js`
* **Chore:** Rename `Oracle`, `Contract`, `Chain` API wrapper files from `epoch` to `node`
* **Chore:** Rename `Contract` api wrapper method's

## [1.3.2](https://github.com/aeternity/aepp-sdk-js/compare/1.3.1...1.3.2) (2019-02-01)

### Features

* **Ae:** Add `destroyInstance` function to `Ae` stamp which remove all listeners for RPC event's
* **Docs:** Add docs for `TransactionValidator` and `TxBuilder` stamp's
* **Build:** Add `TxBuilderHelper` to bundle
* **Chore:** Contract call static now using `dry-run` API
* **Test:** Improve test's for Transaction verification

### Changed

* **Docs:** Adjust doc's for `Contract` and `Aens` stamp's
* **Chore:** Fix decoding of address from contract call

## [1.3.1](https://github.com/aeternity/aepp-sdk-js/compare/1.3.0...1.3.1) (2019-01-29)

### Features

* **Build:** Remove KeyStore from bundle due to build issue(for now you can export it only using tree-shaking `import * as Keystore from '@aeternity/aepp-sdk/utils/keystore'`)

## [1.3.0](https://github.com/aeternity/aepp-sdk-js/compare/1.2.1...1.3.0) (2019-01-29)

### Features

* **Channel:** Add support for State Channels
* **TX_BUILDER:** New transaction builder going through schema(build, unpack)
* **TX_VALIDATOR:** Add new stamp `TransactionValidator` which can verify your transaction
* **Chore:** Rename epoch to aeternity node(docker configs, some docs)
* **Tx:** Use new tx builder in TX stamp
* **Contract:** Set default values for amount and deposit to 0 for `contract` transaction
* **Rpc:** Improve RPC server

### Notes and known Issues
- Old transaction builder `es/tx/js.js` will be removed in next major release.

## [1.2.1](https://github.com/aeternity/aepp-sdk-js/compare/1.1.2...1.2.1) (2018-12-21)

### Features

* **Chain:** amount formatter
* **Chain:** amount format balance `client.balance('AK_PUBLICKEY', { format: true })`
* **Aepp:** Oracle and Contracts API to Aepp stamp
* **Chore:** Use `prepare` instead of `postinstall-build` (thanks @davidyuk)
* **Docs:** Refreshed Docs: README.md + docs/usage.md

### Bug Fixes

* **Chr:** Fix Import RLP package (thanks @davidyuk)
* **Rpc:** Fix for NetworkId propagation and override
* **Tx:** TxJS is not a stamp anymore, and instead: it exports helper functions

### BREAKING CHANGES

* **Tx:** TxJs stamp (not a stamp anymore)
* **Chain:** balance now answer a formatted string composed of `AMOUNT + ' ' + unit` (eg. `10 exa` for 10 AE)

### Notes and known Issues

* **Chore:** `10 exa` should be `10 ae`
* **Chain:** format shouldn't be a flag, but a request for `unit` eg. `{ format: `ae` }`

## [1.1.2](https://github.com/aeternity/aepp-sdk-js/compare/1.1.1...1.1.2) (2018-12-15)

### Feature

* **Chore:** isAddressValid check
* **Tx:** Tx Fee formulas

### Bug Fixes

* **Rpc:** Fixed networkId propagation (and overriding on init of Flavors)
* **Crypto:** Fixed encodeBase58Check by feeding Buffered input

### BREAKING CHANGES

* **Chore:** Compatibility with Node >= 1.0.0 and <= 1.1.0

## [1.1.1](https://github.com/aeternity/aepp-sdk-js/compare/1.1.0...1.1.1) (2018-12-11)

### Features

* **Rpc:** Added a command to remove images after CI testing

### Bug Fixes

* **Rpc:** Fix Testing
* **Rpc:** Fixed Oracle error for Wallet flavor

## [1.1.0](https://github.com/aeternity/aepp-sdk-js/compare/1.0.1...1.1.0) (2018-12-11)

### Features

* **Oracle:** Oracles functionality and flavor
* **Aepp:** Simple example of aepp-in-aepp (see `/examples` folder)

### Bug Fixes

* **Tx:** Fixed issue with big numbers and `TX`

## [1.0.1](https://github.com/aeternity/aepp-sdk-js/compare/1.0.0...1.0.1) (2018-11-30)

### Features

* **Node:** ability to support Node range(s) using semver package (see https://www.npmjs.com/package/semver#ranges)

### BREAKING CHANGES

* **Node:** Support for Node >= 1.0.0 and < 2.0.0

## [1.0.0](https://github.com/aeternity/aepp-sdk-js/compare/0.25.0-0.1.1...1.0.0) (2018-11-30)

### Features

* **Contract:** Contract native Transactions

### Bug Fixes

* **BigNumber:** Rolled back to bignumbers.js for easier fix with axios.get/post

### BREAKING CHANGES

* **Node:** Support for Node < 1.0.0
* **Build:** New NETWORK_ID (also used in docker/sdk.env for CI tests)
* **Protocol:** Encoding of transaction (and other objects) [changed from base58check to base64check](https://github.com/aeternity/protocol/blob/master/node/api/api_encoding.md)

### Notes and known Issues

* **Channel:** State Channels have been excluded for problems with CI, will be included in next release

## [0.25.0-0.1.1](https://github.com/aeternity/aepp-sdk-js/compare/0.25.0-0.1.0...0.25.0-0.1.1) (2018-11-30)

### Notes and known Issues

* **Chore:** See [0.25.0-0.1.0]

## [0.25.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/0.25.0-0.1.0-next...0.25.0-0.1.0) (2018-11-30)

### Features

* **Utils** Parsing of `fee` using `bignum.js`
* **Account** Add `networkId` as param to `Account` flavor(default: `ae_mainnet`)
* **Tx** Implement native build of `AENS` transaction.
* **Keystore** Update keystore for new [requirements](https://www.pivotaltracker.com/n/projects/2124891/stories/155155204)

### BREAKING CHANGES

* **CLI** [AE CLI](https://github.com/aeternity/aecli-js) and [AE PROJECT CLI](https://github.com/aeternity/aeproject) moved to separate repos and packages
* **Node** Support for < 0.25.0

## [0.25.0-0.1.0-next](https://github.com/aeternity/aepp-sdk-js/compare/0.24.0-0.2.0...0.25.0-0.1.0-next) (2018-11-30)

### Features

* **Contract** Contract type checked call (Ability to call contract using contract address)
* **Contract** Use ES methods instead of Ramda, where possible

### Bug Fixes

* **Contract** Fixed keystore by adding a salt param for derivedKey function

### Breaking Changes

* **Contract** Support for < 0.25.0
* **Contract** Aens use domain `.test` instead of `.aet` (see [here](https://github.com/aeternity/aepp-sdk-js/commit/9c252f937f7ea501c4aaacbbef53c4c1833e48e4#diff-8ef3b328d008ef3dbb72a0bca42eba37L24))
* **Contract** Use NETWORK_ID for signing (see [here](https://github.com/aeternity/aepp-sdk-js/commit/9c252f937f7ea501c4aaacbbef53c4c1833e48e4#diff-ffb275ebb09085c85c59f140998199e0R28))

## [0.24.0-0.2.0](https://github.com/aeternity/aepp-sdk-js/compare/v0.24.0-0.1.0...v0.24.0-0.2.0) (2018-10-30)

### Features

* **Rpc** RPC Client improvements
* **Rpc** `onContract` Guard
* **CLI**  born
* **CLI** `Host` parameter became `Url`. (`-u` for hostname, `-U` for internal)
* **CLI** New keystore following these specifications: https://www.pivotaltracker.com/n/projects/2124891/stories/155155204

### BREAKING CHANGES

* **Chore** The `Cli` flavor is now `Universal`
* **Chore** the keypair keys changed from `{ pub, priv }` to `{ publicKey, secretKey }` for consistency with other systems using them (eg. AirGap and [HD Wallet](https://github.com/aeternity/hd-wallet-js))

### Notes and known Issues

* **Chore** CLI and AE PROJECT CLI will move to a separate package

## [0.24.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/0.22.0-0.1.0-beta.1...v0.24.0-0.1.0) (2018-10-23)

### Features

* **Node** Full support of [Node-0.24.0](https://github.com/aeternity/aeternity/releases/tag/v0.24.0)
* **CLI**  Develop `decode base58` address command in `crypto` module
* **CLI** Add `nonce` param to all tx command's
* **CLI** Add `gas` param to `deploy` and `call` commands
* **Tx** Add ability to create `spend` transaction natively
* **Keystore** Implement `ethereum keystore` using `AES-126-CTR` and `SCRYPT` as key derivation function
* **CLI** Change `--privateKey` to `flag` on `ACCOUNT ADDRESS` command
* **Build** Change `node version` in `Dockerfile`
* **Node** API endpoints to meet new Node specifications
* **Chore** Update `docco` config and change `rename` package to `recursive-rename`
* **Docs** Improved documentation

### BREAKING CHANGES

* **Node** Support for < 0.24.0
* **Keystore** `ethereum keystore` usage will be removed in the next release
* **CLI** CLI will move to a separate package

## [0.22.0-0.1.0-beta.1](https://github.com/aeternity/aepp-sdk-js/compare/v0.18.0-0.1.1...0.22.0-0.1.0-beta.1) (2018-10-02)

### Features

* **CLI** Add **CLI** implementation
* **Crypto** nameId function for commitment hash calculations
* **Node** API endpoints to meet new Node specifications
* **Tx** Add Nonce calculation on SDK side
* **Contract** Add check for MAX_GAS in call and deploy contract
* **Chore** change hash prefix separator from $ to _
* **Chore** Add keywords ('SDK', 'CLI') to package.json
* **CLI** Link aecli to `./bin/aecli.js` in package.json (After "npm link" you can use CLI globally)
* **Aens** Wait until pre-claim transaction block was mined before send claim transaction
* **Build** Updated `webpack`, `webpack-cli` and added new dev deps accordingly
* **Node** Add Node Compatibility Check

### Bug Fixes

* **Crypto** Fixes commitment hash calculations in naming system, to be `Hash(nameId(name) + name_salt)` instead of `Hash(Hash(name + name_salt))`.

### BREAKING CHANGES

* **Node** Support for < 0.22.0

## [0.18.0-0.1.1](https://github.com/aeternity/aepp-sdk-js/compare/v0.18.0-0.1.0...v0.18.0-0.1.1) (2018-07-31)

### Features

* **Docs** Lots of new documentation (prose and API)
* **Docs** Fancy badges to README
* **Build** Transitive dev dependencies for standard-loader not covered by pnpm
* **Build** CI Dockerfile to include pnpm
* **Docs** Fancy-shmancy diagram in README
* **Docs**Generated documentation files since they are linked in static docs
* **Build** Switch from Yarn to pnpm for building
* **Docs** Structure of documentation
* **Docs** Generate Markdown from Docco

## [0.18.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/v0.15.0-0.1.0...v0.18.0-0.1.0) (2018-07-24)

### Features

* **Node** Support for Node 0.18.0 (changed endpoints)
* **RPC** Wallet/Aepp RPC support
* **Contract** Contract call result decoding support
* **Docs** Per-module API documentation (Markdown based on JSDoc)
* **Docs** More API documentation (still incomplete)
* **Build** SDK entrypoint factories (in `/es/ae/universal.js`)
* **Build** Module load path (src -> es)
* **Chore** Lower mining rate (5s) in docker-compose

### Bug Fixes

* **Crypto** Symmetric key encryption/decryption

### BREAKING CHANGES

* **Node** Support for < 0.18.0 (changed endpoints)

## [0.15.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/v0.14.0-0.1.0...v0.15.0-0.1.0) (2018-06-12)

### Features

* **Node** Legacy Swagger file loading
* **Node** Compatibility with < 0.15.0

### Bug Fixes

* **Contract** Contract unit state initialization
* **Node** Missing required parameter for name transfers (workaround for
  [Swagger file bug](https://www.pivotaltracker.com/n/projects/2124891))

## [0.14.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/v0.13.0-0.1.1...v0.14.0-0.1.0) (2018-06-11)

### Features

* **API** New, opinionated top-level API
* **API** Rest of legacy API now uses new API as well
* **API** Generated API now encapsulated in `api` object
* **API** Automatic case conversion for remote parameter names
* **API** Remaining tests to use new API
* **API** Adapted new method of obtaining transaction hash, breaks compatibility (see
  below)

### Bug Fixes

* **API** [GH-49]: Handle existing path components correctly

### BREAKING CHANGES
* **API** Remove Oracle API (for the time being)
* **API** Remove Legacy API and tests
* **API** Remove Compatibility with older versions of Node which provide the transaction hash
  the old way

## [0.13.0-0.1.1](https://github.com/aeternity/aepp-sdk-js/compare/v0.13.0-0.1.0...v0.13.0-0.1.1) (2018-05-24)

### Features

* **Node** Switch to curve ed25519 (from secp256k1) to align with Node protocol changes
* **Node** Generate basic API directly from Swagger files, also validate input data
* **Build** Compiled library now self-contained with all dependencies
* **Build** Use Webpack 4 based cross-platform (Node/Web) compilation
* **Docs** Package description now reads `SDK for the æternity blockchain`
* **Chore** Authors are now taken from `AUTHORS` instead of `package.json`
* **Docs** Moved code examples from README to separate file in docs

### BREAKING CHANGES

* **Node** Defunct scripts; will be brought back later

### Bug Fixes

* **Chore** More consistent code examples
