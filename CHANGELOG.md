# Change Log
All notable changes to this project will be documented in this file. This change
log follows the conventions of [keepachangelog.com](http://keepachangelog.com/).

## [1.1.1]
### Added
- none

### Changed
- Fix Testing
- Added a command to remove images after CI testing
- Fixed Oracle error for Wallet flavor

### Removed
- none

### Breaking Changes
- none

### Notes and known Issues
- none

## [1.1.0]
### Added
- Oracles functionality and flavor
- Simple example of aepp-in-aepp (see `/examples` folder)

### Changed
- Fixed issue with big numbers and `TX`

### Removed
- none

### Breaking Changes
- none

### Notes and known Issues
- none

## [1.0.1]
### Added
- ability to support Epoch range(s) using semver package (see https://www.npmjs.com/package/semver#ranges)

### Changed
- Support for Epoch >= 1.0.0 and < 2.0.0

### Removed
- none

### Breaking Changes
- none

### Notes and known Issues
- none



## [1.0.0]
### Added
- Contract native Transactions

### Changed
- Rolled back to bignumbers.js for easier fix with axios.get/post

### Removed
- Support for Epoch < 1.0.0

### Breaking Changes
- New NETWORK_ID (also used in docker/sdk.env for CI tests)
-  Encoding of transaction (and other objects) [changed from base58check to base64check](https://github.com/aeternity/protocol/blob/epoch-v1.0.0/epoch/api/api_encoding.md)

### Notes and known Issues
- State Channels have been excluded for problems with CI, will be included in next release


## [0.25.0-0.1.1]
### Added
- see [0.25.0-0.1.0]

### Changed
- Change bignumbers.js with [bn.js](https://github.com/indutny/bn.js/) due to binding errors in browser's package

### Removed
- see [0.25.0-0.1.0]

### Breaking Changes
- see [0.25.0-0.1.0]

### Notes and known Issues
- none, see [0.25.0-0.1.0]

## [0.25.0-0.1.0]
### Added
- Parsing of `fee` using `bignum.js`
- Add `networkId` as param to `Account` flavor(default: `ae_mainnet`)
- Implement native build of `AENS` transaction.

### Changed
- Update keystore for new [requirements](https://www.pivotaltracker.com/n/projects/2124891/stories/155155204)
-
### Removed
- Support for < 0.25.0
- [AE CLI](https://github.com/aeternity/aecli-js) and [AE PROJECT CLI](https://github.com/aeternity/aeproject) moved to separate repos and packages

### Breaking Changes
- Use NETWORK_ID for signing (see [here](https://github.com/aeternity/aepp-sdk-js/commit/9c252f937f7ea501c4aaacbbef53c4c1833e48e4#diff-ffb275ebb09085c85c59f140998199e0R28))
- Keystore format [changes](https://www.pivotaltracker.com/n/projects/2124891/stories/155155204)

### Notes and known Issues
- none


## [0.25.0-0.1.0-next]
### Added
- Contract type checked call (Ability to call contract using contract address)

### Changed
- Use ES methods instead of Ramda, where possible
- Fixed keystore by adding a salt param for derivedKey function

### Removed
- Support for < 0.25.0
- [AE CLI](https://github.com/aeternity/aecli-js) and [AE PROJECT CLI](https://github.com/aeternity/aeproject) moved to separate repos and packages

### Breaking Changes
- Aens use domain `.test` instead of `.aet` (see [here](https://github.com/aeternity/aepp-sdk-js/commit/9c252f937f7ea501c4aaacbbef53c4c1833e48e4#diff-8ef3b328d008ef3dbb72a0bca42eba37L24))
- Use NETWORK_ID for signing (see [here](https://github.com/aeternity/aepp-sdk-js/commit/9c252f937f7ea501c4aaacbbef53c4c1833e48e4#diff-ffb275ebb09085c85c59f140998199e0R28))

### Notes and known Issues


## [0.24.0-0.2.0]
### Added
- RPC Client improvements
- (RPC) `onContract` Guard
- (AE PROJECT CLI) born

### Changed
- (CLI) New keystore following these specifications: https://www.pivotaltracker.com/n/projects/2124891/stories/155155204
- (CLI) `Host` parameter became `Url`. (`-u` for hostname, `-U` for internal)

### Breaking Changes
- The `Cli` flavor is now `Universal`
- the keypair keys changed from `{ pub, priv }` to `{ publicKey, secretKey }` for consistency with other systems using them (eg. AirGap and [HD Wallet](https://github.com/aeternity/hd-wallet-js))

### Notes and known Issues
- CLI and AE PROJECT CLI will move to a separate package



## [0.24.0-0.1.0]
### Added
- Full support of [Epoch-0.24.0](https://github.com/aeternity/epoch/releases/tag/v0.24.0)
- (CLI) Develop `decode base58` address command in `crypto` module
- (CLI) Add `nonce` param to all tx command's
- (CLI) Add `gas` param to `deploy` and `call` commands
- Add ability to create `spend` transaction natively
- Implement `ethereum keystore` using `AES-126-CTR` and `SCRYPT` as key derivation function

### Changed
- (CLI) Change `--privateKey` to `flag` on `ACCOUNT ADDRESS` command
- Change `node version` in `Dockerfile`
- API endpoints to meet new Epoch specifications
- Update `docco` config and change `rename` package to `recursive-rename`
- Improved documentation

### Removed
- Support for < 0.24.0

### Notes and known Issues
- `ethereum keystore` usage will be removed in the next release
- CLI will move to a separate package


## [0.22.0-0.1.0-beta.1]
### Added
- Add **CLI** implementation
- nameId function for commitment hash calculations

### Changed
- API endpoints to meet new Epoch specifications
- Add Nonce calculation on SDK side
- Add check for MAX_GAS in call and deploy contract
- change hash prefix separator from $ to _
- Add keywords ('SDK', 'CLI') to package.json
- Link aecli to `./bin/aecli.js` in package.json (After "npm link" you can use CLI globally)
- Wait until pre-claim transaction block was mined before send claim transaction
- Updated `webpack`, `webpack-cli` and added new dev deps accordingly
- Add Epoch Compatibility Check
- Add SDK nonce calculations
- Fixes commitment hash calculations in naming system, to be `Hash(nameId(name) + name_salt)` instead of `Hash(Hash(name + name_salt))`.

### Removed
- Support for < 0.22.0

## [0.18.0-0.1.1]
### Added
- Lots of new documentation (prose and API)
- Fancy badges to README
- Transitive dev dependencies for standard-loader not covered by pnpm
- CI Dockerfile to include pnpm
- Fancy-shmancy diagram in README
- Generated documentation files since they are linked in static docs

### Changed
- Switch from Yarn to pnpm for building
- Structure of documentation
- Generate Markdown from Docco

## [0.18.0-0.1.0]
### Added
- Support for Epoch 0.18.0 (changed endpoints)
- Wallet/Aepp RPC support
- Contract call result decoding support
- Per-module API documentation (Markdown based on JSDoc)
- More API documentation (still incomplete)
- SDK entrypoint factories (in `/es/ae/universal.js`)

### Removed
- Support for < 0.18.0 (changed endpoints)

### Changed
- Module load path (src -> es)
- Lower mining rate (5s) in docker-compose

### Fixed
- Symmetric key encryption/decryption

## [0.15.0-0.1.0]
### Removed
- Legacy Swagger file loading
- Compatibility with < 0.15.0

### Fixed
- Contract unit state initialization
- Missing required parameter for name transfers (workaround for
  [Swagger file bug])

[Swagger file bug]: https://www.pivotaltracker.com/n/projects/2124891

## [0.14.0-0.1.0]
### Added
- New, opinionated top-level API

### Changed
- Rest of legacy API now uses new API as well
- Generated API now encapsulated in `api` object
- Automatic case conversion for remote parameter names
- Remaining tests to use new API
- Adapted new method of obtaining transaction hash, breaks compatibility (see
  below)

### Removed
- Oracle API (for the time being)
- Legacy API and tests
- Compatibility with older versions of Epoch which provide the transaction hash
  the old way

### Fixed
- [GH-49]: Handle existing path components correctly

## [0.13.0-0.1.0]
### Added
- This change log file

### Changed
- Switch to curve ed25519 (from secp256k1) to align with Epoch protocol changes
- Generate basic API directly from Swagger files, also validate input data
- Compiled library now self-contained with all dependencies
- Use Webpack 4 based cross-platform (Node/Web) compilation
- Package description now reads `SDK for the æternity blockchain`
- Authors are now taken from `AUTHORS` instead of `package.json`
- Moved code examples from README to separate file in docs

### Removed
- Defunct scripts; will be brought back later

### Fixed
- More consistent code examples

[0.13.0-0.1.0]: https://github.com/aeternity/aepp-sdk-js/compare/v0.10.0-0.1.0...v0.13.0-0.1.0
[0.14.0-0.1.0]: https://github.com/aeternity/aepp-sdk-js/compare/v0.13.0-0.1.0...v0.14.0-0.1.0
[0.15.0-0.1.0]: https://github.com/aeternity/aepp-sdk-js/compare/v0.14.0-0.1.0...v0.15.0-0.1.0
[0.18.0-0.1.0]: https://github.com/aeternity/aepp-sdk-js/compare/v0.15.0-0.1.0...v0.18.0-0.1.0
[0.18.0-0.1.1]: https://github.com/aeternity/aepp-sdk-js/compare/v0.18.0-0.1.0...v0.18.0-0.1.1
[0.22.0-0.1.0-beta.1]: https://github.com/aeternity/aepp-sdk-js/compare/v0.18.0-0.1.1...v0.22.0-0.1.0-beta.1
[0.24.0-0.1.0]: https://github.com/aeternity/aepp-sdk-js/compare/v0.22.0-0.1.0-beta.1...v0.24.0-0.1.0
[0.24.0-0.2.0]: https://github.com/aeternity/aepp-sdk-js/compare/v0.24.0-0.1.0...v0.24.0-0.2.0
[0.25.0-0.1.0-next]: https://github.com/aeternity/aepp-sdk-js/compare/v0.24.0-0.2.0...v0.25.0-0.1.0-next
[0.25.0-0.1.0]: https://github.com/aeternity/aepp-sdk-js/compare/v0.25.0-0.1.0-next...v0.25.0-0.1.0
[0.25.0-0.1.1]: https://github.com/aeternity/aepp-sdk-js/compare/v0.25.0-0.1.0...v0.25.0-0.1.1
[1.0.0]: https://github.com/aeternity/aepp-sdk-js/compare/v0.25.0-0.1.0...1.0.0
[1.0.1]: https://github.com/aeternity/aepp-sdk-js/compare/1.0.0...1.0.1
[1.1.0]: https://github.com/aeternity/aepp-sdk-js/compare/1.0.0...1.1.0
