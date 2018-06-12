# Change Log
All notable changes to this project will be documented in this file. This change
log follows the conventions of [keepachangelog.com](http://keepachangelog.com/).

## [Unreleased]
### Added

### Changed

### Removed
- Legacy Swagger file loading
- Compatibility with < 0.15.0

### Fixed
- Contract unit state initialization

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
[Unreleased]: https://github.com/aeternity/aepp-sdk-js/compare/v0.14.0-0.1.0...develop
[GH-49]: https://github.com/aeternity/aepp-sdk-js/issues/49
