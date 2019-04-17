# [3.0.0](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...3.0.0) (2019-04-17)


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



# [2.4.1](https://github.com/aeternity/aepp-sdk-js/compare/2.4.0...2.4.1) (2019-04-17)


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


# [2.4.0](https://github.com/aeternity/aepp-sdk-js/compare/2.3.2...2.4.0) (2019-04-17)


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


# [2.3.1](https://github.com/aeternity/aepp-sdk-js/compare/2.3.0...2.3.1) (2019-02-22)


### Features

* **Oracle:** `Oracle` fee calculation
* **Tx:** `getAccountNonce` function to `tx` stamp
* **TX_BUILDER:** Change `FEE_BYTE_SIZE` from 1 to 8 bytes in `fee` calculation
* **TX_BUILDER:** Improve error handling in `tx` builder


# [2.3.0](https://github.com/aeternity/aepp-sdk-js/compare/2.3.0-next...2.3.0) (2019-02-22)


### Features

* **Node:** `Minerva` comparability
* **Utils:** `Mnemonic` wallet implementation `es/utils/hd-wallet`
* **Oracle:** Change Channel `legacy` API to `JSON RPC`
* **Oracle:** Change default `gasPrice` to `1e6`
* **Oracle:** Change `minFee` calculation, multiply min fee by `1e9`

### BREAKING CHANGES

* **Node:** Change supported node version range to `1.4.0 <= version < 3.0.0`
* This release contain changes from: [2.3.0-next](https://github.com/aeternity/aepp-sdk-js/releases/tag/2.3.0-next), [2.2.1-next](https://github.com/aeternity/aepp-sdk-js/releases/tag/2.2.1-next), [2.1.1-0.1.0-next](https://github.com/aeternity/aepp-sdk-js/releases/tag/2.1.1-0.1.0-next), [2.1.0](https://github.com/aeternity/aepp-sdk-js/releases/tag/2.1.0)



# [2.3.0-next](https://github.com/aeternity/aepp-sdk-js/compare/2.2.1-next...2.3.0-next) (2019-02-21)


### Features

* **Channel:** `channel` `withdraw` and `deposit` methods
* **TX_BUILDER:** Change default `gasPrice` in `Contract` stamp and `Tx` stamp to `1e9`
* **TX:** Fix `contract` tx `fee` calculation
* **Chain:** Refactor error handling in `sendTransaction` function
* **Contract:** Change default `gasPrice` to `1e9`
* **TX_BUILDER:** Change `Fee` byte_size to 1



# [2.2.1-next](https://github.com/aeternity/aepp-sdk-js/compare/2.1.1-0.1.0-next...2.2.1-next) (2019-02-21)


### Feature

* **TX_BUILDER:** Add `deserialization` schema for `Channel` transactions(`channelCreate`, `channelCloseMutual`, `channelDeposit`, `channelWithdraw`, `channelSettle`) 
* **Chain:** Add `rawTx` and `verifyTx` to error from poll function(when you wait for transaction will mined)
* **Chore:** Depend on `bip39` from npm instead of git repo
* **Channel:** Change Channel `legacy` API to `JSON RPC`
* **TX_BUILDER:** Change `minFee` calculation, multiply min fee by 10^9


# [2.1.1-0.1.0-next](https://github.com/aeternity/aepp-sdk-js/compare/2.1.0...2.1.1-0.1.0-next) (2019-02-21)


### Bug Fixes
* **Chore:** Fix linter errors



# [2.1.0](https://github.com/aeternity/aepp-sdk-js/compare/2.0.0...2.1.0) (2019-02-21)


### Features

* **Node:** `Minerva` comparability
* **Utils:** Add `Mnemonic` wallet implementation `es/utils/hd-wallet`


### BREAKING CHANGES

* **Node:** Change supported node version range to `1.4.0 <= version < 3.0.0`



# [2.0.0](https://github.com/aeternity/aepp-sdk-js/compare/1.3.2...2.0.0) (2019-02-21)


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



# [1.3.0](https://github.com/aeternity/aepp-sdk-js/compare/1.2.1...1.3.0) (2019-01-29)


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



# [1.1.0](https://github.com/aeternity/aepp-sdk-js/compare/1.0.1...1.1.0) (2018-12-11)


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



# [0.24.0-0.2.0](https://github.com/aeternity/aepp-sdk-js/compare/v0.24.0-0.1.0...v0.24.0-0.2.0) (2018-10-30)



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




# [0.24.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/0.22.0-0.1.0-beta.1...v0.24.0-0.1.0) (2018-10-23)


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



# [0.22.0-0.1.0-beta.1](https://github.com/aeternity/aepp-sdk-js/compare/v0.18.0-0.1.1...0.22.0-0.1.0-beta.1) (2018-10-02)

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



# [0.18.0-0.1.1](https://github.com/aeternity/aepp-sdk-js/compare/v0.18.0-0.1.0...v0.18.0-0.1.1) (2018-07-31)

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



# [0.18.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/v0.15.0-0.1.0...v0.18.0-0.1.0) (2018-07-24)


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




# [0.15.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/v0.14.0-0.1.0...v0.15.0-0.1.0) (2018-06-12)


### Features

* **Node** Legacy Swagger file loading
* **Node** Compatibility with < 0.15.0


### Bug Fixes

* **Contract** Contract unit state initialization
* **Node** Missing required parameter for name transfers (workaround for
  [Swagger file bug](https://www.pivotaltracker.com/n/projects/2124891))



# [0.14.0-0.1.0](https://github.com/aeternity/aepp-sdk-js/compare/v0.13.0-0.1.1...v0.14.0-0.1.0) (2018-06-11)


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



# [0.13.0-0.1.1](https://github.com/aeternity/aepp-sdk-js/compare/v0.13.0-0.1.0...v0.13.0-0.1.1) (2018-05-24)


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
