# How to Connect 2 Aepps using Aeternity's JS SDK

## Introduction

This [connect-two-aepp](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/connect-two-ae) example project has been created to **showcase the aeternity SDK implementation** for both Base/Wallet Aepps and "regular" Aepps "depending" on a base (Wallet/Identity/Base) Aepp.

## 1. Base Aepp

The [Base/Wallet/Identity Aepp](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/connect-two-ae/identity) example project shows how you can create a simple Aeternity Wallet Aepp.

## 2. Sample Aepp

The Sample [Aepp](https://github.com/aeternity/aepp-sdk-js/tree/master/examples/connect-two-ae/aepp) project shows how you can create a simple Aeternity Aepp, dependent on a wallet/base aepp, in this case: offering the possibility to work with contracts.

### How it works

1. Start the [identity/wallet Aepp](https://github.com/aeternity/aepp-sdk-js/tree/develop/examples/connect-two-ae/identity), which will start on port `9000`
2. Start the [Aepp](https://github.com/aeternity/aepp-sdk-js/tree/develop/examples/connect-two-ae/aepp), which will start on port `9001`
3. Visit `localhost:9000` to see the Base/Wallet/Idendity Aepp, with it's generic Aepp included in it.
