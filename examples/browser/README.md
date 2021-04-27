# How to Connect Wallet to Aepp using Aeternity's JS SDK

## Introduction
In aeternity ecosystem, the app that has access to user's private keys and grants other apps
access to them is called wallet. Respectively, the app that is granted access is called aepp.

This folder has been created to **showcase the aeternity SDK integration** to both wallets and aepps.

## Setup info
If you are trying these examples after checking out the entire Aepp-SDK repo (this repo),
you want to first run `npm install`, from the repo root, to get all the SDK dependencies installed,
and only then, move to individual apps installations.

## Available examples

### 1. Aepp
The Sample [Aepp](aepp) project (Distributed App or dapp) shows how you can create a simple Aeternity Aepp,
dependent on a Wallet, in this case: offering the possibility to work with contracts.

### 2. Wallet WebExtension
The [Wallet WebExtension](wallet-web-extension) example project shows how you can create a simple
Aeternity Wallet as a Chrome/Firefox browser extension. This approach is actively used in
[Superhero Wallet](https://github.com/aeternity/superhero-wallet).

### 3. iframe-based Wallet
The [Wallet](wallet-iframe) example project shows how you can create a simple Aeternity Wallet
that opens aepps in iframe. This approach is actively used in [Base aepp](https://github.com/aeternity/aepp-base).
