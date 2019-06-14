# How to Connect 2 Aepps using Aeternity's JS SDK

## Introduction

This [connect-two-aepp](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/connect-two-ae) example project has been created to **showcase the aeternity SDK implementation** for both Base/Wallet Aepps and "regular" Aepps "depending" on a base (Wallet/Identity/Base) Aepp.

## 0. Setup info
If you are trying these examples after checking out the entire Aepp-SDK repo (this repo), you want to first run `npm install`, from the repo root, to get all the SDK dependecies installed, and only then, move to individual apps (point nr. 1 and point nr. 2) installations.

## 1. Base Aepp

The [Base/Wallet/Identity Aepp](identity/README.md) example project shows how you can create a simple Aeternity Wallet Aepp.

## 2. Sample Aepp

The Sample [Aepp](aepp/README.md) project shows how you can create a simple Aeternity Aepp, dependent on a wallet/base aepp, in this case: offering the possibility to work with contracts.

### 3. How it works

1. Start the [Base/Wallet/Identity Aepp](identity/README.md), which will start on port `9000`
2. Start the [Aepp](aepp/README.md), which will start on port `9001`
3. Visit `localhost:9000` to see the Base/Wallet/Idendity Aepp (nr. 1), with the generic Aepp (nr. 2) included in it through an iFrame.
