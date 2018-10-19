# Change Log
All notable changes to this project will be documented in this file. This change
log follows the conventions of [keepachangelog.com](http://keepachangelog.com/).

## [0.24.0-0.1.0-alpha.1]
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
- SDK entrypoint factories (in `/es/ae/cli.js`)

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